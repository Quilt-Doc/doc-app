const { google } = require("googleapis");
const url = require("url");
const axios = require("axios");

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const GoogleDriveIntegration = require("../../models/integrations/GoogleDriveIntegration");
const ExternalDocument = require("../../models/integrations/ExternalDocument");
const Workspace = require("../../../models/Workspace");

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
const REDIRECT_URL =
    "http://localhost:3001/api/integrations/connect/google/callback";

const oauth2 = google.oauth2("v2");

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URL
);

const googleAPI = axios.create({
    baseURL: "https://www.googleapis.com",
});

// INITIAL CALL FROM FRONTEND -> OPENS UP GOOGLE AUTH

beginGoogleConnect = (req, res, next) => {
    const { workspace_id, user_id } = req.query;
    const workspaceId = workspace_id;
    const userId = user_id;

    let state = {};

    //if (userId) state.userId = userId;
    if (workspaceId) state.workspaceId = workspaceId;
    if (userId) state.userId = userId;

    state = Buffer.from(JSON.stringify(state)).toString("base64");

    scope = [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
    ];

    console.log("SCOPE", scope);

    const URL = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope,
        state,
    });

    res.redirect(URL);
};

// OAUTH CALLBACK USING REDIRECT URI

handleGoogleConnectCallback = async (req, res) => {
    const query = url.parse(req.url, true).query;
    //console.log("QUERY", query);

    const { code, state } = query;
    const { tokens } = await oauth2Client.getToken(code);

    //console.log("TOKENS", tokens);

    const { access_token, refresh_token, scope, id_token } = tokens;

    const { workspaceId, userId } = JSON.parse(
        Buffer.from(state, "base64").toString()
    );

    //console.log("ACCESS TOKEN", access_token);

    /* Can use this for axios calls to google api
    const config = {
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    }*/

    oauth2Client.setCredentials(tokens);

    let response;

    try {
        response = await oauth2.userinfo.get({ auth: oauth2Client });
    } catch (err) {
        console.log("ERROR", err);
    }

    const googleUser = response.data;

    //TODO: NEED TO DEAL WITH REPOSITORIES
    let googleDriveIntegration = new GoogleDriveIntegration({
        accessToken: access_token,
        refreshToken: refresh_token,
        idToken: id_token,
        scope,
        profileId: googleUser.id,
        user: ObjectId(userId),
        workspace: ObjectId(workspaceId),
        repositories: [],
    });

    try {
        googleDriveIntegration = await googleDriveIntegration.save();
    } catch (err) {
        console.log("ERROR", err);
    }

    // this would be the allocated job to bulk scrape
    await bulkScrapeGoogleDrive(googleDriveIntegration);

    // this would be the allocated job to make associations
    // --- only consists of extraction right now
    await makeGoogleDriveAssociations(googleDriveIntegration);

    res.redirect(
        "http://localhost:3000/workspaces/5f9949ddc89f9adeeaf173bf/google_test"
    );
};

// BULK SCRAPING PROCEDURE

bulkScrapeGoogleDrive = async (googleDriveIntegration) => {
    const {
        accessToken,
        refreshToken,
        scope,
        idToken,
        workspace,
        user,
        repositories,
    } = googleDriveIntegration;

    console.log("GOOGLE DRIVE INTEGRATION", googleDriveIntegration);

    const tokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
        scope,
        id_token: idToken,
    };

    oauth2Client.setCredentials(tokens);

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    let completedScrape = false;
    //TODO: Possibly need to have the user choose which drive is relevant, not sure what drive allocation is relevant

    let pages = [];

    while (!completedScrape) {
        let response;

        try {
            response = await drive.files.list({
                pageSize: 1000,
                fields: `files(webViewLink), files(id), files(mimeType), files(createdTime), files(modifiedTime), files(owners), files(lastModifyingUser)`,
            });
        } catch (err) {
            console.log("ERROR", err);
        }

        const { files, nextPageToken } = response.data;

        pages.push(files);

        if (!nextPageToken) completedScrape = true;
    }

    // Save google docs
    let insertItems = [];

    const currentWorkspace = await Workspace.findById(workspace)
        .lean()
        .select("memberUsers")
        .populate("memberUsers");
    const { memberUsers } = currentWorkspace;

    const memberUserFullNames = memberUsers.map(
        (user) => `${user.firstName} ${user.lastName}`
    );
    const memberUserEmails = memberUsers.map((user) => user.email);

    pages.map((page) => {
        page.map((file) => {
            const {
                webViewLink,
                id,
                mimeType,
                createdTime,
                modifiedTime,
                lastModifyingUser,
            } = file;

            let { owners } = file;

            owners = owners.filter(
                (owner) => owner.permissionId !== lastModifyingUser.permissionId
            );

            owners.push(lastModifyingUser);

            let googleDriveMembers = [];
            let googleDriveMemberEmails = [];

            let googleDriveMemberUsers = [];

            owners.map((owner) => {
                const { displayName, emailAddress } = owner;

                googleDriveMembers.push(displayName);
                googleDriveMemberEmails.push(emailAddress);

                for (let i = 0; i < memberUsers.length; i++) {
                    const memberUser = memberUsers[i];

                    if (
                        `${memberUser.firstName} ${memberUser.lastName}` ===
                            displayName ||
                        memberUser.email === emailAddress
                    ) {
                        googleDriveMemberUsers.push(memberUser._id);
                    }
                }

                return;
            });

            insertItems.push({
                googleDriveIntegration: ObjectId(googleDriveIntegration._id),
                googleDriveLink: webViewLink,
                googleDriveId: id,
                googleDriveMimeType: mimeType,
                googleDriveCreated: new Date(createdTime),
                googleDriveLastModified: new Date(modifiedTime),
                googleDriveMembers,
                googleDriveMemberEmails,
                memberUsers: googleDriveMemberUsers,
                type: "google-drive",
                workspace,
                repositories,
            });
            // TODO: REPOSITORY ISN'T INITIALIZED
        });
    });

    //console.log("INSERT ITEMS", insertItems);

    try {
        const result = await ExternalDocument.insertMany(insertItems);
        console.log("RESULT", result);
    } catch (err) {
        console.log("ERROR", err);
    }
};

