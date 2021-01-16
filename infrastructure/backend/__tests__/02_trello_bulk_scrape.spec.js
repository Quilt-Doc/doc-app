require("dotenv").config();

const api = require("../apis/api");

const mongoose = require("mongoose");

const _ = require("lodash");

const trelloControllerHelpers = require("../controllers/integrations/trello/TrelloControllerHelpers");

const testData = require("../__tests__data/02_trello_bulk_scrape_data");

const {
    TEST_USER_ID,
    TEST_CREATED_WORKSPACE_ID,
    EXTERNAL_DB_PASS,
    EXTERNAL_DB_USER,
} = process.env;

beforeAll(async () => {
    const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

    await mongoose.connect(dbRoute, { useNewUrlParser: true });

    let db = mongoose.connection;

    db.once("open", () => console.log("connected to the database"));

    db.on("error", console.error.bind(console, "MongoDB connection error:"));
});

afterAll(async () => {
    const { deleteTrelloBoardComplete } = trelloControllerHelpers;

    const extractArray = (envVar) => {
        if (envVar) return Object.values(JSON.parse(envVar));

        return null;
    };

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

    try {
        await deleteTrelloBoardComplete(deleteParams);
    } catch (e) {
        console.log(e);
    }

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

describe("Test Trello Bulk Scrape Basic", () => {
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

        expect(externalBoards.length).toEqual(2);

        const boardNames = externalBoards.map((board) => board.name);

        expect(boardNames).toContain("Quilt Test Trello Board");

        const testBoard = externalBoards.filter(
            (board) => board.name === "Quilt Test Trello Board"
        )[0];

        const { lists } = testBoard;

        expect(lists.length).toEqual(4);

        const beginListId = lists.filter(
            (list) => list.name === "In Progress"
        )[0].id;

        const endListId = lists.filter((list) => list.name === "Done")[0].id;

        let repositories = JSON.parse(process.env.TEST_CREATED_REPOSITORIES);

        repositories = repositories
            .filter(
                (repository) =>
                    repository.fullName == "kgodara-testing/brodal_queue"
            )
            .map((repo) => repo._id);

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

    test("trelloControllerHelpers.acquireTrelloData: \
    Trello board data extracted through Trello API is \
    populated correctly", async () => {
        const { acquireTrelloData } = trelloControllerHelpers;

        const context = JSON.parse(process.env.TEST_TRELLO_CONTEXT);

        const profile = JSON.parse(process.env.TEST_TRELLO_CONNECT_PROFILE);

        const { board: boardId } = context;

        const { accessToken } = profile;

        let boardData = await acquireTrelloData(boardId, accessToken);

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

        const { id, name, idMemberCreator, url } = boardData;

        const board = await extractTrelloBoard(
            members,
            id,
            name,
            idMemberCreator,
            url
        );

        process.env.TEST_TRELLO_BOARD = JSON.stringify(board);

        expect(board).toBeDefined();

        const expectedBoard = {
            creator: members[idMemberCreator]._id,
            name,
            link: url,
            source: "trello",
            sourceId: id,
        };

        let receivedBoard = board.toJSON();

        receivedBoard.creator = receivedBoard.creator.toString();

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
        const { extractTrelloDirectAttachments } = trelloControllerHelpers;

        const context = JSON.parse(process.env.TEST_TRELLO_CONTEXT);

        const boardData = JSON.parse(process.env.TEST_TRELLO_BOARD_DATA);

        const { cards, attachments } = await extractTrelloDirectAttachments(
            boardData.cards,
            context
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

        const context = JSON.parse(process.env.TEST_TRELLO_CONTEXT);

        const { event } = context;

        cards = _.mapKeys(cards, "id");

        cards = modifyTrelloActions(actions, cards, event);

        const { cardRelevantActions } = testData;

        Object.values(cards).map((card) => {
            const { actions, name } = card;

            const expectedActions = cardRelevantActions[name];

            const { inProg, done } = expectedActions;

            if (!actions) {
                expect(inProg).toEqual(0);

                expect(done).toEqual(0);
            } else {
                const inProgressActions = actions.filter(
                    (action) => action.listName === "In Progress"
                );

                const doneActions = actions.filter(
                    (action) => action.listName === "Done"
                );

                expect(inProgressActions.length).toEqual(inProg);

                expect(doneActions.length).toEqual(done);
            }
        });

        process.env.TEST_TRELLO_CARDS = JSON.stringify(cards);
    });

    test("trelloControllerHelpers.extractTrelloEvent: expect event to match", async () => {
        const { extractTrelloEvent } = trelloControllerHelpers;

        const context = JSON.parse(process.env.TEST_TRELLO_CONTEXT);

        const { event } = context;

        const board = JSON.parse(process.env.TEST_TRELLO_BOARD);

        const lists = JSON.parse(process.env.TEST_TRELLO_LISTS);

        const extractedEvent = await extractTrelloEvent(board, lists, event);

        let receivedEvent = extractedEvent.toJSON();

        receivedEvent.board = receivedEvent.board.toString();

        receivedEvent.beginList = receivedEvent.beginList.toString();

        receivedEvent.endList = receivedEvent.endList.toString();

        const expectedEvent = {
            board: board._id,
            beginList: lists[event.beginListId]._id,
            endList: lists[event.endListId]._id,
            source: "trello",
            action: "movement",
        };

        expect(receivedEvent).toMatchObject(expectedEvent);

        process.env.TEST_TRELLO_EVENT = JSON.stringify(extractedEvent);
    });

    test("trelloControllerHelpers.extractTrelloIntervals: expect intervals to match", async () => {
        const { extractTrelloIntervals } = trelloControllerHelpers;

        const prevCards = JSON.parse(process.env.TEST_TRELLO_CARDS);

        const event = JSON.parse(process.env.TEST_TRELLO_EVENT);

        const lists = JSON.parse(process.env.TEST_TRELLO_LISTS);

        const { cards, intervals } = await extractTrelloIntervals(
            event,
            prevCards,
            lists
        );

        const intervalCardNames = Object.values(cards)
            .filter(
                (card) =>
                    card.intervalIds !== null &&
                    card.intervalIds !== undefined &&
                    card.intervalIds.length > 0
            )
            .map((card) => card.name);

        expect(intervalCardNames.sort()).toEqual(
            ["Test11", "Test2", "Test4", "Test3"].sort()
        );

        process.env.TEST_TRELLO_INTERVALS = JSON.stringify(intervals);

        process.env.TEST_TRELLO_CARDS = JSON.stringify(cards);
    });

    test("trelloControllerHelpers.extractTrelloLabels: expect labels to match", async () => {
        const { extractTrelloLabels } = trelloControllerHelpers;

        const boardData = JSON.parse(process.env.TEST_TRELLO_BOARD_DATA);

        const { labels } = boardData;

        const createdLabelsObj = await extractTrelloLabels(labels);

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
                    cards: JSON.parse(process.env.TEST_TRELLO_CARDS),
                    attachments: JSON.parse(
                        process.env.TEST_TRELLO_ATTACHMENTS
                    ),
                },
                spy: null,
            },
            modifyTrelloActions: {
                data: process.env.TEST_TRELLO_CARDS,
                spy: null,
            },
            extractTrelloEvent: {
                data: process.env.TEST_TRELLO_EVENT,
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

        const contexts = [JSON.parse(process.env.TEST_TRELLO_CONTEXT)];

        const {
            bulkScrapeTrello,
        } = require("../controllers/integrations/trello/TrelloIntegrationController");

        const resultMapping = await bulkScrapeTrello(
            profile,
            TEST_USER_ID,
            TEST_CREATED_WORKSPACE_ID,
            contexts
        );

        Object.keys(helpers).map((helper) => {
            const { spy } = helper;

            if (spy) spy.mockRestore();
        });

        const { tickets: finalCards, context: contextObj } = Object.values(
            resultMapping
        )[0];

        process.env.TEST_TRELLO_CONTEXT = JSON.stringify(contextObj);

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
        });

        process.env.TEST_TRELLO_BULK_SCRAPE_RESULT = JSON.stringify(finalCards);
    });
});

