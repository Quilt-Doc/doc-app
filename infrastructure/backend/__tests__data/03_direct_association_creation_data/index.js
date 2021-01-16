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

module.exports = {
    expectedCardQueries,
};
