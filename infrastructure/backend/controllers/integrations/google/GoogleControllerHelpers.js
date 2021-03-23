//sentry
const Sentry = require("@sentry/node");

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
const IntegrationDocument = require("../../../models/integrations/integration_objects/IntegrationDocument");
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

const { logger } = require("../../../fs_logging");

acquireGoogleConnectProfile = async (userId) => {
    logger.info(`Entered with userId: ${userId}.`, {
        func: "acquireGoogleConnectProfile",
    });

    let googleConnectProfile;

    try {
        logger.debug(`About to query googleConnectProfile`, {
            func: "acquireGoogleConnectProfile",
        });

        googleConnectProfile = await GoogleConnectProfile.findOne({
            user: userId,
            isReady: true,
        })
            .populate("user")
            .lean()
            .exec();
    } catch (e) {
        Sentry.captureException(e);

        logger.error("googleConnectProfile query failed.", {
            func: "acquireGoogleConnectProfile",
            e,
        });

        throw new Error(e);
    }

    logger.info("googleConnectProfile query succeeded.", {
        func: "acquireGoogleConnectProfile",
        obj: googleConnectProfile,
    });

    return googleConnectProfile;
};

acquireExternalGoogleDrives = async (profile) => {
    let func = "acquireExternalGoogleDrives";

    const {
        accessToken,
        refreshToken,
        scope,
        idToken,
        user: { _id: userId, firstName, lastName },
    } = profile;

    logger.info(
        `Entered with profile parameters, userId: ${userId} accessToken: ${accessToken} refreshToken: ${refreshToken}.`,
        {
            func,
        }
    );

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
            Sentry.captureException(e);

            logger.error(`Querying google api for drives failed.`, {
                func,
                e,
                obj: queryParameters,
            });

            throw new Error(e);
        }

        const { drives: retrievedDrives, nextPageToken } = response.data;

        retrievedDrives.map((drive) => _.pick(drive, ["id", "name"]));

        drives = [...drives, ...retrievedDrives];

        if (!nextPageToken) completedScrape = true;

        pageToken = nextPageToken;
    }

    logger.info(`Retrieved ${drives.length} drives successfully.`, {
        func: "acquireGoogleConnectProfile",
    });

    return drives;
};

extractSharedDriveUsers = async (driveAPI, driveId, workspace) => {
    const func = "extractSharedDriveUsers";

    logger.info(`Entered with params:`, {
        func,
        obj: {
            driveId,
            workspace,
        },
    });

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
    drive,
    repositoryIds,
    userId,
    isPersonal
) => {
    const func = "extractGoogleDrive";

    logger.info(`Entered with params:`, {
        func,
        obj: {
            drive,
            repositoryIds,
            userId,
            isPersonal,
        },
    });

    if (!isPersonal) {
        try {
            const { id: driveId } = drive;

            const response = await driveAPI.drives.get({ driveId });

            drive = response.data;
        } catch (e) {
            Sentry.captureException(e);

            logger.error(`Could not extract drive using driveId.`, { e, func });

            throw new Error(e);
        }
    }

    logger.info(`Drive that will be saved.`, { func, obj: drive });

    const { id, name, createdTime } = drive;

    try {
        drive = new IntegrationDrive({
            name,
            source: "google",
            sourceId: id,
            repositories: repositoryIds,
            integrationCreator: userId,
            isPersonal,
        });

        if (createdTime) drive.sourceCreationDate = new Date(createdTime);

        drive = await drive.save();

        logger.info(`Drive was saved successfully to db.`, {
            func,
            obj: drive,
        });
    } catch (e) {
        Sentry.captureException(e);

        logger.error(`Could not save drive to database.`, { e, func });

        throw new Error(e);
    }

    return drive;
};

extractGoogleRawDocuments = async (driveAPI, driveId, isPersonal) => {
    const func = "extractGoogleRawDocuments";

    logger.info(
        `Entered with parameters driveId: ${driveId} isPersonal: ${isPersonal}`,
        {
            func,
        }
    );

    let isScrapeCompleted = false;

    let pageToken;

    let documents = [];

    while (!isScrapeCompleted) {
        let response;

        let queryParameters = {
            pageSize: 1000,
            fields: `files(name), files(webViewLink), files(id), files(mimeType), files(createdTime), files(modifiedTime), files(owners), files(lastModifyingUser), files(permissions)`,
        };

        if (checkValid(pageToken)) {
            queryParameters.pageToken = pageToken;
        }

        if (checkValid(driveId) && !isPersonal) {
            queryParameters.driveId = driveId;
        }

        logger.debug(`Drive API File Query Parameters:`, {
            func,
            obj: queryParameters,
        });

        try {
            response = await driveAPI.files.list(queryParameters);
        } catch (e) {
            Sentry.captureException(e);

            logger.error(`Query to extract files using driveAPI failed..`, {
                func,
                e,
            });

            throw new Error(e);
        }

        logger.debug(`Drive API File Response Data:`, {
            func,
            obj: response.data,
        });

        const { files, nextPageToken } = response.data;

        documents = [...documents, ...files];

        pageToken = nextPageToken;

        if (!pageToken) isScrapeCompleted = true;
    }

    documents = _.mapKeys(documents, "id");

    logger.info(`Extracted raw documents:`, {
        func,
        obj: documents,
    });

    return documents;
};

