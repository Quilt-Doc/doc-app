require("dotenv").config();

const mongoose = require("mongoose");

const api = require("../../apis/api");

const _ = require("lodash");

// util helpers
const {
    createWorkspace,
    deleteWorkspace,
    removeWorkspaces,
} = require("../../__tests__config/utils");

//google helpers

const {
    acquireGoogleConnectProfile,
    acquireExternalGoogleDrives,
    extractGoogleDrive,
} = require("../../controllers/integrations/google/GoogleControllerHelpers");

const {
    TEST_USER_ID,
    TEST_USER_GOOGLE_ACCESS_TOKEN,
    EXTERNAL_DB_PASS,
    EXTERNAL_DB_USER,
} = process.env;

//models
const IntegrationDrive = require("../../models/integrations/integration_objects/IntegrationDrive");
const IntegrationInterval = require("../../models/integrations/integration_objects/IntegrationInterval");
const IntegrationAttachment = require("../../models/integrations/integration_objects/IntegrationAttachment");
const IntegrationDocument = require("../../models/integrations/integration_objects/IntegrationDocument");
const IntegrationUser = require("../../models/integrations/integration_objects/IntegrationUser");
const User = require("../../models/authentication/User");

const token = TEST_USER_GOOGLE_ACCESS_TOKEN;

// google api
const { google } = require("googleapis");

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

const REDIRECT_URL =
    "http://localhost:3001/api/integrations/connect/google/callback";

let areCredentialsSet = false;

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URL
);

resetAll = async () => {
    await IntegrationDrive.deleteMany();

    await IntegrationDocument.deleteMany();

    await IntegrationAttachment.deleteMany();

    await IntegrationInterval.deleteMany();

    await IntegrationUser.deleteMany({ source: "google" });
};

beforeAll(async () => {
    const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

    await mongoose.connect(dbRoute, { useNewUrlParser: true });

    let db = mongoose.connection;

    db.once("open", () => console.log("connected to the database"));

    db.on("error", console.error.bind(console, "MongoDB connection error:"));

    await resetAll();

    const { createdWorkspaceId, repositoryIds } = await createWorkspace([
        "kgodara-testing/brodal_queue",
        "kgodara-testing/issue-scrape",
    ]);

    const workspace = { _id: createdWorkspaceId, repositories: repositoryIds };

    process.env.TEST_WORKSPACE = JSON.stringify(workspace);
});

afterAll(async () => {
    const workspace = JSON.parse(process.env.TEST_WORKSPACE);

    await deleteWorkspace(workspace._id);
});

generateDriveAPI = (profile) => {
    const { accessToken, refreshToken, scope, idToken } = profile;

    const tokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
        scope,
        id_token: idToken,
    };

    if (!areCredentialsSet) {
        oauth2Client.setCredentials(tokens);

        areCredentialsSet = true;
    }

    const driveAPI = google.drive({ version: "v3", auth: oauth2Client });

    return driveAPI;
};

generateDocsAPI = (profile) => {
    const { accessToken, refreshToken, scope, idToken } = profile;

    const tokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
        scope,
        id_token: idToken,
    };

    if (!areCredentialsSet) {
        oauth2Client.setCredentials(tokens);

        areCredentialsSet = true;
    }

    console.log("tokens", tokens);

    const docsAPI = google.docs({ version: "v1", auth: oauth2Client });

    return docsAPI;
};

