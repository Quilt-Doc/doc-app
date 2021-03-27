require("dotenv").config();

const api = require("../apis/api");

const mongoose = require("mongoose");

const _ = require("lodash");

const trelloControllerHelpers = require("../controllers/integrations/trello/TrelloControllerHelpers");

const testData = require("../__tests__data/02_trello_bulk_scrape_data");

//models
const Repository = require("../models/Repository");

const {
    createWorkspace,
    deleteWorkspace,
    removeWorkspaces,
} = require("../__tests__config/utils");

const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

addDays = (date, days) => {
    let result = new Date(date);

    result.setDate(result.getDate() + days);

    return result;
};

beforeAll(async () => {
    const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

    await mongoose.connect(dbRoute, { useNewUrlParser: true });

    let db = mongoose.connection;

    db.once("open", () => console.log("connected to the database"));

    db.on("error", console.error.bind(console, "MongoDB connection error:"));

    const { createdWorkspaceId, repositoryIds } = await createWorkspace([
        "kgodara-testing/brodal_queue",
    ]);

    process.env.TEST_CREATED_WORKSPACE_ID = createdWorkspaceId;
});

afterAll(async () => {
    const { deleteTrelloBoardComplete } = trelloControllerHelpers;

    const extractArray = (envVar) => {
        if (envVar) return Object.values(JSON.parse(envVar));

        return null;
    };

    const backendClient = api.requestTestingUserBackendClient();

    const createdBoard = JSON.parse(process.env.TEST_TRELLO_BOARD);

    await backendClient.delete(
        `/integrations/${process.env.TEST_CREATED_WORKSPACE_ID}/${TEST_USER_ID}/trello/remove_integration/${createdBoard._id}`
    );

    const deleteParams = {
        members: extractArray(process.env.TEST_TRELLO_MEMBERS),
        board: process.env.TEST_TRELLO_BOARD
            ? JSON.parse(process.env.TEST_TRELLO_BOARD)
            : null,
        lists: extractArray(process.env.TEST_TRELLO_LISTS),
        attachments: extractArray(process.env.TEST_TRELLO_ATTACHMENTS),
        cards: extractArray(process.env.TEST_TRELLO_CARDS),
        event: process.env.TEST_TRELLO_EVENT
            ? JSON.parse(process.env.TEST_TRELLO_EVENT)
            : null,
        labels: extractArray(process.env.TEST_TRELLO_LABELS),
        intervals: extractArray(process.env.TEST_TRELLO_INTERVALS),
        associations: extractArray(process.env.TEST_TRELLO_ASSOCIATIONS),
    };

    //await deleteTrelloBoardComplete(deleteParams);

    await deleteWorkspace(process.env.TEST_CREATED_WORKSPACE_ID);

    delete process.env.TEST_TRELLO_MEMBERS;

    delete process.env.TEST_TRELLO_BOARD;

    delete process.env.TEST_TRELLO_LISTS;

    delete process.env.TEST_TRELLO_ATTACHMENTS;

    delete process.env.TEST_TRELLO_CARDS;

    delete process.env.TEST_TRELLO_EVENT;

    delete process.env.TEST_TRELLO_LABELS;

    delete process.env.TEST_TRELLO_CONTEXT;

    delete process.env.TEST_TRELLO_BULK_SCRAPE_RESULT;

    delete process.env.TEST_TRELLO_ASSOCIATIONS;
});

