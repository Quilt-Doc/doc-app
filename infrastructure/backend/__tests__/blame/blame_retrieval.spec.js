require("dotenv").config();
const util = require("util");
const mongoose = require("mongoose");

const api = require("../../apis/api");

const InsertHunk = require("../../models/InsertHunk");

const _ = require("lodash");

// util helpers
const {
    createWorkspace,
    deleteWorkspace,
    removeWorkspaces,
} = require("../../__tests__config/utils");

//blame helpers
const {
    encodeText,
    computeContextBlames,
    computeBlameChunkBoundaries,
    insertHunksIntoBounds,
    populateBoundaries,
    queryObjects,
    retrieveBlame,
} = require("../../controllers/contexts/BlameHelpers");

// env variables
const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

beforeAll(async () => {
    const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

    await mongoose.connect(dbRoute, { useNewUrlParser: true });

    let db = mongoose.connection;

    db.once("open", () => console.log("connected to the database"));

    db.on("error", console.error.bind(console, "MongoDB connection error:"));

    const { createdWorkspaceId, repositoryIds } = await createWorkspace([
        "kgodara-testing/brodal_queue",
    ]);

    process.env.TEST_REPOSITORY_ID = repositoryIds[0];

    process.env.WORKSPACE_ID = createdWorkspaceId;

    process.env.isTesting = true;
});