const DirectAssociationGenerator = require("../controllers/associations/helpers/directAssociationGenerator");

let directGenerator;

const testDataAssoc = require("../__tests__data/03_direct_association_creation_data");

describe("Test Direct Association Creation Basic", () => {
    beforeAll(() => {
        directGenerator = new DirectAssociationGenerator(
            process.env.TEST_CREATED_WORKSPACE_ID,
            [JSON.parse(process.env.TEST_TRELLO_CONTEXT)]
        );
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

    test("DirectAssociationGenerator.identifyScrapedRepositories: scrapedRepositories is empty", async () => {
        await directGenerator.identifyScrapedRepositories();

        const boardId = directGenerator.boardIds[0];

        expect(directGenerator.scrapedRepositories[boardId]).toEqual(new Set());
    });

    test("DirectAssociationGenerator.updateScrapedAssociations: expect update associations to resolve", async () => {
        await directGenerator.updateScrapedAssociations();
    });

    test("DirectAssociationGenerator.ueryDirectAttachments: expect code objects to have been queried correctly", async () => {
        const queries = await directGenerator.queryDirectAttachments();

        let cards = JSON.parse(process.env.TEST_TRELLO_BULK_SCRAPE_RESULT);

        cards = _.mapKeys(cards, "_id");

        const { expectedCardQueries } = testDataAssoc;

        Object.keys(queries).map((modelType) => {
            let seen = new Set();

            Object.keys(queries[modelType]).map((ticketId) => {
                const { name } = cards[ticketId];

                expect(
                    queries[modelType][ticketId][0]["$match"]["$or"].length
                ).toEqual(expectedCardQueries[name][modelType]);

                seen.add(name);
            });

            Object.keys(expectedCardQueries).map((key) => {
                if (!seen.has(key))
                    expect(expectedCardQueries[key][modelType]).toEqual(0);
            });
        });

        const { expectedTicketToCO } = testDataAssoc;

        Object.keys(directGenerator.ticketsToCO).map((key) => {
            const expectedTicketCO = expectedTicketToCO[key];

            const ticketCO = directGenerator.ticketsToCO[key];

            Object.keys(ticketCO).map((ticketId) => {
                const card = cards[ticketId];

                const { name } = card;

                const expectedCO = expectedTicketCO[name];

                const receivedCO = ticketCO[ticketId];

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
