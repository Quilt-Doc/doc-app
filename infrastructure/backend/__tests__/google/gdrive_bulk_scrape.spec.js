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
const User = require("../../models/authentication/User");

const token = TEST_USER_GOOGLE_ACCESS_TOKEN;

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

resetAll = async () => {
    await IntegrationDrive.deleteMany();

    await IntegrationDocument.deleteMany();

    await IntegrationAttachment.deleteMany();

    await IntegrationInterval.deleteMany();
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

    oauth2Client.setCredentials(tokens);

    const driveAPI = google.drive({ version: "v3", auth: oauth2Client });

    return driveAPI;
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
    });
});