extractPersonalDriveUsers = async (workspace, documents) => {
    const func = "extractPersonalDriveUsers";

    logger.info(
        `Entered with parameters workspace and documents with -- ${documents.length} documents`,
        {
            func,
            obj: {
                workspace,
                documents,
            },
        }
    );

    const { memberUsers } = workspace;

    logger.info(
        `There are ${memberUsers.length} memberUsers of this workspace:`,
        {
            func,
            obj: memberUsers,
        }
    );

    let users = {};

    documents.map((doc) => {
        let { owners, lastModifyingUser, permissions } = doc;

        owners = [...owners, ...permissions];

        owners.push(lastModifyingUser);

        owners.map((member) => {
            const { emailAddress } = member;

            if (emailAddress in users) return;

            users[emailAddress] = member;
        });
    });

    logger.info(`Created user map of all involved in drive:`, {
        func,
        obj: users,
    });

    users = Object.values(users);

    logger.info(`There are ${users.length} users involved in this drive.`, {
        func,
    });

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

    logger.info(
        `externalUser data was modified to hold pointers to actual memberUsers:`,
        {
            func,
            obj: users,
        }
    );

    let existingUsers;

    try {
        const emails = users.map((user) => user.emailAddress);

        let query = IntegrationUser.find({
            source: "google",
        });

        query.where("email").in(emails);

        existingUsers = await query.lean().exec();

        logger.info(`Existing IntegrationUsers from this drive:`, {
            func,
            obj: existingUsers,
        });
    } catch (e) {
        Sentry.captureException(e);

        logger.error(
            `Was not able to execute query to find existing IntegrationUsers`,
            {
                func,
                e,
            }
        );

        throw new Error(e);
    }

    let existingEmails = new Set(existingUsers.map((user) => user.email));

    users = users.filter((user) => !existingEmails.has(user.emailAddress));

    logger.debug(
        `Filtered users based on whether they have an email that exists in db`,
        {
            func,
            obj: {
                filteredUsers: users,
                existingEmails,
            },
        }
    );

    try {
        users = await IntegrationUser.insertMany(
            users.map((user) => {
                const { id, userId, emailAddress, displayName } = user;

                return {
                    sourceId: id,
                    source: "google",
                    name: displayName,
                    email: emailAddress,
                    user: userId,
                };
            })
        );

        logger.info(
            `${users.length} IntegrationUsers were inserted into the database`,
            {
                func,
                obj: users,
            }
        );
    } catch (e) {
        Sentry.captureException(e);

        logger.error(`Insertion of new IntegrationUsers failed..`, {
            func,
            e,
        });

        throw new Error(e);
    }

    users = [...users, ...existingUsers];

    logger.info(
        `Finally, ${users.length} users were outputted by this method.`,
        {
            func,
            obj: users,
        }
    );

    return _.mapKeys(users, "email");
};

