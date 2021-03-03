// axios
const axios = require("axios");

// lodash
const _ = require("lodash");

// utilities
const { checkValid } = require("../../../utils/utils");

// models
const GoogleConnectProfile = require("../../../models/integrations/google/GoogleConnectProfile");
const IntegrationUser = require("../../../models/integrations/integration_objects/IntegrationUser");
const IntegrationDrive = require("../../../models/integrations/integration_objects/IntegrationDrive");
const IntegrationDocument = require("../../../../models/integrations/integration_objects/IntegrationDocument");
const IntegrationAttachment = require("../../../models/integrations/integration_objects/IntegrationAttachment");
const IntegrationInterval = require("../../../models/integrations/integration_objects/IntegrationInterval");
const Repository = require("../../../models/Repository");

// google api
const { google } = require("googleapis");

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

const REDIRECT_URL =
    "http://localhost:3001/api/integrations/connect/google/callback";

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URL
);

const googleAPI = axios.create({
    baseURL: "https://www.googleapis.com",
});

acquireGoogleConnectProfile = async (userId) => {
    const googleConnectProfile = await GoogleConnectProfile.findOne({
        user: userId,
        isReady: true,
    })
        .populate("user")
        .lean()
        .exec();

    return googleConnectProfile;
};

acquireExternalGoogleDrives = async (profile) => {
    const {
        accessToken,
        refreshToken,
        scope,
        idToken,
        user: { _id: userId, firstName, lastName },
    } = profile;

    const tokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
        scope,
        id_token: idToken,
    };

    oauth2Client.setCredentials(tokens);

    const driveAPI = google.drive({ version: "v3", auth: oauth2Client });

    let completedScrape = false;

    let drives = [
        {
            id: `${userId}-google-drive`,
            name: `${firstName} ${lastName}'s Personal Drive`,
        },
    ];

    let pageToken;

    while (!completedScrape) {
        const queryParameters = {
            pageSize: 100,
        };

        if (checkValid(pageToken)) {
            queryParameters["pageToken"] = pageToken;
        }

        let response;

        try {
            response = await driveAPI.drives.list(queryParameters);
        } catch (e) {
            throw new Error(e);
        }

        const { drives: retrievedDrives, nextPageToken } = response;

        retrievedDrives.map((drive) => _.pick(drive, ["id", "name"]));

        drives = [...drives, ...retrievedDrives];

        if (!nextPageToken) completedScrape = true;

        pageToken = nextPageToken;
    }

    return drives;
};

extractSharedDriveUsers = async (driveAPI, driveId, workspace) => {
    const { memberUsers } = workspace;

    let pageToken;

    let isScrapeCompleted = false;

    let users = [];

    while (isScrapeCompleted) {
        let queryParameters = {
            pageSize: 100,
            fileId: driveId,
        };

        if (checkValid(pageToken)) {
            queryParameters.pageToken = pageToken;
        }

        let response;

        try {
            response = await driveAPI.permissions.list(queryParameters);
        } catch (e) {
            throw new Error(e);
        }

        const { permissions, nextPageToken } = response;

        permissions = permissions.filter((perm) => perm.type == "user");

        permissions.map((permission) => {
            const { emailAddress, displayName } = permission;

            let foundUserId;

            memberUsers.map((user) => {
                const { firstName, lastName, email } = user;

                if (
                    displayName == `${firstName} ${lastName}` ||
                    email == emailAddress
                ) {
                    foundUserId = user._id;
                }
            });

            if (foundUserId) permission.userId = foundUserId;
        });

        users = [...users, ...permissions];

        pageToken = nextPageToken;

        if (!pageToken) isScrapeCompleted = true;
    }

    let existingUsers;

    try {
        const emails = users.map((user) => user.emailAddress);

        let query = IntegrationUser.find({
            source: "google",
        });

        query.where("email").in(emails);

        existingUsers = await query.lean().exec();
    } catch (e) {
        throw new Error(e);
    }

    let existingEmails = new Set(existingUsers.map((user) => user.email));

    users.filter((user) => !existingEmails.has(user.email));

    try {
        users = await Promise.all(
            users.map((user) => {
                const { id, userId, emailAddress, displayName } = user;

                user = new IntegrationUser({
                    sourceId: id,
                    source: "google",
                    name: displayName,
                    email: emailAddress,
                    user: userId,
                    created: { type: Date, default: Date.now },
                });

                return user.save();
            })
        );
    } catch (e) {
        throw new Error(e);
    }

    users = [...users, ...existingUsers];

    return _.mapKeys(user, "email");
};

