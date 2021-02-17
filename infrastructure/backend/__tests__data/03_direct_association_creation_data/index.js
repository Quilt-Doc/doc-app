const expectedCardQueries = {
    Test1: {
        pullRequest: 1,
        commit: 0,
        issue: 0,
        branch: 0,
    },
    Test2: {
        pullRequest: 1,
        commit: 1,
        issue: 0,
        branch: 0,
    },
    Test3: { pullRequest: 0, commit: 0, issue: 0, branch: 0 },
    Test4: {
        pullRequest: 1,
        commit: 0,
        issue: 0,
        branch: 1,
    },
    Test5: { pullRequest: 0, commit: 0, issue: 0, branch: 0 },
    Test6: {
        pullRequest: 3,
        commit: 2,
        issue: 0,
        branch: 2,
    },
    Test7: {
        pullRequest: 0,
        commit: 1,
        issue: 0,
        branch: 0,
    },
    Test8: { pullRequest: 0, commit: 0, issue: 0, branch: 0 },
    Test10: { pullRequest: 0, commit: 1, issue: 0, branch: 0 },
    Test11: { pullRequest: 0, commit: 0, issue: 0, branch: 0 },
};

const expectedTicketToCO = {
    pullRequest: {
        Test1: [
            {
                sourceId: "4",
                repositoryFullName: "kgodara-testing/brodal_queue",
            },
        ],
        Test2: [
            {
                sourceId: "1",
                repositoryFullName: "kgodara-testing/brodal_queue",
            },
        ],
        Test4: [
            {
                sourceId: "1",
                headRef: "parse_branch",
                repositoryFullName: "kgodara-testing/brodal_queue",
            },
        ],
        Test6: [
            {
                sourceId: "5",
                repositoryFullName: "kgodara-testing/brodal_queue",
            },
            {
                sourceId: "2",
                repositoryFullName: "kgodara-testing/brodal_queue",
                headRef: "parse_branch_2",
            },
            {
                sourceId: "1",
                repositoryFullName: "kgodara-testing/brodal_queue",
                headRef: "parse_branch",
            },
        ],
    },
    commit: {
        Test2: [
            {
                sourceId: "3ae1937dc990088674563976a581abcadf53171c",
                repositoryFullName: "kgodara-testing/brodal_queue",
            },
        ],
        Test6: [
            {
                sourceId: "3ae1937dc990088674563976a581abcadf53171c",
                repositoryFullName: "kgodara-testing/brodal_queue",
            },
            {
                sourceId: "c245dc7c137c2c9f8dca55999fd94e1bd3165464",
                repositoryFullName: "kgodara-testing/brodal_queue",
            },
        ],
        Test7: [
            {
                sourceId: "b2fd3c8d3ed1afc4b06c73faea8db59d64ff953d",
                repositoryFullName: "kgodara-testing/brodal_queue",
            },
        ],
        Test10: [
            {
                sourceId: "b2fd3c8d3ed1afc4b06c73faea8db59d64ff953d",
                repositoryFullName: "kgodara-testing/brodal_queue",
            },
        ],
    },
    branch: {
        Test4: [
            {
                sourceId: "parse_branch",
                repositoryFullName: "kgodara-testing/brodal_queue",
            },
        ],
        Test6: [
            {
                sourceId: "parse_branch",
                repositoryFullName: "kgodara-testing/brodal_queue",
            },
            {
                sourceId: "parse_branch_2",
                repositoryFullName: "kgodara-testing/brodal_queue",
            },
        ],
    },
};

module.exports = {
    expectedCardQueries,
    expectedTicketToCO,
};
