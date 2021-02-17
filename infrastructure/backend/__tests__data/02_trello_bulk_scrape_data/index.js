const cardDirectAttachments = {
    Test1: [
        {
            link: "https://github.com/kgodara-testing/brodal_queue/pull/4",
            modelType: "pullRequest",
            sourceId: "4",
        },
    ],

    Test2: [
        {
            link:
                "https://github.com/kgodara-testing/brodal_queue/commit/3ae1937dc990088674563976a581abcadf53171c",
            modelType: "commit",
            sourceId: "3ae1937dc990088674563976a581abcadf53171c",
        },
        {
            link: "https://github.com/kgodara-testing/brodal_queue/pull/1",
            modelType: "pullRequest",
            sourceId: "1",
        },
    ],

    Test3: [],

    Test4: [
        {
            link:
                "https://github.com/kgodara-testing/brodal_queue/tree/parse_branch",
            modelType: "branch",
            sourceId: "parse_branch",
        },
    ],

    Test5: [],

    Test6: [
        {
            link: "https://github.com/kgodara-testing/brodal_queue/pull/5",
            modelType: "pullRequest",
            sourceId: "5",
        },
        {
            link:
                "https://github.com/kgodara-testing/brodal_queue/commit/3ae1937dc990088674563976a581abcadf53171c",
            modelType: "commit",
            sourceId: "3ae1937dc990088674563976a581abcadf53171c",
        },
        {
            link:
                "https://github.com/kgodara-testing/brodal_queue/commit/c245dc7c137c2c9f8dca55999fd94e1bd3165464",
            modelType: "commit",
            sourceId: "c245dc7c137c2c9f8dca55999fd94e1bd3165464",
        },
        {
            link:
                "https://github.com/kgodara-testing/brodal_queue/tree/parse_branch",
            modelType: "branch",
            sourceId: "parse_branch",
        },
        {
            link:
                "https://github.com/kgodara-testing/brodal_queue/tree/parse_branch_2",
            modelType: "branch",
            sourceId: "parse_branch_2",
        },
    ],

    Test7: [
        {
            link:
                "https://github.com/kgodara-testing/brodal_queue/commit/b2fd3c8d3ed1afc4b06c73faea8db59d64ff953d",
            modelType: "commit",
            sourceId: "b2fd3c8d3ed1afc4b06c73faea8db59d64ff953d",
        },
        {
            link: "https://github.com/Quilt-Doc/doc-app/pull/17",
            modelType: "pullRequest",
            sourceId: "17",
        },
    ],
    Test8: [],
    Test10: [
        {
            link:
                "https://github.com/kgodara-testing/brodal_queue/commit/b2fd3c8d3ed1afc4b06c73faea8db59d64ff953d",
            modelType: "commit",
            sourceId: "b2fd3c8d3ed1afc4b06c73faea8db59d64ff953d",
        },
    ],
    Test11: [],
};

const cardRelevantActions = {
    Test1: { num: 1, orderedLists: ["To Do"] },
    Test2: { num: 2, orderedLists: ["Done", "In Progress"] },
    Test3: { num: 2, orderedLists: ["Done", "In Progress"] },
    Test4: { num: 2, orderedLists: ["Done", "In Progress"] },
    Test5: { num: 1, orderedLists: ["Backlog"] },
    Test6: { num: 1, orderedLists: ["Done"] },
    Test7: { num: 1, orderedLists: ["In Progress"] },
    Test8: { num: 0, orderedLists: [] },
    Test10: { num: 0, orderedLists: [] },
    Test11: { num: 2, orderedLists: ["Backlog", "Done"] },
};

const expectedLabels = [
    {
        name: "Label1",
        color: "green",
    },
    {
        name: "Label2",
        color: "yellow",
    },
    {
        name: "Label3",
        color: "orange",
    },
    {
        name: "Label4",
        color: "red",
    },
    {
        name: "Label5",
        color: "purple",
    },
    {
        name: "Label6",
        color: "blue",
    },
];

const expectedCardCounts = {
    Test1: {
        intervals: 1,
        labels: 2,
        members: 1,
        attachments: 1,
    },
    Test2: {
        intervals: 2,
        members: 2,
        labels: 1,
        attachments: 2,
    },
    Test3: {
        intervals: 2,
        labels: 0,
        members: 0,
        attachments: 0,
    },
    Test4: {
        intervals: 2,
        labels: 2,
        members: 1,
        attachments: 1,
    },
    Test5: {
        intervals: 1,
        labels: 0,
        members: 0,
        attachments: 0,
    },
    Test6: {
        intervals: 1,
        labels: 0,
        members: 0,
        attachments: 5,
    },
    Test7: {
        intervals: 1,
        labels: 0,
        members: 0,
        attachments: 2,
    },
    Test8: {
        intervals: 0,
        labels: 0,
        members: 0,
        attachments: 0,
    },

    Test10: {
        intervals: 0,
        labels: 0,
        members: 0,
        attachments: 1,
    },
    Test11: {
        intervals: 2,
        labels: 1,
        members: 0,
        attachments: 0,
    },
};

module.exports = {
    cardRelevantActions,
    cardDirectAttachments,
    expectedLabels,
    expectedCardCounts,
    //cardDirectAttachmentsHasRepo,
};