extractGoogleDrive = async (
    driveAPI,
    driveId,
    repositoryIds,
    userId,
    isPersonal
) => {
    let drive;

    try {
        drive = driveAPI.drives.get({ driveId });
    } catch (e) {
        throw new Error(e);
    }

    const { id, name, createdTime } = drive;

    try {
        drive = new IntegrationDrive({
            name,
            source: "google",
            sourceId: id,
            repositories: repositoryIds,
            integrationCreator: userId,
            isPersonal,
            sourceCreationDate: new Date(createdTime),
        });

        drive = await drive.save();
    } catch (e) {
        throw new Error(e);
    }

    return drive;
};

extractGoogleRawDocuments = async (driveAPI, driveId) => {
    let isScrapeCompleted = false;

    let pageToken;

    let documents = [];

    while (!isScrapeCompleted) {
        let response;

        let queryParameters = {
            pageSize: 1000,
            fields: `files(webViewLink), files(id), files(mimeType), files(createdTime), files(modifiedTime), files(owners), files(lastModifyingUser)`,
        };

        if (checkValid(pageToken)) {
            queryParameters.pageToken = pageToken;
        }

        if (checkValid(driveId)) {
            queryParameters.driveId = driveId;
        }

        try {
            response = await driveAPI.files.list(queryParameters);
        } catch (e) {
            throw new Error(e);
        }

        const { files, nextPageToken } = response.data;

        documents = [...documents, ...files];

        pageToken = nextPageToken;

        if (!pageToken) isScrapeCompleted = true;
    }

    return _.mapKeys(documents, "id");
};

extractPersonalDriveUsers = async (workspace, documents) => {
    const { memberUsers } = workspace;

    let users = {};

    documents.map((doc) => {
        let { owners, lastModifyingUser } = doc;

        owners.push(lastModifyingUser);

        owners.map((member) => {
            const { emailAddress } = member;

            if (emailAddress in users) return;

            users[emailAddress] = member;
        });
    });

    users = Object.values(users);

    users.map((externalUser) => {
        const { displayName, emailAddress } = externalUser;

        let foundUserId;

        memberUsers.map((user) => {
            const { firstName, lastName, email } = user;

            if (
                displayName == `${firstName} ${lastName}` ||
                email == emailAddress
            ) {
                foundUserId = user._id;
            }
        });

        externalUser.userId = foundUserId;
    });

    let existingUsers;

    try {
        const emails = users.map((user) => user.emailAddress);

        let query = IntegrationUser.find({
            source: "google",
        });

        query.where("email").in(emails);

        existingUsers = await query.lean().exec();
    } catch (e) {
        throw new Error(e);
    }

    let existingEmails = new Set(existingUsers.map((user) => user.email));

    users.filter((user) => !existingEmails.has(user.email));

    try {
        users = await Promise.all(
            users.map((user) => {
                const { id, userId, emailAddress, displayName } = user;

                user = new IntegrationUser({
                    sourceId: id,
                    source: "google",
                    name: displayName,
                    email: emailAddress,
                    user: userId,
                    created: { type: Date, default: Date.now },
                });

                return user.save();
            })
        );
    } catch (e) {
        throw new Error(e);
    }

    users = [...users, ...existingUsers];

    return _.mapKeys(user, "email");
};