// NEED TO ADD BOARD TO SOME INTEGRATION METHODS AND EQUALITY CHECKS
describe("Test Trello Bulk Scrape Basic", () => {
    let backendUserClient;

    beforeEach(() => {
        backendUserClient = api.requestTestingUserBackendClient();
    });

    test("trelloControllerHelpers.acquireTrelloConnectProfile: Trello access token should match", async () => {
        console.log("ENTERED HERE");

        const { acquireTrelloConnectProfile } = trelloControllerHelpers;

        console.log("ENTERED HERE");

        const profile = await acquireTrelloConnectProfile(TEST_USER_ID);

        console.log("ENTERED HERE");

        const { accessToken } = profile;

        console.log("ENTERED HERE");

        expect(accessToken).toEqual(
            "41be7274106907c3e057108d2b59b1ba0d338b5d3b9e86f87ee5c6f4674eea69"
        );

        console.log("ENTERED HERE", accessToken);

        process.env.TEST_TRELLO_CONNECT_PROFILE = JSON.stringify(profile);

        console.log("ENTERED HERE");
    });

    test("trelloControllerHelpers.acquireExternalTrelloBoards: Trello boards \
    should have correct length and not be null", async () => {
        const { acquireExternalTrelloBoards } = trelloControllerHelpers;

        const profile = JSON.parse(process.env.TEST_TRELLO_CONNECT_PROFILE);

        const externalBoards = await acquireExternalTrelloBoards(profile);

        expect(externalBoards).not.toBeNull();

        expect(externalBoards.length).toEqual(5);

        const boardNames = externalBoards.map((board) => board.name);

        expect(boardNames).toContain("Quilt Test Trello Board");

        const testBoard = externalBoards.filter(
            (board) => board.name === "Quilt Test Trello Board"
        )[0];

        const { lists } = testBoard;

        expect(lists.length).toEqual(4);

        let repositories = await Repository.find({
            fullName: "kgodara-testing/brodal_queue",
        });

        process.env.TEST_TRELLO_REPOSITORIES = JSON.stringify(repositories);

        process.env.TEST_TRELLO_BOARD_SOURCE_ID = testBoard.id;
    });

    test("trelloControllerHelpers.acquireTrelloData: \
    Trello board data extracted through Trello API is \
    populated correctly", async () => {
        const { acquireTrelloData } = trelloControllerHelpers;

        //const context = JSON.parse(process.env.TEST_TRELLO_CONTEXT);

        const boardSourceId = process.env.TEST_TRELLO_BOARD_SOURCE_ID;

        const profile = JSON.parse(process.env.TEST_TRELLO_CONNECT_PROFILE);

        //const { board: boardId } = context;

        const { accessToken } = profile;

        let boardData = await acquireTrelloData(boardSourceId, accessToken);

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

        //boardData.cards = cards.map((card) => {});
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
            process.env.TEST_CREATED_WORKSPACE_ID,
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

            let realMember = members.filter(
                (member) => member.id == createdMember.sourceId
            );

            expect(realMember.length).toEqual(1);

            realMember = realMember[0];

            const { _id, sourceId, source, user: userId } = createdMember;

            expect(source).toEqual("trello");

            if (sourceId === profile.sourceId) {
                expect(userId.toString()).toBe(TEST_USER_ID);
            }

            expect(_id).toBeDefined();
        }

        process.env.TEST_TRELLO_MEMBERS = JSON.stringify(createdMembersObj);
    });

    test("trelloControllerHelpers.extractTrelloBoard: expect board to match", async () => {
        const { extractTrelloBoard } = trelloControllerHelpers;

        const boardData = JSON.parse(process.env.TEST_TRELLO_BOARD_DATA);

        const members = JSON.parse(process.env.TEST_TRELLO_MEMBERS);

        const repositories = JSON.parse(process.env.TEST_TRELLO_REPOSITORIES);

        const repositoryIds = repositories.map((repo) => repo._id);

        const {
            id,
            name,
            idMemberCreator: boardCreatorSourceId,
            url,
        } = boardData;

        const board = await extractTrelloBoard(
            members,
            id,
            name,
            boardCreatorSourceId,
            url,
            repositoryIds
        );

        process.env.TEST_TRELLO_BOARD = JSON.stringify(board);

        expect(board).toBeDefined();

        const expectedBoard = {
            creator: members[boardCreatorSourceId]._id,
            name,
            link: url,
            source: "trello",
            sourceId: id,
            repositories: JSON.stringify(repositoryIds),
        };

        let receivedBoard = board.toJSON();

        receivedBoard.creator = receivedBoard.creator.toString();

        receivedBoard.repositories = JSON.stringify(receivedBoard.repositories);

        expect(receivedBoard).toMatchObject(expectedBoard);

        expect(board.name).toEqual("Quilt Test Trello Board");
    });

    test("trelloControllerHelpers.extractTrelloLists: expect lists to match", async () => {
        const { extractTrelloLists } = trelloControllerHelpers;

        const boardData = JSON.parse(process.env.TEST_TRELLO_BOARD_DATA);

        const { lists } = boardData;

        const board = JSON.parse(process.env.TEST_TRELLO_BOARD);

        const createdListsObj = await extractTrelloLists(lists, board);

        process.env.TEST_TRELLO_LISTS = JSON.stringify(createdListsObj);

        expect(createdListsObj).toBeDefined();

        const createdLists = Object.values(createdListsObj);

        expect(createdLists.length).toEqual(5);

        expect(createdLists.length).toEqual(lists.length);

        const createdNames = createdLists.map((list) => list.name);

        expect(createdNames.sort()).toEqual(
            ["Backlog", "To Do", "In Progress", "Done", "Misc"].sort()
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
    });

    test("trelloControllerHelpers.getRepositories: expect repositories to be retrieved", async () => {
        const { getRepositories } = trelloControllerHelpers;

        //const context = JSON.parse(process.env.TEST_TRELLO_CONTEXT);

        const testRepositories = JSON.parse(
            process.env.TEST_TRELLO_REPOSITORIES
        );

        const repositoryIds = testRepositories.map((repo) => repo._id);

        const repositoryObjs = await getRepositories(repositoryIds);

        const repositories = Object.values(repositoryObjs);

        expect(repositories.length).toEqual(1);

        const repository = repositories[0];

        expect(repository.fullName).toEqual("kgodara-testing/brodal_queue");
    });

    test("trelloControllerHelpers.extractTrelloDirectAttachments: expect direct attachments to be extracted", async () => {
        const { extractTrelloDirectAttachments } = trelloControllerHelpers;

        const repositories = JSON.parse(process.env.TEST_TRELLO_REPOSITORIES);

        const repositoryIds = repositories.map((repo) => repo._id);

        const boardData = JSON.parse(process.env.TEST_TRELLO_BOARD_DATA);

        const board = JSON.parse(process.env.TEST_TRELLO_BOARD);

        const { cards, attachments } = await extractTrelloDirectAttachments(
            boardData.cards,
            repositoryIds,
            board
        );

        process.env.TEST_TRELLO_ATTACHMENTS = JSON.stringify(attachments);

        process.env.TEST_TRELLO_CARDS = JSON.stringify(cards);

        const attachmentObj = _.mapKeys(attachments, "_id");

        const { cardDirectAttachments } = testData;

        cards.map((card) => {
            const { name, attachmentIds } = card;

            let expectedAttachments = cardDirectAttachments[name];

            if (expectedAttachments) {
                expectedAttachments = expectedAttachments.sort((a, b) =>
                    a.link < b.link ? 1 : -1
                );

                const receivedAttachments = attachmentIds
                    .map((id) => attachmentObj[id])
                    .sort((a, b) => (a.link < b.link ? 1 : -1));

                expect(receivedAttachments.length).toEqual(
                    expectedAttachments.length
                );

                expect(receivedAttachments).toMatchObject(expectedAttachments);
            }
        });
    });

    test("trelloControllerHelpers.modifyTrelloActions: check to see actions were stored correctly on card", async () => {
        const { modifyTrelloActions } = trelloControllerHelpers;

        const boardData = JSON.parse(process.env.TEST_TRELLO_BOARD_DATA);

        let { actions } = boardData;

        let cards = JSON.parse(process.env.TEST_TRELLO_CARDS);

        cards = _.mapKeys(cards, "id");

        cards = modifyTrelloActions(actions, cards);

        cards.sort((a, b) => {
            if (a.name < b.name) return -1;

            return 1;
        });

        const { cardRelevantActions } = testData;

        Object.values(cards).map((card) => {
            const { actions, name } = card;

            const expectedActions = cardRelevantActions[name];

            const { num, orderedLists } = expectedActions;

            if (!actions) {
                expect(num).toEqual(0);
            } else {
                const receivedLists = actions.map((action) => action.listName);

                expect(receivedLists.length).toEqual(num);

                expect(orderedLists).toEqual(receivedLists);
            }
        });

        process.env.TEST_TRELLO_CARDS = JSON.stringify(cards);
    });

    test("trelloControllerHelpers.extractTrelloIntervals: expect intervals to match", async () => {
        const { extractTrelloIntervals } = trelloControllerHelpers;

        const prevCards = JSON.parse(process.env.TEST_TRELLO_CARDS);

        const board = JSON.parse(process.env.TEST_TRELLO_BOARD);

        const { cards, intervals } = await extractTrelloIntervals(
            prevCards,
            board
        );

        const intervalCardNames = Object.values(cards)
            .filter(
                (card) =>
                    card.intervalIds !== null &&
                    card.intervalIds !== undefined &&
                    card.intervalIds.length > 0
            )
            .map((card) => card.name)
            .sort();

        const { cardRelevantActions } = testData;

        const expectedNames = Object.keys(cardRelevantActions)
            .filter((name) => {
                const actionData = cardRelevantActions[name];

                const { num } = actionData;

                return num != 0;
            })
            .sort();

        expect(intervalCardNames).toEqual(expectedNames);

        Object.values(cards).map((card) => {
            const { actions, intervalIds, intervalIdentifiers } = card;

            if (!actions) {
                expect(intervalIds).toBeUndefined();
            } else {
                expect(intervalIds.length).toEqual(actions.length);

                intervalIdentifiers.map((intervalIdentifier, i) => {
                    const interval = intervals[intervalIdentifier];

                    const action = actions[i];

                    expect(interval.end).toEqual(new Date(action.date));

                    expect(interval.start).toEqual(addDays(action.date, -10));
                });
            }
        });

        process.env.TEST_TRELLO_INTERVALS = JSON.stringify(intervals);

        process.env.TEST_TRELLO_CARDS = JSON.stringify(cards);
    });

    test("trelloControllerHelpers.extractTrelloLabels: expect labels to match", async () => {
        const { extractTrelloLabels } = trelloControllerHelpers;

        const boardData = JSON.parse(process.env.TEST_TRELLO_BOARD_DATA);

        const { labels } = boardData;

        const board = JSON.parse(process.env.TEST_TRELLO_BOARD);

        const createdLabelsObj = await extractTrelloLabels(labels, board);

        const createdLabels = Object.values(createdLabelsObj);

        const { expectedLabels } = testData;

        expect(
            createdLabels.sort((a, b) => (a.name < b.name ? 1 : -1))
        ).toMatchObject(
            expectedLabels.sort((a, b) => (a.name < b.name ? 1 : -1))
        );

        process.env.TEST_TRELLO_LABELS = JSON.stringify(createdLabelsObj);
    });

    test("bulkScrape: expect cards to match", async () => {
        const helpers = {
            acquireTrelloData: {
                data: process.env.TEST_TRELLO_BOARD_DATA,
                spy: null,
            },
            extractTrelloMembers: {
                data: process.env.TEST_TRELLO_MEMBERS,
                spy: null,
            },
            extractTrelloBoard: {
                data: process.env.TEST_TRELLO_BOARD,
                spy: null,
            },
            extractTrelloLists: {
                data: process.env.TEST_TRELLO_LISTS,
                spy: null,
            },
            extractTrelloDirectAttachments: {
                data: {
                    cards: Object.values(
                        JSON.parse(process.env.TEST_TRELLO_CARDS)
                    ),
                    attachments: JSON.parse(
                        process.env.TEST_TRELLO_ATTACHMENTS
                    ),
                },
                spy: null,
            },
            modifyTrelloActions: {
                data: Object.values(JSON.parse(process.env.TEST_TRELLO_CARDS)),
                spy: null,
            },
            extractTrelloIntervals: {
                data: {
                    cards: JSON.parse(process.env.TEST_TRELLO_CARDS),
                    intervals: JSON.parse(process.env.TEST_TRELLO_INTERVALS),
                },
                spy: null,
            },
            extractTrelloLabels: {
                data: process.env.TEST_TRELLO_LABELS,
                spy: null,
            },
        };

        Object.keys(helpers).map((helper) => {
            let { data } = helpers[helper];

            if (typeof data === "string") data = JSON.parse(data);

            let spy = jest.spyOn(trelloControllerHelpers, helper);

            spy.mockImplementation(() => data);

            helpers[helper].spy = spy;
        });

        const profile = JSON.parse(process.env.TEST_TRELLO_CONNECT_PROFILE);

        const boardSourceId = process.env.TEST_TRELLO_BOARD_SOURCE_ID;

        const repositoryIds = JSON.parse(
            process.env.TEST_TRELLO_REPOSITORIES
        ).map((repo) => repo._id);

        const boards = [{ sourceId: boardSourceId, repositoryIds }];
        //const contexts = [JSON.parse(process.env.TEST_TRELLO_CONTEXT)];

        const {
            bulkScrapeTrello,
        } = require("../controllers/integrations/trello/TrelloController");

        const result = await bulkScrapeTrello(
            profile,
            boards,
            process.env.TEST_CREATED_WORKSPACE_ID
        );

        Object.keys(helpers).map((helper) => {
            const { spy } = helper;

            if (spy) spy.mockRestore();
        });

        const { tickets: finalCards } = result[0];

        expect(finalCards.length).toEqual(10);

        const { expectedCardCounts } = testData;

        //const helperCards = JSON.parse(process.env.TEST_TRELLO_CARDS);

        finalCards.map((card) => {
            const {
                name,
                sourceId,
                attachments,
                members,
                intervals,
                labels,
            } = card;

            const counts = expectedCardCounts[name];

            const getLength = (arr) => (arr ? arr.length : 0);

            expect(getLength(attachments)).toEqual(counts.attachments);

            expect(getLength(members)).toEqual(counts.members);

            expect(getLength(intervals)).toEqual(counts.intervals);

            expect(getLength(attachments)).toEqual(counts.attachments);

            expect(getLength(labels)).toEqual(counts.labels);
        });

        process.env.TEST_TRELLO_BULK_SCRAPE_RESULT = JSON.stringify(finalCards);
    });
});

