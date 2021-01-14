require("dotenv").config();

const api = require("../apis/api");

const trelloControllerHelpers = require("../controllers/integrations/trello/TrelloControllerHelpers");

const {
    bulkScrapeTrello,
} = require("../controllers/integrations/trello/TrelloIntegrationController");

const { TEST_USER_ID, TEST_CREATED_WORKSPACE_ID } = process.env;

describe("Test Trello Bulk Scrape", () => {
    let backendUserClient;

    beforeEach(() => {
        backendUserClient = api.requestTestingUserBackendClient();
    });

    test("trelloControllerHelpers.acquireTrelloConnectProfile: Trello access token should match", async () => {
        const { acquireTrelloConnectProfile } = trelloControllerHelpers;

        const profile = await acquireTrelloConnectProfile(TEST_USER_ID);

        const { accessToken } = profile;

        expect(accessToken).toEqual(
            "a4157b7d13a520947b353b46d9b0df390ab9d27a4277639810587c6b143316b1"
        );

        process.env.TEST_TRELLO_CONNECT_PROFILE = JSON.stringify(profile);
    });

    test("trelloControllerHelpers.acquireExternalTrelloBoards: Trello boards \
    should have correct length and not be null", async () => {
        const { acquireExternalTrelloBoards } = trelloControllerHelpers;

        const profile = JSON.parse(process.env.TEST_TRELLO_CONNECT_PROFILE);

        const externalBoards = await acquireExternalTrelloBoards(profile);

        expect(externalBoards).not.toBeNull();

        expect(externalBoards.length).toEqual(1);

        const boardNames = externalBoards.map((board) => board.name);

        expect(boardNames).toContain("Quilt Test Trello Board");

        const testBoard = externalBoards.filter(
            (board) => board.name === "Quilt Test Trello Board"
        )[0];

        const { lists } = testBoard;

        const beginListId = lists.filter(
            (list) => list.name === "In Progress"
        )[0].id;

        const endListId = lists.filter((list) => list.name === "Done")[0].id;

        let repositories = JSON.parse(process.env.TEST_CREATED_REPOSITORIES);

        repositories = repositories.filter((repository) => {
            repository.fullName === "kgodara-testing/brodal_queue";
        })[0]._id;

        const context = {
            board: testBoard.id,
            repositories,
            event: {
                beginListId,
                endListId,
            },
        };

        process.env.TEST_TRELLO_CONTEXT = JSON.stringify(context);
    });

    /*
    test("trelloControllerHelpers.acquireTrelloData: \
    Trello board data extracted through Trello API is \
    populated correctly", async () => {
        const { acquireTrelloData } = trelloControllerHelpers;

        const context = JSON.parse(process.env.TEST_TRELLO_CONTEXT);

        const profile = JSON.parse(process.env.TEST_TRELLO_CONNECT_PROFILE);

        const { board: boardId } = context;

        const { accessToken } = profile;

        const boardData = await acquireTrelloData(boardId, accessToken);

        let {
            actions,
            cards,
            lists,
            members,
            labels,
            id,
            name,
            idMemberCreator,
            url,
        } = boardData;

        expect(actions).toBeDefined();

        expect(cards).toBeDefined();

        expect(lists).toBeDefined();

        expect(members).toBeDefined();

        expect(labels).toBeDefined();

        expect(id).toBeDefined();

        expect(name).toBeDefined();

        expect(idMemberCreator).toBeDefined();

        expect(url).toBeDefined();

        process.env.TEST_TRELLO_BOARD_DATA = JSON.stringify(boardData);
    });

    test("trelloControllerHelpers.extractTrelloMembers: expect members to match", async () => {
        const { extractTrelloMembers } = trelloControllerHelpers;

        const profile = JSON.parse(process.env.TEST_TRELLO_CONNECT_PROFILE);

        const boardData = JSON.parse(process.env.TEST_TRELLO_BOARD_DATA);

        const { members } = boardData;

        const createdMembersObj = await extractTrelloMembers(
            TEST_CREATED_WORKSPACE_ID,
            members,
            profile
        );

        let createdMembers = Object.values(createdMembersObj);

        expect(createdMembers.length).toEqual(members.length);

        expect(createdMembers.length).toEqual(3);

        const createdNames = createdMembers.map((member) => member.name);

        expect(createdNames.sort()).toEqual(
            ["Quilt Test", "Faraz Sanal", "Karan Godara"].sort()
        );

        const createdUserNames = createdMembers.map(
            (member) => member.userName
        );

        expect(createdUserNames.sort()).toEqual(
            ["karangodara1", "farazsanal", "quilttest"].sort()
        );

        for (let i = 0; i < createdMembers.length; i++) {
            const createdMember = createdMembers[i];

            let realMember = members.filter((member) => {
                member.id == createdMember.sourceId;
            });

            expect(realMember.length).toEqual(1);

            realMember = realMember[0];

            const { _id, sourceId, source, user } = createdMember;

            expect(source).toEqual("trello");

            if (sourceId === profile.sourceId) {
                expect(user).toEqual(TEST_USER_ID);
            }

            expect(_id).toBeDefined();
        }

        process.env.TEST_TRELLO_MEMBERS = JSON.stringify(createdMembersObj);
    });

    test("trelloControllerHelpers.extractTrelloBoard: expect board to match", async () => {
        const { extractTrelloBoard } = trelloControllerHelpers;

        const boardData = JSON.parse(process.env.TEST_TRELLO_BOARD_DATA);

        const members = JSON.parse(process.env.TEST_TRELLO_MEMBERS);

        const { id, name, idMemberCreator, url } = boardData;

        const board = await extractTrelloBoard(
            members,
            id,
            name,
            idMemberCreator,
            url
        );

        expect(board).toBeDefined();

        expect(board).toEqual({
            creator: members[idMemberCreator],
            name,
            link: url,
            source: "trello",
            sourceId: id,
        });

        expect(board.name).toEqual("Quilt Test Trello Board");

        process.env.TEST_TRELLO_BOARD = JSON.stringify(board);
    });

    test("trelloControllerHelpers.extractTrelloLists: expect lists to match", async () => {
        const { extractTrelloLists } = trelloControllerHelpers;

        const boardData = JSON.parse(process.env.TEST_TRELLO_BOARD_DATA);

        const { lists } = boardData;

        const board = JSON.parse(process.env.TEST_TRELLO_BOARD);

        const createdListsObj = await extractTrelloLists(lists, board);

        expect(createdListsObj).toBeDefined();

        const createdLists = Object.values(listsObj);

        expect(createdLists.length).toEqual(4);

        expect(createdLists.length).toEqual(lists.length);

        const createdNames = createdLists.map((list) => list.name);

        expect(createdNames.sort()).toEqual(
            ["Backlog", "To Do", "In Progress", "Done"].sort()
        );

        createdLists.map((list) => {
            const { name, source, sourceId, board } = list;

            expect(board).toEqual(board._id);

            expect(source).toEqual("trello");

            let realList = lists.filter((realList) => realList.id == sourceId);

            expect(realList.length).toEqual(1);

            realList = realList[0];

            expect(realList).toBeDefined();

            expect(name).toEqual(realList.name);
        });

        process.env.TEST_TRELLO_LISTS = JSON.stringify(createdListsObj);
    });

    test("trelloControllerHelpers.getContextRepositories: expect repositories of context to be retrieved", async () => {
        const { getContextRepositories } = trelloControllerHelpers;

        const context = JSON.parse(process.env.TEST_TRELLO_CONTEXT);

        const repositoryObjs = await getContextRepositories(context);

        const repositories = Object.values(repositoryObjs);

        expect(repositories.length).toEqual(1);

        const repository = repositories[0];

        expect(repository.fullName).toEqual("kgodara-testing/brodal_queue");
    });

    test("trelloControllerHelpers.extractTrelloDirectAttachments: expect direct attachments to be extracted", async () => {
        // create cards
        // create attachments on the card
        // expect attachments to be on the card as specified on the test board
    });

    test("trelloControllerHelpers.modifyTrelloActions: check to see actions were stored correctly on card", async () => {
        const { modifyTrelloActions } = trelloControllerHelpers;

        const boardData = JSON.parse(process.env.TEST_TRELLO_BOARD_DATA);

        let { actions, cards } = boardData;

        const context = JSON.parse(process.env.TEST_TRELLO_CONTEXT);

        const { event } = context;

        cards = _.mapKeys(cards, "id");

        cards = modifyTrelloActions(actions, cards, event);

        process.env.TEST_TRELLO_CARDS = JSON.stringify(cards);
    });

    test("trelloControllerHelpers.extractTrelloEvent: expect event to match", async () => {
        const { extractTrelloEvent } = trelloControllerHelpers;

        const context = JSON.parse(process.env.TEST_TRELLO_CONTEXT);

        const { event } = context;

        const board = JSON.parse(process.env.TEST_TRELLO_BOARD);

        const lists = JSON.parse(process.env.TEST_TRELLO_LISTS);

        const extractedEvent = await extractTrelloEvent(board, lists, event);

        const expectedEvent = {
            board: board._id,
            beginList: lists[event.beginListId]._id,
            endList: lists[event.endListId]._id,
            source: "trello",
            action: "movement",
        };

        expect(extractedEvent).toEqual(expectedEvent);

        process.env.TEST_TRELLO_EVENT = JSON.stringify(extractedEvent);
    });

    test("trelloControllerHelpers.extractTrelloIntervals: expect intervals to match", async () => {
        const { extractTrelloIntervals } = trelloControllerHelpers;

        const cards = JSON.parse(process.env.TEST_TRELLO_CARDS);

        const event = JSON.parse(process.env.TEST_TRELLO_EVENT);

        const lists = JSON.parse(process.env.TEST_TRELLO_LISTS);

        const extractedCardObjs = await extractTrelloIntervals(
            event,
            cards,
            lists
        );

        process.env.TEST_TRELLO_CARDS = JSON.stringify(extractedCardObjs);
    });

    test("trelloControllerHelpers.extractTrelloLabels: expect labels to match", async () => {
        const { extractTrelloLabels } = trelloControllerHelpers;

        const boardData = JSON.parse(process.env.TEST_TRELLO_BOARD_DATA);

        const { labels } = boardData;

        const createdLabelsObj = await extractTrelloLabels(labels);

        process.env.TEST_TRELLO_LABELS = JSON.stringify(createdLabelsObj);
    });

    
    test("bulkScrape: expect cards to match", async () => {
        const { bulkScrapeTrello } = trelloControllerHelpers;

        trelloControllerHelpers.acquireTrelloData = jest.fn(
            trelloControllerHelpers.acquireTrelloData
        );

        trelloControllerHelpers.acquireTrelloData.mockImplementation(() => {
            return JSON.parse(process.env.TEST_TRELLO_BOARD_DATA);
        });

        trelloControllerHelpers.extractTrelloMembers = jest.fn(
            trelloControllerHelpers.extractTrelloMembers
        );

        trelloControllerHelpers.extractTrelloMembers.mockImplementation(() => {
            return JSON.parse(process.env.TEST_TRELLO_MEMBERS);
        });

        trelloControllerHelpers.extractTrelloBoard = jest.fn(
            trelloControllerHelpers.extractTrelloBoard
        );

        trelloControllerHelpers.extractTrelloBoard.mockImplementation(() => {
            return JSON.parse(process.env.TEST_TRELLO_BOARD);
        });

        trelloControllerHelpers.extractTrelloLists = jest.fn(
            trelloControllerHelpers.extractTrelloLists
        );

        trelloControllerHelpers.extractTrelloLists.mockImplementation(() => {
            return JSON.parse(process.env.TEST_TRELLO_LISTS);
        });

        trelloControllerHelpers.extractTrelloDirectAttachments = jest.fn(
            trelloControllerHelpers.extractTrelloDirectAttachments
        );

        trelloControllerHelpers.extractTrelloDirectAttachments.mockImplementation(
            () => {
                return JSON.parse(process.env.TEST_TRELLO_CARDS);
            }
        );

        trelloControllerHelpers.modifyTrelloActions = jest.fn(
            trelloControllerHelpers.modifyTrelloActions
        );

        trelloControllerHelpers.modifyTrelloActions.mockImplementation(() => {
            return JSON.parse(process.env.TEST_TRELLO_CARDS);
        });

        trelloControllerHelpers.extractTrelloEvent = jest.fn(
            trelloControllerHelpers.extractTrelloEvent
        );

        trelloControllerHelpers.extractTrelloEvent.mockImplementation(() => {
            return JSON.parse(process.env.TEST_TRELLO_EVENT);
        });

        trelloControllerHelpers.extractTrelloIntervals = jest.fn(
            trelloControllerHelpers.extractTrelloIntervals
        );

        trelloControllerHelpers.extractTrelloIntervals.mockImplementation(
            () => {
                return JSON.parse(process.env.TEST_TRELLO_CARDS);
            }
        );

        trelloControllerHelpers.extractTrelloLabels = jest.fn(
            trelloControllerHelpers.extractTrelloLabels
        );

        trelloControllerHelpers.extractTrelloLabels.mockImplementation(() => {
            return JSON.parse(process.env.TEST_TRELLO_LABELS);
        });

        const profile = JSON.parse(process.env.TEST_TRELLO_CONNECT_PROFILE);

        const contexts = [JSON.parse(process.env.TEST_TRELLO_CONTEXT)];

        const tickets = await bulkScrapeTrello(
            profile,
            TEST_USER_ID,
            TEST_CREATED_WORKSPACE_ID,
            contexts
        );
    });*/
});