describe("Test Google Drive Scrape", () => {
    let backendClient;

    beforeEach(() => {
        backendClient = api.requestTestingUserBackendClient();
    });

    test("acquireGoogleConnectProfile extracts profile.", async () => {
        console.log(
            "Entered Test: acquireGoogleConnectProfile extracts profile."
        );

        const profile = await acquireGoogleConnectProfile(TEST_USER_ID);

        expect(profile.accessToken).toEqual(token);

        process.env.TEST_PROFILE = JSON.stringify(profile);
    });

    test("acquireExternalGoogleDrives extracts drives.", async () => {
        console.log(
            "Entered Test: acquireExternalGoogleDrives extracts drives."
        );

        const profile = JSON.parse(process.env.TEST_PROFILE);

        const drives = await acquireExternalGoogleDrives(profile);

        expect(drives.length).toEqual(1);

        const drive = drives[0];

        const user = await User.findById(TEST_USER_ID);

        expect(drive.name).toEqual(
            `${user.firstName} ${user.lastName}'s Personal Drive`
        );

        expect(drive.id).toEqual(`${user._id}-google-drive`);

        process.env.TEST_DRIVE = JSON.stringify(drive);

        process.env.TEST_USER = JSON.stringify(user);
    });

    test("extractGoogleDrive saved drive to database.", async () => {
        console.log(
            "Entered Test: extractGoogleDrive saved drive to database."
        );

        const user = JSON.parse(process.env.TEST_USER);

        const workspace = JSON.parse(process.env.TEST_WORKSPACE);

        const profile = JSON.parse(process.env.TEST_PROFILE);

        let drive = JSON.parse(process.env.TEST_DRIVE);

        const driveAPI = generateDriveAPI(profile);

        drive = await extractGoogleDrive(
            driveAPI,
            drive,
            workspace.repositories,
            TEST_USER_ID,
            true
        );

        expect(drive.name).toEqual(
            `${user.firstName} ${user.lastName}'s Personal Drive`
        );

        expect(drive.source).toEqual("google");

        expect(drive.name).toEqual(
            `${user.firstName} ${user.lastName}'s Personal Drive`
        );

        expect(drive.sourceId).toEqual(`${user._id}-google-drive`);

        expect(drive.repositories.map((repoId) => repoId.toString())).toEqual(
            workspace.repositories.map((repoId) => repoId.toString())
        );

        expect(drive.integrationCreator.toString()).toEqual(TEST_USER_ID);

        expect(drive.isPersonal).toEqual(true);

        process.env.TEST_DRIVE = JSON.stringify(drive);
    });

    test("extractGoogleRawDocuments extracts all files correctly.", async () => {
        console.log("Entered Test: extractGoogleRawDocuments");

        const profile = JSON.parse(process.env.TEST_PROFILE);

        const driveAPI = generateDriveAPI(profile);

        let drive = JSON.parse(process.env.TEST_DRIVE);

        const documentsObj = await extractGoogleRawDocuments(
            driveAPI,
            drive.sourceId,
            true
        );

        const documents = Object.values(documentsObj);

        expect(documents.length).toEqual(8);

        process.env.TEST_DOCS = JSON.stringify(documents);
    });

    test("extractPersonalDriveUsers extracts all users correctly,", async () => {
        console.log("Entered Test: extractPersonalDriveUsers");

        const documents = JSON.parse(process.env.TEST_DOCS);

        const workspace = JSON.parse(process.env.TEST_WORKSPACE);

        workspace.memberUsers = [JSON.parse(process.env.TEST_USER)];

        const usersObj = await extractPersonalDriveUsers(workspace, documents);

        const users = Object.values(usersObj);

        expect(users.length).toEqual(4);

        process.env.TEST_MEMBERS = JSON.stringify(usersObj);
    });

    test("storeGoogleDocuments populates attachments, intervals, and general fields correctly.", async () => {
        console.log("Entered Test: storeGoogleDocuments");

        const profile = JSON.parse(process.env.TEST_PROFILE);

        const docsAPI = generateDocsAPI(profile);

        const drive = JSON.parse(process.env.TEST_DRIVE);

        const members = JSON.parse(process.env.TEST_MEMBERS);

        let documents = JSON.parse(process.env.TEST_DOCS);

        console.log("MEMBERS", members);

        documents = await storeGoogleDocuments(
            docsAPI,
            drive,
            members,
            documents
        );

        expect(documents.length).toEqual(8);

        const documentAttachments = {
            "Test Document": new Set(),

            "Test Document 2": new Set([
                "https://github.com/kgodara-testing/brodal_queue/commit/927ae95ce8a7c7625755ea13b7702be84bc4a321",
                "https://github.com/kgodara-testing/brodal_queue/pull/2",
            ]),
            "Test Document 3": new Set([
                "https://github.com/kgodara-testing/brodal_queue/commit/e55f56aed2809f92938c79f25c754697e9c50260",

                "https://github.com/kgodara-testing/brodal_queue/commit/fb470b2368cf79a1e1cc95803418a9350f1e65fc",
            ]),

            "Test Document 4": new Set([
                "https://github.com/kgodara-testing/issue-scrape/commit/5c50b758ed393466dca02bc8f865ae21e9b71447",
            ]),

            "Test Document 5": new Set(),
        };

        for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];

            let { name, attachments, intervals } = doc;

            const expectedAtts = documentAttachments[name];

            expect(intervals.length).toEqual(3);

            if (!expectedAtts) {
                expect(attachments.length).toEqual(0);

                continue;
            }

            expect(attachments.length).toEqual(Array.from(expectedAtts).length);

            attachments = IntegrationAttachment.find({
                _id: { $in: attachments },
            });

            attachments.map((att) => {
                expect(expectedAtts.has(att.link)).toBe(true);
            });
        }
    });
});