storeGoogleDocuments = async (docsAPI, drive, members, documents) => {
    let docs = documents.filter((doc) => {
        const { mimeType } = doc;

        return mimeType == "application/vnd.google-apps.document";
    });

    let docsToAttachments;

    try {
        docsToAttachments = await extractGoogleDocAttachments(
            docsAPI,
            drive._id,
            docs
        );
    } catch (e) {
        throw new Error(e);
    }

    docsToAttachments = _.mapKeys(docsToAttachments, "id");

    let docsToIntervals;

    try {
        docsToIntervals = await extractGoogleDocIntervals(documents, drive._id);
    } catch (e) {
        throw new Error(e);
    }

    docsToIntervals = _.mapKeys(docsToIntervals, "id");

    let insertOps = documents.map((doc) => {
        const {
            webViewLink,
            id,
            mimeType,
            createdTime,
            modifiedTime,
            lastModifyingUser,
            owners,
        } = doc;

        let ownerEmails = owners
            ? owners.map((owner) => owner.emailAddress)
            : [];

        let docMemberEmails = Array.from(
            new Set([lastModifyingUser.emailAddress, ...ownerEmails])
        );

        let memberIds = docMemberEmails.map((email) => members[email]._id);

        let attachmentIds = docsToAttachments[id].attachments.map(
            (att) => att._id
        );

        let intervalIds = docsToIntervals[id].intervals.map(
            (interval) => interval._id
        );

        return {
            created: { type: Date, default: Date.now },
            source: "google",
            members: memberIds,
            attachments: attachmentIds,
            intervals: intervalIds,
            link: webViewLink,
            sourceId: id,
            mimeType,
            sourceCreationDate: new Date(createdTime),
            sourceUpdateDate: new Date(modifiedTime),
            drive: drive._id,
        };
    });

    try {
        documents = await IntegrationDocument.insertMany(insertOps);
    } catch (e) {
        throw new Error(e);
    }

    return documents;
};

extractGoogleDocAttachments = async (docsAPI, driveId, docs) => {
    const requests = docs.map((doc) => {
        const { id } = doc;

        return docsAPI.documents.get({ documentId: id });
    });

    let responses;

    try {
        responses = await Promise.all(requests);
    } catch (e) {
        throw new Error(e);
    }

    const docsData = responses.map((response) => response.data);

    let allLinks = [];

    docsData.map((docData, i) => {
        const {
            body,
            title,
            headers,
            footers,
            list,
            revisionId,
            documentId,
        } = docData;

        extraction = decipher(body.content, title);

        const links = extraction["LINKS"];

        allLinks = [...allLinks, ...links];

        docs[i].attachmentLinks = links;
    });

    let attachments;

    try {
        attachments = await createAttachments(allLinks, driveId);
    } catch (e) {
        throw new Error(e);
    }

    docs.map((doc) => {
        const { attachmentLinks } = doc;

        doc.attachments = [];

        attachmentLinks.map((link) => {
            doc.attachments.push(attachments[link]._id);
        });
    });

    return docs;
};

createAttachments = async (links, driveId) => {
    const modelTypeMap = {
        tree: "branch",
        issues: "issue",
        pull: "pullRequest",
        commit: "commit",
    };

    let seenRepositoryFullNames = new Set();

    let seenLinks = new Set();

    let attachments = links
        .filter(
            (link) =>
                link.includes("https://github.com") &&
                link.split("/").length > 1
        )
        .map((link) => {
            const splitURL = link.split("/");

            if (seenLinks.has(link)) return;

            try {
                let githubType = splitURL.slice(
                    splitURL.length - 2,
                    splitURL.length - 1
                )[0];

                const modelType = modelTypeMap[githubType];

                if (!modelType) return;

                const sourceId = splitURL.slice(splitURL.length - 1)[0];

                const fullName = splitURL
                    .slice(splitURL.length - 4, splitURL.length - 2)
                    .join("/");

                seenRepositoryFullNames.add(fullName);

                seenLinks.add(link);

                return {
                    modelType,
                    link,
                    sourceId,
                    drive: driveId,
                    fullName,
                };
            } catch (e) {
                return null;
            }
        })
        .filter((attachment) => checkValid(attachment));

    let repositories;

    try {
        repositories = await Repository.find({
            fullName: { $in: Array.from(seenRepositoryFullNames) },
        });
    } catch (e) {
        throw new Error(e);
    }

    repositories = _.mapKeys(repositories, "fullName");

    attachments.map((att) => {
        const { fullName } = att;

        if (fullName in repositories) {
            att.repository = repositories[fullName]._id;
        }
    });

    try {
        attachments = IntegrationAttachment.insertMany(attachments);
    } catch (e) {
        throw new Error(e);
    }

    return _.mapKeys(attachments, "link");
};

