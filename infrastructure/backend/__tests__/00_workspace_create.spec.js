require("dotenv").config();
const api = require("../apis/api");

const utils = require("../__tests__config/utils");

// var createdWorkspaceId;
// var createdRepositoryIds;

const MAX_WORKSPACE_POLL_RETRIES = 4;

function delay(t, val) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(val);
        }, t);
    });
}

describe("Create Workspace", () => {
    var createdWorkspaceId = process.env.TEST_CREATED_WORKSPACE_ID;

    var createdRepositories = JSON.parse(process.env.TEST_CREATED_REPOSITORIES);
    var createdRepositoryIds = createdRepositories.map(
        (repositoryObj) => repositoryObj._id
    );

    var backendUserClient;

    beforeEach(() => {
        backendUserClient = api.requestTestingUserBackendClient();
    });

    // router.post('/documents/:workspaceId/retrieve', authorizationMiddleware.documentMiddleware, documentController.retrieveDocuments);
    test("Root Document should be created", async () => {
        // var backendUserClient = await api.requestTestingUserBackendClient();

        var documentRetrieveData = {
            root: true,
            limit: 1,
            skip: 0,
            minimal: true,
            fill: false,
        };

        var documentRetrieveResponse;

        try {
            documentRetrieveResponse = await backendUserClient.post(
                `/documents/${createdWorkspaceId}/retrieve`,
                documentRetrieveData
            );
        } catch (err) {
            console.log(
                `Error retrieving Root Document - workspaceId: ${createdWorkspaceId}`
            );
            throw err;
        }

        // `Error retrieving Root Document, success == false - workspaceId: ${createdWorkspaceId}`
        expect(documentRetrieveResponse.data.success).toEqual(true);

        var retrievedDocuments = documentRetrieveResponse.data.result;

        // console.log(`retrievedDocuments.length: ${retrievedDocuments.length}`)

        // `Error expected to retrieve one root Document, found ${retrievedDocuments.length} - workspaceId: ${createdWorkspaceId}`
        expect(retrievedDocuments.length).toEqual(1);

        // Single Document returned should be the root Document
        expect(retrievedDocuments[0].root).toEqual(true);
    });

    // router.post('/reporting/:workspaceId/retrieve_user_stats', authorizationMiddleware.reportingMiddleware, reportingController.retrieveUserStats);
    test("UserStats should be created for test User <-> Workspace", async () => {
        // var backendUserClient = await api.requestTestingUserBackendClient();

        var userStatRetrieveData = { limit: 1, skip: 0 };

        var userStatRetrieveResponse;
        try {
            userStatRetrieveResponse = await backendUserClient.post(
                `/reporting/${createdWorkspaceId}/retrieve_user_stats`,
                userStatRetrieveData
            );
        } catch (err) {
            console.log(
                `Error retrieving UserStats - workspaceId, userId: ${createdWorkspaceId}, ${process.env.TEST_USER_ID}`
            );
            throw err;
        }

        expect(userStatRetrieveResponse.data.success).toEqual(true);

        var retrievedUserStats = userStatRetrieveResponse.data.result;

        // `Error expected to retrieve one UserStats, found ${retrievedUserStats.length} - workspaceId, userId: ${createdWorkspaceId}, ${process.env.TEST_USER_ID}`
        expect(retrievedUserStats.length).toEqual(1);

        // UserStat returned should be for process.env.TEST_USER_ID
        expect(retrievedUserStats[0].user._id).toEqual(
            process.env.TEST_USER_ID
        );

        // UserStat returned should be for ${createdWorkspaceId}
        expect(retrievedUserStats[0].workspace).toEqual(createdWorkspaceId);
    });

    // router.get('/users/get/:userId', authorizationMiddleware.userMiddleware, userController.getUser);
    test("Workspace should be added to User.workspaces", async () => {
        // var backendUserClient = await api.requestTestingUserBackendClient();

        var userGetResponse;
        try {
            userGetResponse = await backendUserClient.get(
                `/users/get/${process.env.TEST_USER_ID}`
            );
        } catch (err) {
            console.log(
                `Error retrieving User - userId: ${process.env.TEST_USER_ID}`
            );
            throw err;
        }

        var userGetResult = userGetResponse.data;

        // success == true
        expect(userGetResult.success).toEqual(true);

        // User._id should match userId requested
        expect(userGetResult.result._id).toEqual(process.env.TEST_USER_ID);

        // User.workspaces contains createdWorkspaceId
        expect(
            userGetResult.result.workspaces.map((workspaceObj) =>
                workspaceObj._id.toString()
            )
        ).toContain(createdWorkspaceId);
    });

    // router.get('/workspaces/get/:workspaceId', authorizationMiddleware.workspaceMiddleware, workspaceController.getWorkspace);
    test("Workspace.setupComplete should be equal to true", async () => {
        var workspaceGetResponse;
        var setupSuccess = false;

        // Wait 1 second
        await delay(1000);

        for (i = 0; i < MAX_WORKSPACE_POLL_RETRIES; i++) {
            try {
                workspaceGetResponse = await backendUserClient.get(
                    `/workspaces/get/${createdWorkspaceId}`
                );
            } catch (err) {
                console.log(
                    `Error retrieving Workspace - workspaceId: ${createdWorkspaceId}`
                );
                throw err;
            }
            if (workspaceGetResponse.data.success != true) {
                throw Error(
                    `Failed to get Workspace - workspaceId: ${createdWorkspaceId}`
                );
            }

            if (workspaceGetResponse.data.result.setupComplete == true) {
                setupSuccess = true;
                break;
            }

            // Wait 2 seconds
            await delay(2000);
        }

        expect(setupSuccess).toEqual(true);
    });
});

/*
describe("Scan Repositories", async () => {

});
*/

/*
describe("Filter function", () => {
    test("it should filter by a search term (link)", () => {
      expect(1==1).toEqual(true);
    });
});
*/