const DirectAssociationGenerator = require("../controllers/associations/helpers/directAssociationGenerator");

let directGenerator;

const testDataAssoc = require("../__tests__data/03_direct_association_creation_data");

describe("Test Direct Association Creation Basic", () => {
    beforeAll(() => {
        const board = JSON.parse(process.env.TEST_TRELLO_BOARD);

        directGenerator = new DirectAssociationGenerator(
            process.env.TEST_CREATED_WORKSPACE_ID,
            [board]
        );
    });

    test("AssociationGenerator.constructor: expect workspaceId and board fields to be populated properly", () => {
        expect(Object.values(directGenerator.boards).length).toEqual(1);

        expect(directGenerator.workspaceId).toEqual(
            process.env.TEST_CREATED_WORKSPACE_ID
        );

        const board = JSON.parse(process.env.TEST_TRELLO_BOARD);

        expect(Object.keys(directGenerator.boards)[0]).toEqual(board._id);

        expect(Object.values(directGenerator.boards)[0]).toMatchObject(board);
    });

    test("AssociationGenerator.acquireIntegrationObjects: expect integration tickets to match", async () => {
        await directGenerator.acquireIntegrationObjects();

        let cards = JSON.parse(process.env.TEST_TRELLO_BULK_SCRAPE_RESULT);

        cards = _.mapKeys(cards, "_id");

        directGenerator.tickets.map((ticket) => {
            const {
                attachments,
                intervals,
                board: { _id: boardId },
                _id,
            } = ticket;

            const match = cards[_id];

            const attachmentIds = attachments.map((attachment) =>
                attachment._id.toString()
            );

            const intervalIds = intervals.map((interval) =>
                interval._id.toString()
            );

            expect(boardId.toString()).toEqual(match.board.toString());

            expect(new Set(attachmentIds)).toEqual(new Set(match.attachments));

            expect(new Set(intervalIds)).toEqual(new Set(match.intervals));
        });
    });

    test("DirectAssociationGenerator.queryDirectAttachments: expect code objects to have been queried correctly", async () => {
        const queries = await directGenerator.queryDirectAttachments();

        let cards = JSON.parse(process.env.TEST_TRELLO_BULK_SCRAPE_RESULT);

        cards = _.mapKeys(cards, "_id");

        // from storage file to compare if queries were produced correctly
        const { expectedCardQueries } = testDataAssoc;

        // map through each model type
        Object.keys(queries).map((modelType) => {
            // set of seen ticket names
            let seen = new Set();

            // map through queries of that model
            Object.keys(queries[modelType]).map((ticketId) => {
                // extract name of ticketId
                const { name } = cards[ticketId];

                // expect the number of or clauses for that model
                // match actual number of code objects connected to ticket
                expect(
                    queries[modelType][ticketId][0]["$match"]["$or"].length
                ).toEqual(expectedCardQueries[name][modelType]);

                seen.add(name);
            });

            Object.keys(expectedCardQueries).map((key) => {
                // for each ticket not seen
                if (!seen.has(key)) {
                    // expect the # of related code objects to equal 0
                    expect(expectedCardQueries[key][modelType]).toEqual(0);
                }
            });
        });

        // data that has, for each model, for each ticket by name,
        // the associated code objects with sourceId
        const { expectedTicketToCO } = testDataAssoc;

        // modelTicketMap takes form
        // Map of Model Type -> Map of Ticket Ids -> Array of Code Objects
        // -> { "PullRequest" : { "1": [co1, co2] } }
        Object.keys(directGenerator.modelTicketMap).map((key) => {
            // extract for a model, the expected tickets to code objects
            const expectedTicketCO = expectedTicketToCO[key];

            // extract for a model, the expected tickets to code objects
            const ticketCO = directGenerator.modelTicketMap[key];

            // map through tickets
            Object.keys(ticketCO).map((ticketId) => {
                // get ticket
                const card = cards[ticketId];

                const { name } = card;

                const expectedCO = expectedTicketCO[name];

                const receivedCO = ticketCO[ticketId];

                // compare lengths of associated code object for this specific ticket
                expect(receivedCO.length).toEqual(expectedCO.length);

                expect(receivedCO.map((co) => co.sourceId).sort()).toEqual(
                    expectedCO.map((co) => co.sourceId).sort()
                );
            });
        });
    });

    test("DirectAssociationGenerator.insertDirectAssociations: expect associations to be inserted correctly", async () => {
        const associations = await directGenerator.insertDirectAssociations();

        expect(associations.length).toEqual(14);

        let associationLengthMapping = {};

        associations.map((association) => {
            const {
                firstElement,
                firstElementModelType,
                secondElementModelType,
                direct,
            } = association;

            expect(direct).toBeTruthy();

            expect(firstElementModelType).toEqual("IntegrationTicket");

            if (associationLengthMapping[firstElement]) {
                if (
                    associationLengthMapping[firstElement][
                        secondElementModelType
                    ]
                ) {
                    associationLengthMapping[firstElement][
                        secondElementModelType
                    ] += 1;
                } else {
                    associationLengthMapping[firstElement][
                        secondElementModelType
                    ] = 1;
                }
            } else {
                associationLengthMapping[firstElement] = {};

                associationLengthMapping[firstElement][
                    secondElementModelType
                ] = 1;
            }
        });

        const { expectedTicketToCO } = testDataAssoc;

        let cards = JSON.parse(process.env.TEST_TRELLO_BULK_SCRAPE_RESULT);

        cards = _.mapKeys(cards, "_id");

        Object.keys(associationLengthMapping).map((ticketId) => {
            Object.keys(associationLengthMapping[ticketId]).map((modelType) => {
                const mapping = {
                    PullRequest: "pullRequest",
                    IntegrationTicket: "issue",
                    Branch: "branch",
                    Commit: "commit",
                };

                const modelType2 = mapping[modelType];

                expect(associationLengthMapping[ticketId][modelType]).toEqual(
                    expectedTicketToCO[modelType2][cards[ticketId].name].length
                );
            });
        });

        process.env.TEST_TRELLO_ASSOCIATIONS = JSON.stringify(associations);
    });
});