decipher = (bodyContent, title) => {
    //HEADING_1, HEADING_2, HEADING_3, NORMAL_TEXT, LINKS
    const extraction = {};

    bodyContent.map((item) => {
        const { paragraph } = item;

        if (paragraph) {
            const { paragraphStyle, elements } = paragraph;

            let namedStyleType;

            if (paragraphStyle) namedStyleType = paragraphStyle.namedStyleType;

            if (elements) {
                elements.map((elem) => {
                    const { textRun } = elem;

                    if (!textRun) return;

                    let { content, textStyle } = textRun;

                    let type = getContentType(namedStyleType, textStyle);

                    if (type === "LINK") {
                        const {
                            link: { url },
                        } = textStyle;

                        content = url;
                    }

                    insertExtraction(type, content, extraction);
                });
            }
        }
    });

    extraction["TITLE"] = title;

    return extraction;
};

getContentType = (namedStyleType, textStyle) => {
    let type = namedStyleType ? namedStyleType : "NORMAL_TEXT";

    if (!textStyle) return type;

    if ("link" in textStyle) {
        type = "LINK";
    } else if (type === "NORMAL_TEXT" && "fontSize" in textStyle) {
        const { fontSize } = textStyle;
        type =
            fontSize > 20
                ? "HEADING_1"
                : fontSize > 16
                ? "HEADING_2"
                : fontSize > 14
                ? "HEADING_3"
                : type;
    }

    return type;
};

insertExtraction = (type, content, extraction) => {
    if (type in extraction) {
        extraction[type].push(content);
    } else {
        extraction[type] = [content];
    }
};

addDays = (date, days) => {
    let result = new Date(date);

    result.setDate(result.getDate() + days);

    return result;
};

extractGoogleDocIntervals = async (documents, driveId) => {
    let intervalsOps = [];

    documents.map((doc) => {
        const { createdTime, modifiedTime } = doc;

        const selectTime = (time) => {
            let currentTime = new Date();

            if (time.getTime() > currentTime.getTime()) {
                return new Date(currentTime);
            } else {
                return time;
            }
        };

        let interval1 = {
            start: new Date(createdTime),
            end: selectTime(addDays(new Date(createdTime), 10)),
            drive: driveId,
        };

        let interval2 = {
            start: new Date(modifiedTime),
            end: selectTime(addDays(new Date(modifiedTime), 10)),
            drive: driveId,
        };

        let interval3 = {
            start: addDays(new Date(modifiedTime), -10),
            end: new Date(modifiedTime),
            drive: driveId,
        };

        let docIntervals = [interval1, interval2, interval3];

        let intervalIdentifiers = docIntervals.map(
            (interval) => `${interval.start}-${interval.end}`
        );

        doc.intervalIdentifiers = intervalIdentifiers;

        docIntervals.map((interval) => intervalsOps.push(interval));
    });

    let intervals;

    try {
        intervals = await IntegrationInterval.insertMany(intervalOps);
    } catch (e) {
        throw new Error(e);
    }

    intervals.map(
        (interval) =>
            (interval.identifier = `${interval.start}-${interval.end}`)
    );

    intervals = _.mapKeys(intervals, "identifier");

    documents.map((doc) => {
        const { intervalIdentifiers } = doc;

        doc.intervals = [];

        intervalIdentifiers.map((identifier) => {
            doc.intervals.push(intervals[identifier]);
        });
    });

    return documents;
};

module.exports = {
    acquireGoogleConnectProfile,
    acquireExternalGoogleDrives,
    extractSharedDriveUsers,
    extractGoogleDrive,
    extractGoogleRawDocuments,
    extractPersonalDriveUsers,
    storeGoogleDocuments,
};