storeGoogleDocuments = async (docsAPI, drive, members, documents) => {
    const func = "storeGoogleDocuments";

    logger.info(`Entered with params:`, {
        func,
        obj: {
            drive,
            members,
            documents,
        },
    });

    let docs = documents.filter((doc) => {
        const { mimeType } = doc;

        return mimeType == "application/vnd.google-apps.document";
    });

    logger.info(`There are ${docs.length} docs among the drive files.`, {
        func,
        obj: docs,
    });

    let docsToAttachments;

    try {
        docsToAttachments = await extractGoogleDocAttachments(
            docsAPI,
            drive._id,
            docs
        );

        logger.info(
            `IntegrationAttachmment were extracted and allocated on docs with links.`,
            {
                func,
                obj: docsToAttachments,
            }
        );
    } catch (e) {
        Sentry.captureException(e);

        logger.error(`IntegrationAttachmment creation and allocation failed.`, {
            func,
            e,
        });

        throw new Error(e);
    }

    docsToAttachments = _.mapKeys(docsToAttachments, "id");

    logger.debug(`docsToAttachments were mapped correctly:`, {
        func,
        obj: docsToAttachments,
    });

    let docsToIntervals;

    try {
        docsToIntervals = await extractGoogleDocIntervals(documents, drive._id);
    } catch (e) {
        Sentry.captureException(e);

        logger.error(`Interval extraction from documents failed...`, {
            func,
            e,
        });

        throw new Error(e);
    }

    docsToIntervals = _.mapKeys(docsToIntervals, "id");

    let insertOps = documents.map((doc) => {
        const {
            webViewLink,
            name,
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

        let attachmentIds = docsToAttachments[id]
            ? docsToAttachments[id].attachments
            : [];

        let intervalIds = docsToIntervals[id].intervals.map(
            (interval) => interval._id
        );

        return {
            source: "google",
            name,
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

        logger.info(
            `${documents.length} documents were created successfully.`,
            {
                func,
                obj: documents,
            }
        );
    } catch (e) {
        Sentry.captureException(e);

        logger.error(`IntegrationDocument final insertion failed.`, {
            func,
            e,
        });

        throw new Error(e);
    }

    return documents;
};

extractGoogleDocAttachments = async (docsAPI, driveId, docs) => {
    const func = "extractGoogleDocAttachments";

    logger.info(`Entered with params:`, {
        func,
        obj: {
            driveId,
            docs,
        },
    });

    const requests = docs.map((doc) => {
        const { id } = doc;

        return docsAPI.documents.get({ documentId: id });
    });

    let responses;

    try {
        responses = await Promise.all(requests);
    } catch (e) {
        logger.error(`Unable to retrieve document data from Google Docs API`, {
            func,
            e,
        });

        throw new Error(e);
    }

    const docsData = responses.map((response) => response.data);

    logger.info(
        `Retrieved document data successfully for ${docsData.length} docs`,
        {
            func,
            obj: docsData,
        }
    );

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

        logger.debug(`Content Extraction Object:`, {
            func,
            obj: extraction,
        });

        const links = extraction["LINK"];

        //links ? links.length : 0
        logger.debug(
            `Extracted ${
                links ? links.length : 0
            } links from document "${title}"'s content`,
            {
                func,
                obj: links,
            }
        );

        if (links) {
            allLinks = [...allLinks, ...links];

            logger.debug(`Size of allLinks to be saved: ${allLinks.length}`, {
                func,
            });

            logger.debug(
                `Size of links extracted for document "${title}" equals ${links.length}`,
                {
                    func,
                    obj: links,
                }
            );

            docs[i].attachmentLinks = links;
        } else {
            logger.debug(
                `No new links to be saved -- allLinks length: ${allLinks.length}`,
                {
                    func,
                }
            );
        }
    });

    let attachments;

    try {
        attachments = await createAttachments(allLinks, driveId);

        logger.info("Attachment were created using the links:", {
            func,
            obj: attachments,
        });
    } catch (e) {
        Sentry.captureException(e);

        logger.error("Attachment creation using extracted links failed", {
            func,
            e,
        });

        throw new Error(e);
    }

    docs.map((doc) => {
        const { attachmentLinks } = doc;

        if (attachmentLinks) {
            doc.attachments = [];

            attachmentLinks.map((link) => {
                if (attachments[link]) {
                    doc.attachments.push(attachments[link]._id);
                }
            });
        }
    });

    logger.info("Final docs output:", {
        func,
        obj: docs,
    });

    return docs;
};

createAttachments = async (links, driveId) => {
    const func = "createAttachments";

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

    logger.info(
        `There were ${attachments.length} unique attachments extracted from the links provided:`,
        {
            func,
            obj: attachments,
        }
    );

    let repositories;

    try {
        repositories = await Repository.find({
            fullName: { $in: Array.from(seenRepositoryFullNames) },
        });
    } catch (e) {
        Sentry.captureException(e);

        logger.error(
            `Querying repositories with attachment repos fullNames failed.`,
            {
                func,
                e,
            }
        );

        throw new Error(e);
    }

    repositories = _.mapKeys(repositories, "fullName");

    attachments.map((att) => {
        const { fullName } = att;

        if (fullName in repositories) {
            att.repository = repositories[fullName]._id;
        }
    });

    logger.info(`Repository field is populated on attachments.`, {
        func,
        obj: attachments,
    });

    try {
        attachments = await IntegrationAttachment.insertMany(attachments);

        logger.info(`Attachments were saved successfully`, {
            func,
            obj: attachments,
        });
    } catch (e) {
        Sentry.captureException(e);

        logger.error(
            `Error occurred during insertion of Integration Attachment`,
            {
                func,
                e,
            }
        );

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
    const func = "extractGoogleDocIntervals";

    logger.info(
        `Entered with ${documents.length} documents and driveId: ${driveId}.`,
        {
            func,
        }
    );

    let intervalsOps = [];

    documents.map((doc) => {
        const { createdTime, modifiedTime } = doc;

        logger.debug(
            `Created and last modified time for documentId: ${doc._id} name: ${doc.name}.`,
            {
                func,
                obj: {
                    createdTime,
                    modifiedTime,
                },
            }
        );

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
        intervals = await IntegrationInterval.insertMany(intervalsOps);

        logger.info(`Successfully created ${intervals.length} intervals.`, {
            func,
            obj: intervals,
        });
    } catch (e) {
        Sentry.captureException(e);

        logger.error(`Interval insertion into database failed..`, {
            func,
            e,
        });

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

    logger.info(`Add intervals to documents.`, {
        func,
        obj: documents,
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