// ASSOCIATION PIPELINE

makeGoogleDriveAssociations = async (googleDriveIntegration) => {
    let googleDriveFiles;

    try {
        googleDriveFiles = await ExternalDocument.find({
            googleDriveIntegration: ObjectId(googleDriveIntegration._id),
        })
            .lean()
            .exec();
    } catch (err) {
        console.log("ERROR", err);
    }

    const googleDriveDocs = [];
    const googleDriveMisc = [];

    googleDriveFiles.map((file) => {
        if (
            file.googleDriveMimeType === "application/vnd.google-apps.document"
        ) {
            googleDriveDocs.push(file);
        } else {
            googleDriveMisc.push(file);
        }
    });

    await makeGoogleDocAssociations(googleDriveDocs, googleDriveIntegration);
};

makeGoogleDocAssociations = async (googleDriveDocs, googleDriveIntegration) => {
    const {
        accessToken,
        refreshToken,
        scope,
        idToken,
    } = googleDriveIntegration;

    const tokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
        scope,
        id_token: idToken,
    };

    oauth2Client.setCredentials(tokens);

    const docs = google.docs({ version: "v1", auth: oauth2Client });

    /*
    const config = {
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    }*/

    const requests = googleDriveDocs.map((driveDoc) => {
        const { googleDriveId } = driveDoc;
        return docs.documents.get({ documentId: googleDriveId });
    });

    let responses;

    try {
        responses = await Promise.all(requests);
    } catch (err) {
        console.log("ERROR", err);
    }

    const googleDocsData = responses.map((response) => response.data);

    googleDocsData.map((docData, i) => {
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

        googleDriveDocs[i].extraction = extraction;
    });

    //console.log("GOOGLE DOCS DATA", googleDriveDocs);
};

// BELOW HAS TO DO WITH ACQUIRING TEXTUAL DATA FROM DOCUMENTS

insertExtraction = (type, content, extraction) => {
    if (type in extraction) {
        extraction[type].push(content);
    } else {
        extraction[type] = [content];
    }
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
    //console.log("EXTRACTION", extraction);
    return extraction;
};

module.exports = { beginGoogleConnect, handleGoogleConnectCallback };

// POSSIBLY USEFUL
/*
    const docs = google.docs({version: 'v1', auth: oauth2Client});

    //TODO: There may not be any docs...
    response = await docs.documents.get({documentId: file.id})

    console.log("DOCUMENT", response.data);

    const { body, title, headers, footers, list, revisionId, documentId } = response.data;
    */
/*
    const fileFields = `fields=webViewLink,createdTime,modifiedTime,owners,lastModifyingUser`
    response = await googleAPI.get(
        `/drive/v3/files/${documentId}/revisions`,
        config
    )

    console.log("LAST REVISION", response.data);
    */

/*
    const extraction = decipher(body.content, title);

    console.log("EXTRACTION", extraction);
    //console.log("TITLE", title);
    //console.log("HEADERS", headers);
    //console.log("FOOTERS", footers);
    //console.log("LIST", list);

    //response = await drive.files.export({fileId: file.id, mimeType: 'text/html'});
    */