describe("Test Blame Chunk and Contextual Blame Retrieval ", () => {
    /*
    test("encodeText: Text is encoded as expected", async () => {
        let encoder = {
            textEncoding: {},
            counter: 0,
        };

        const fileText = ["A", "B", "C", "D", "E", "F", "G", "H"];
        const encoded1 = encodeText(encoder, fileText);
        expect(encoded1).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);

        const hunk1 = {
            lines: ["C", "X", "Y"],
        };
        const encoded2 = encodeText(encoder, hunk1.lines);
        expect(encoded2).toEqual([2, 8, 9]);

        const hunk2 = {
            lines: ["B", "A", "E", "G", "H"],
        };
        const encoded3 = encodeText(encoder, hunk2.lines);
        expect(encoded3).toEqual([1, 0, 4, 6, 7]);

        const hunk3 = {
            lines: ["Z", "A", "X", "Q", "R", "BA"],
        };
        const encoded4 = encodeText(encoder, hunk3.lines);
        expect(encoded4).toEqual([10, 0, 8, 11, 12, 13]);

        const hunk4 = {
            lines: [""],
        };
        const encoded5 = encodeText(encoder, hunk4.lines);
        expect(encoded5).toEqual([14]);
    });

    test("computeContextBlames: Ensure simple blame computation is correct", () => {
        testHelper = (fileText, hunk, seq, start, end) => {
            hunk = {
                encodedText: hunk,
                lines: hunk,
            };

            const { chosenSequence, patch } = computeContextBlames(
                fileText,
                hunk,
                100,
                0
            );

            expect(chosenSequence).toEqual(seq);

            if (chosenSequence != null) {
                expect(patch.start).toEqual(start);

                expect(patch.end).toEqual(end);
            } else {
                expect(patch).toEqual(null);
            }
        };

        testHelper(["0"], ["0"], ["0"], 0, 0);

        testHelper([0], [0], [0], 0, 0);

        testHelper([0, 1], [1], [1], 1, 1);

        testHelper([0, 1, 2, 3, 4, 5, 6, 7, 8], [1, 5, 8], [1, 5, 8], 1, 8);

        testHelper(
            [0, 1, 2, 3, 4, 5, 6, 7, 8],
            [5, 20, 11, 3, 7],
            [3, 7],
            3,
            7
        );

        testHelper([0, 1, 2, 3, 4, 5, 6, 7, 8], [20], null);

        testHelper([3], [5, 7, 9, 13, 31, 15, 17, 28], null);

        testHelper(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            [4, 4, 5, 5, 3, 4, 9, 7, 4, 25, 12, 13],
            [3, 4, 7, 12],
            3,
            12
        );

        testHelper(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            [4, 4, 5, 5, 3, 4, 9, 7, 4, 25, 12, 13],
            [3, 4, 7, 12],
            3,
            12
        );

        testHelper(["A", "B", "C"], ["D", "E", "F", "G"], null);

        testHelper(
            ["A", "B", "C", "D", "G", "H"],
            ["A", "E", "D", "F", "H", "R"],
            ["A", "D", "H"],
            0,
            5
        );

        testHelper(
            ["A", "G", "G", "T", "A", "B"],
            ["G", "X", "T", "X", "A", "Y", "B"],
            ["G", "T", "A", "B"],
            1,
            5
        );

        testHelper(
            ["A", "B", "C", "D", "A", "F"],
            ["A", "C", "B", "C", "F"],
            ["A", "B", "C", "F"],
            0,
            5
        );
    });

    test("computeContextBlames: Ensure windowing and length cutoff are correct", () => {
        const fileText = [];

        for (let i = 0; i < 300; i++) {
            fileText.push(i);
        }

        testHelper = (hunk, windowSize, lengthThreshold, seq, start, end) => {
            hunk = {
                encodedText: hunk,
                lines: hunk,
            };

            const { chosenSequence, patch } = computeContextBlames(
                fileText,
                hunk,
                windowSize,
                lengthThreshold
            );

            expect(chosenSequence).toEqual(seq);

            if (chosenSequence != null) {
                expect(patch.start).toEqual(start);

                expect(patch.end).toEqual(end);
            } else {
                expect(patch).toEqual(null);
            }
        };

        // WINDOW TESTS
        // windowSize = 7
        testHelper([1, 2, 3, 270, 280, 281, 282], 1, 0, [1, 2, 3], 1, 3);

        // windowSize = 5
        testHelper(
            [1, 2, 3, 4, 30, 31, 32, 33, 34, 35, 58, 60, 61, 280],
            5 / 14,
            0,
            [30, 31, 32, 33, 34, 35],
            30,
            35
        );

        // windowSize = 19
        testHelper([1, 19, 21, 40, 80, 95], 19 / 6, 0, [1, 19], 1, 19);

        // windowSize = 20
        testHelper([1, 19, 21, 40, 80, 95], 20 / 6, 0, [1, 19, 21], 1, 21);

        // windowSize = 19
        testHelper([1, 4, 70, 80, 90, 34, 3, 4, 19], 18 / 9, 0, [1, 4], 1, 4);

        // windowSize = 90
        testHelper(
            [1, 4, 70, 80, 90, 34, 3, 4, 19],
            90 / 9,
            0,
            [1, 4, 70, 80, 90],
            1,
            90
        );

        // min length = 5
        testHelper(
            [1, 4, 70, 80, 90, 34, 3, 4, 19],
            90 / 9,
            5 / 9,
            null,
            1,
            90
        );

        // min length = 4
        testHelper(
            [1, 4, 70, 80, 90, 34, 3, 4, 19],
            90 / 9,
            4 / 9,
            [1, 4, 70, 80, 90],
            1,
            90
        );
    });

    test("computeContextBlames: Test race conditions", () => {
        let fileText = [];

        for (let i = 0; i < 1000; i++) {
            fileText.push(i);
        }

        let sample = [];

        for (let i = 0; i < 200; i++) {
            sample.push(i);
        }

        const hunk = {
            encodedText: sample,
            lines: sample,
        };

        const iter = 30;

        for (let i = 0; i < iter; i++) {
            const { chosenSequence, patch } = computeContextBlames(
                fileText,
                hunk,
                1.5,
                0
            );
        }
    });

    test("computeBlameChunkBoundaries: Ensure simple boundary computation is correct", () => {
        const text = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

        const testHelper = (hunks, boundaries) => {
            hunks = hunks.map((hunk) => {
                return {
                    chosenPatch: {
                        start: hunk[0],
                        end: hunk[1],
                    },
                };
            });

            boundaries = boundaries.map((boundary) => {
                return {
                    start: boundary[0],
                    end: boundary[1],
                };
            });

            const received = computeBlameChunkBoundaries(hunks, text);

            expect(received).toEqual(boundaries);
        };

        // Base Case tests
        testHelper(
            [[0, 0]],
            [
                [0, 0],
                [1, 15],
            ]
        );

        testHelper(
            [
                [5, 12],
                [15, 15],
            ],
            [
                [0, 4],
                [5, 12],
                [13, 14],
                [15, 15],
            ]
        );

        testHelper(
            [
                [1, 3],
                [5, 8],
                [9, 12],
                [13, 15],
            ],
            [
                [0, 0],
                [1, 3],
                [4, 4],
                [5, 8],
                [9, 12],
                [13, 15],
            ]
        );

        // Overlap Tests
        testHelper(
            [
                [8, 12],
                [10, 14],
                [0, 7],
                [3, 5],
                [4, 8],
            ],
            [
                [0, 2],
                [3, 3],
                [4, 5],
                [6, 7],
                [8, 8],
                [9, 9],
                [10, 12],
                [13, 14],
                [15, 15],
            ]
        );

        testHelper(
            [
                [0, 2],
                [6, 9],
                [7, 8],
                [12, 15],
            ],
            [
                [0, 2],
                [3, 5],
                [6, 6],
                [7, 8],
                [9, 9],
                [10, 11],
                [12, 15],
            ]
        );

        testHelper(
            [
                [2, 5],
                [3, 4],
                [0, 13],
                [2, 5],
                [8, 13],
            ],
            [
                [0, 1],
                [2, 2],
                [3, 4],
                [5, 5],
                [6, 7],
                [8, 13],
                [14, 15],
            ]
        );

        testHelper(
            [
                [0, 13],
                [1, 8],
                [1, 6],
                [1, 5],
                [2, 7],
                [9, 13],
                [9, 15],
            ],
            [
                [0, 0],
                [1, 1],
                [2, 5],
                [6, 6],
                [7, 7],
                [8, 8],
                [9, 13],
                [14, 15],
            ]
        );
    });

    test("insertHunksIntoBounds: Ensure base case testing", () => {
        const testHelper = (
            hunks,
            boundaries,
            type,
            expectedChunks,
            expectedHunks
        ) => {
            const field = type == "commits" ? "commitSha" : "pullRequestNumber";
            hunks = hunks.map((hunk) => {
                return {
                    chosenPatch: {
                        start: hunk[0],
                        end: hunk[1],
                    },
                    [field]: hunk[2],
                };
            });

            boundaries = boundaries.map((boundary) => {
                return {
                    start: boundary[0],
                    end: boundary[1],
                };
            });

            insertHunksIntoBounds(hunks, boundaries, type);

            hunks.map((hunk, i) => {
                expect(hunk.chunks).toEqual(expectedChunks[i]);
            });

            boundaries.map((bound, i) => {
                if (bound[type]) {
                    expect(Array.from(bound[type])).toEqual(expectedHunks[i]);
                } else {
                    expect([]).toEqual(expectedHunks[i]);
                }
            });
        };

        // cases:
        // overlaps and hunk is before a
        // overlaps and hunk is after b
        // boundary contains hunk c
        // hunk contains boundary d

        let hunks = [
            [1, 7, 1],
            [8, 15, 2],
            [16, 25, 3],
            [26, 50, 4],
        ];

        let boundaries = [
            [0, 9], // [1, 7] -- c  [8, 15] -- b
            [10, 14], // [8, 15] -- d
            [15, 15], // [8, 15] -- d
            [16, 19], // [16, 25] -- d
            [20, 28], // [16, 25] -- a [26, 50] -- b
            [29, 45], // [26, 50] -- d
            [45, 55], // [26, 50] -- a
        ];

        testHelper(
            hunks,
            boundaries,
            "commits",
            [[0], [0, 10, 15], [16, 20], [20, 29, 45]],
            [[1, 2], [2], [2], [3], [3, 4], [4], [4]]
        );

        hunks = [
            [1, 3, 1],
            [2, 6, 2],
            [9, 12, 3],
            [10, 14, 4],
        ];

        boundaries = [
            [0, 0],
            [1, 3],
            [4, 6],
            [7, 8],
            [9, 9],
            [10, 13],
            [14, 15],
        ];

        testHelper(
            hunks,
            boundaries,
            "pullRequests",
            [[1], [1, 4], [9, 10], [10, 14]],
            [[], [1, 2], [2], [], [3], [3, 4], [4]]
        );
    });

    test("populateBoundaries: Ensure base case testing", () => {
        const testHelper = (
            boundaries,
            hunks,
            commits,
            pullRequests,
            commitTicketAssocs,
            commitDocAssocs,
            prTicketAssocs,
            prDocAssocs
        ) => {
            hunks = hunks.map((hunk) => {
                return {
                    chunks: hunk,
                };
            });

            commits = commits.map((ids, i) => {
                return {
                    hunks: ids.map((id) => hunks[id]),
                    _id: i,
                };
            });

            pullRequests = pullRequests.map((ids, i) => {
                return {
                    hunks: ids.map((id) => hunks[id]),
                    _id: i,
                };
            });

            let tickets = {};

            let documents = {};

            commitTicketAssocs = commitTicketAssocs
                .map((ids, i) => {
                    tickets[i] = {};

                    return ids.map((id) => {
                        return {
                            firstElementModelType: "IntegrationTicket",
                            secondElementModelType: "Commit",
                            firstElement: i,
                            secondElement: id,
                        };
                    });
                })
                .flat();

            commitDocAssocs = commitDocAssocs
                .map((ids, i) => {
                    documents[i] = {};

                    return ids.map((id) => {
                        return {
                            firstElementModelType: "IntegrationDocument",
                            secondElementModelType: "Commit",
                            firstElement: i,
                            secondElement: id,
                        };
                    });
                })
                .flat();

            prTicketAssocs = prTicketAssocs
                .map((ids, i) => {
                    return ids.map((id) => {
                        return {
                            firstElementModelType: "IntegrationTicket",
                            secondElementModelType: "PullRequest",
                            firstElement: i,
                            secondElement: id,
                        };
                    });
                })
                .flat();

            prDocAssocs = prDocAssocs
                .map((ids, i) => {
                    return ids.map((id) => {
                        return {
                            firstElementModelType: "IntegrationDocument",
                            secondElementModelType: "PullRequest",
                            firstElement: i,
                            secondElement: id,
                        };
                    });
                })
                .flat();

            const associations = [
                commitTicketAssocs,
                commitDocAssocs,
                prTicketAssocs,
                prDocAssocs,
            ].flat();

            boundaries = boundaries.map((boundary) => {
                return {
                    start: boundary[0],
                    end: boundary[1],
                };
            });

            const pullRequestsMap = _.mapKeys(pullRequests, "_id");

            const commitsMap = _.mapKeys(commits, "_id");

            boundaries = _.mapKeys(boundaries, "start");

            populateBoundaries(
                associations,
                boundaries,
                pullRequestsMap,
                commitsMap,
                tickets,
                documents
            );

            expect(boundaries).toEqual({
                0: { start: 0, end: 3, tickets: new Set([0, 1]) },
                4: { start: 4, end: 8, tickets: new Set([0, 1, 2]) },
                9: {
                    start: 9,
                    end: 12,
                    tickets: new Set([1, 2, 0]),
                    documents: new Set([0]),
                },
            });
        };

        const boundaries = [
            [0, 3],
            [4, 8],
            [9, 12],
        ];

        // 2, 3
        const hunks = [[0], [4], [9], [4, 9]];

        // 1, 2
        const commits = [[0, 1], [2], [3]];

        // 1, 2
        const pullRequests = [[1], [2], [3]];

        // 1, 2
        const commitTicketAssocs = [[0], [0, 1], [2]];

        // 0
        const commitDocAssocs = [[1]];

        // 0, 1
        const prTicketAssocs = [[1], [2]];

        //
        const prDocAssocs = [];

        testHelper(
            boundaries,
            hunks,
            commits,
            pullRequests,
            commitTicketAssocs,
            commitDocAssocs,
            prTicketAssocs,
            prDocAssocs
        );
    });*/

    test("retrieveBlame: Ensure base case testing", async () => {
        //const hunks = await InsertHunk.find({ filePath: "BinomialQueue.py" });

        const fileText = `from heap_lib import node
        from heap_lib import print_queue

        class binomial_queue:

            def __init__(self, rank, children):
                self.rank = rank
                self.children = children
                map((lambda x: x.set_parent(self)), self.children)
                self.children.sort(key=lambda x: x.rank)

            def get_root(self):
                return self.val

            def get_rank(self):
                return self.rank

            def link(self, tree1, tree2):

                if tree1.rank == tree2.rank:

                    if tree1.val <= tree2.val:

                        tree1.children.append(tree2)
                        tree1.rank += 1

                        index = 0

                        iter_list = None
                        if tree2.parent is not None:
                            iter_list = tree2.parent
                        else:
                            iter_list = self

                        for idx, child in enumerate(iter_list.children):
                            if id(child) == id(tree2):
                                index = idx

                        del iter_list.children[index]

                        tree2.parent = tree1
                        return 0

                    else:
                        tree2.children.append(tree1)
                        tree2.rank += 1

                        index = -1

                        iter_list = None
                        if tree1.parent is not None:
                            iter_list = tree1.parent
                        else:
                            iter_list = self

                        for idx, child in enumerate(iter_list.children):
                            if id(child) == id(tree1):
                                index = idx

                        del iter_list.children[index]

                        tree1.parent = tree2
                        return 1
                return -1

            def insert(self, val):
                insert_tree = node(0, val, [])
                sameRank = False
                self.children.append(insert_tree)
                self.children.sort(key=lambda x: x.rank)
                insert_tree.parent = None

                self.insert_helper(insert_tree)

            def insert_helper(self, insert_tree):

                iter_list = None
                if insert_tree.parent is not None:
                    iter_list = insert_tree.parent
                else:
                    iter_list = self

                for sibling in iter_list.children:

                    sibling_list = None
                    if sibling.parent is not None:
                        sibling_list = sibling.parent
                    else:
                        sibling_list = self

                    if sibling.rank == insert_tree.rank:

                        if(id(sibling) != id(insert_tree)):
                            elevated_rank = self.link(sibling, insert_tree)
                            if elevated_rank == 0:
                                children = sibling_list.children
                                elevated_rank = sibling.rank
                            else:
                                children = iter_list.children
                                elevated_rank = insert_tree.rank

                            for tree in children:
                                if tree.rank == elevated_rank:
                                    self.insert_helper(tree)
                                    break

            def meld_queue(self, new_queue):
                self.children.extend(new_queue.children)
                self.children.sort(key=lambda x: x.rank)

                i = 0
                while i < (len(self.children) - 1):

                    if self.children[i].rank == self.children[i+1].rank:
                        result = self.link(self.children[i], self.children[i+1])
                        # Prevents us from looping to -1, which ruins the whole meld
                        if i > 0:
                            i -= 1
                    else:
                        i += 1

            def get_min(self):
                smallest = node(0, float("inf"), [])
                for tree in self.children:
                    if tree.val < smallest.val:
                        smallest = tree
                return smallest

            def extract_min(self):
                smallest = self.get_min()
                meld_queue = binomial_queue(smallest.rank, smallest.children)
                self.children.remove(smallest)
                self.meld_queue(meld_queue)


        # TEST / DEMO SECTION
        tree0 = node(0, 4, [])
        tree1 = node(1, 5, [node(0, 6, [])])
        tree2 = node(2, 8, [node(1, 10, [node(0, 11, [])]), node(0, 9, [])])

        queue0 = binomial_queue(3, [tree0, tree1, tree2])

        print('QUEUE 1:')
        print_queue(queue0)
        print()

        print('TRYING INSERT BELOW: ')
        queue0.insert(12)
        print_queue(queue0)
        print()

        tree3 = node(0, 7, [])
        tree4 = node(1, 13, [node(0, 17, [])])
        queue1 = binomial_queue(2, [tree3, tree4])
        print('QUEUE 2:')
        print_queue(queue1)
        print()

        queue0.meld_queue(queue1)
        print('MELDED QUEUE:')
        print_queue(queue0)
        print()

        print('EXTRACT MIN:')
        queue0.extract_min()
        print_queue(queue0)
        print()


        print("RAW 1")
        print("RAW 2")
        print("RAW 3")`;

        const filePath = "BinomialQueue.py";

        await retrieveBlame({
            params: {
                repositoryId: process.env.TEST_REPOSITORY_ID,
            },
            body: {
                filePath,
                fileText,
            },
        });
    });
});

/*
        const boundaries = [
            [0, 3],
            [4, 8],
            [9, 12],
            [13, 21],
            [22, 28],
            [29, 45],
            [46, 48],
            [49, 57],
        ];

        const hunks = [
            [0, 4],
            [4, 9],
            [22, 29, 46],
            [29],
            [29, 46],
            [46, 49],
            [49],
        ];

        const commits = [
            [0, 3, 5],
            [1, 2],
            [0, 1, 2],
            [4, 6],
            [3, 6],
            [1, 6],
            [2, 5],
        ];

        const pullRequests = [
            [0, 1, 2, 3, 4, 5],
            [1, 3, 4],
            [2, 1, 4],
            [1],
            [],
            [6],
            [1, 3, 5],
        ];

        //ticket is index
        const commitTicketAssocs = [
            [0, 2, 3],
            [1, 4, 3],
            [2, 5, 6],
            [1, 3],
            [4, 3],
            [1, 2, 3, 4, 5, 6],
        ];

        const commitDocAssocs = [[0, 1], [2], [], [3, 4], [5, 6]];

        const prTicketAssocs = [
            [5, 6],
            [0, 1],
            [2, 3],
        ];

        const prDocAssocs = [[1, 2], [3, 4], [5]];
*/
