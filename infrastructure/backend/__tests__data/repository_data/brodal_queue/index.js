// Crude verification command: 'git log --all --first-parent --remotes --reflog --author-date-order -- $fileName'

const insertHunkFilePathLookup = {
    // Binary files, verification command returns comits , but git show doesn't show changes
    "__pycache__/heap_lib.cpython-35.pyc": { count: 0 },
    "__pycache__/heap_lib.cpython-37.pyc": { count: 0 },
    ".BinomialQueue.py.swp": { count: 0 },


    "BinomialQueue.py": { count: 35 },
    "SkewBinomialQueue.py": { count: 65 },
    "heap_lib.py": { count: 2 },

    // Binary file
    "heap_lib.pyc": { count: 0 },
};

const prInsertHunkLookup = {
    1: { count: 1 },
    2: { count: 1 },
    3: { count: 1 },
    4: { count: 2 },
    5: { count: 1 },
}

const prNum = 5;

const prData = [
    {
        fileList: [".BinomialQueue.py.swp", "BinomialQueue.py"],
        repository: "604133292355880fd17ff5b6",
        name: "parse_branch_3 into master",
        sourceId: "3",
        sourceCloseDate: null,
        pullRequestId: 547967198,
        number: 3,
        htmlUrl: "https://github.com/kgodara-testing/brodal_queue/pull/3",
        issueUrl: "https://api.github.com/repos/kgodara-testing/brodal_queue/issues/3",
        state: "open",
        locked: false,
        title: "parse_branch_3 into master",
        body: "",
        closedAt: null,
        mergedAt: null,
        mergeCommitSha: "eb4c5b4649eb6f6c2ae8d13f8d237e0b0b7e8533",
        headRef: "parse_branch_3",
        headLabel: "kgodara-testing:parse_branch_3",
        headSha: "0fa21fe27a89854eb493542a0719839c1003eddf",
        baseRef: "master",
        baseLabel: "kgodara-testing:master",
        baseSha: "b2fd3c8d3ed1afc4b06c73faea8db59d64ff953d",
        draft: false,
    },
    {
        fileList: ["BinomialQueue.py"],
        repository: "604133292355880fd17ff5b6",
        name: "webhook_branch_2 into webhook_branch_1",
        sourceId: "5",
        sourceCloseDate: "2021-01-04T01:16:34.000+00:00",
        pullRequestId: 547967358,
        number: 5,
        htmlUrl: "https://github.com/kgodara-testing/brodal_queue/pull/5",
        issueUrl: "https://api.github.com/repos/kgodara-testing/brodal_queue/issues/5",
        state: "closed",
        locked: false,
        title: "webhook_branch_2 into webhook_branch_1",
        body: "",
        closedAt: "2021-01-04T01:16:34.000+00:00",
        mergedAt: "2021-01-04T01:16:34.000+00:00",
        mergeCommitSha: "b9fb397d186047b9e5c0a4b5eeb1baf7d76196c2",
        headRef: "webhook_branch_2",
        headLabel: "kgodara-testing:webhook_branch_2",
        headSha: "8af9e4483fc067a81ffeab89111b166d66799e21",
        baseRef: "webhook_branch_1",
        baseLabel: "kgodara-testing:webhook_branch_1",
        baseSha: "089d9cc803fee1c9c9faed7b03645293de22a2e7",
        draft: false,
    },
    {
        fileList: [".BinomialQueue.py.swp", "BinomialQueue.py"],
        repository: "604133292355880fd17ff5b6",
        name: "webhook_branch_1 into master",
        sourceId: "4",
        sourceCloseDate: null,
        pullRequestId: 547967285,
        number: 4,
        htmlUrl: "https://github.com/kgodara-testing/brodal_queue/pull/4",
        issueUrl: "https://api.github.com/repos/kgodara-testing/brodal_queue/issues/4",
        state: "open",
        locked: false,
        title: "webhook_branch_1 into master",
        body: "",
        closedAt: null,
        mergedAt: null,
        mergeCommitSha: "9d90aad5e97261e3fe0da34167f712f216ce6e0e",
        headRef: "webhook_branch_1",
        headLabel: "kgodara-testing:webhook_branch_1",
        headSha: "b9fb397d186047b9e5c0a4b5eeb1baf7d76196c2",
        baseRef: "master",
        baseLabel: "kgodara-testing:master",
        baseSha: "b2fd3c8d3ed1afc4b06c73faea8db59d64ff953d",
        draft: false,
    },
    {
        fileList: [".BinomialQueue.py.swp", "BinomialQueue.py"],
        repository: "604133292355880fd17ff5b6",
        name: "parse_branch into master",
        sourceId: "1",
        sourceCloseDate: null,
        pullRequestId: 547967034,
        number: 1,
        htmlUrl: "https://github.com/kgodara-testing/brodal_queue/pull/1",
        issueUrl: "https://api.github.com/repos/kgodara-testing/brodal_queue/issues/1",
        state: "open",
        locked: false,
        title: "parse_branch into master",
        body: "",
        closedAt: null,
        mergedAt: null,
        mergeCommitSha: "35fb284c04e68665ea2c698be073abaf4aac56d7",
        headRef: "parse_branch",
        headLabel: "kgodara-testing:parse_branch",
        headSha: "0fa21fe27a89854eb493542a0719839c1003eddf",
        baseRef: "master",
        baseLabel: "kgodara-testing:master",
        baseSha: "b2fd3c8d3ed1afc4b06c73faea8db59d64ff953d",
        draft: false,
    },
    {
        fileList: [".BinomialQueue.py.swp", "BinomialQueue.py"],
        repository: "604133292355880fd17ff5b6",
        name: "parse_branch_2 into master",
        sourceId: "2",
        sourceCloseDate: null,
        pullRequestId: 547967105,
        number: 2,
        htmlUrl: "https://github.com/kgodara-testing/brodal_queue/pull/2",
        issueUrl: "https://api.github.com/repos/kgodara-testing/brodal_queue/issues/2",
        state: "open",
        locked: false,
        title: "parse_branch_2 into master",
        body: "",
        closedAt: null,
        mergedAt: null,
        mergeCommitSha: "f0d6fc35fe151ec1c75286c98759de56cec38194",
        headRef: "parse_branch_2",
        headLabel: "kgodara-testing:parse_branch_2",
        headSha: "0fa21fe27a89854eb493542a0719839c1003eddf",
        baseRef: "master",
        baseLabel: "kgodara-testing:master",
        baseSha: "b2fd3c8d3ed1afc4b06c73faea8db59d64ff953d",
        draft: false,
    },
];

const branchNum = 6;

const branchData = [
    {
        repository: "604133292355880fd17ff5b6",
        name: "master",
        sourceId: "master",
        ref: "master",
        lastCommit :"b2fd3c8d3ed1afc4b06c73faea8db59d64ff953d",
    },
    {
        repository: "604133292355880fd17ff5b6",
        name: "parse_branch",
        sourceId: "parse_branch",
        ref: "parse_branch",
        lastCommit: "0fa21fe27a89854eb493542a0719839c1003eddf",
    },
    {
        repository: "604133292355880fd17ff5b6",
        name: "parse_branch_2",
        sourceId: "parse_branch_2",
        ref: "parse_branch_2",
        lastCommit: "0fa21fe27a89854eb493542a0719839c1003eddf",
    },
    {
        repository: "604133292355880fd17ff5b6",
        name: "parse_branch_3",
        sourceId: "parse_branch_3",
        ref: "parse_branch_3",
        lastCommit: "0fa21fe27a89854eb493542a0719839c1003eddf",
    },
    {
        repository: "604133292355880fd17ff5b6",
        name: "webhook_branch_1",
        sourceId: "webhook_branch_1",
        ref: "webhook_branch_1",
        lastCommit: "b9fb397d186047b9e5c0a4b5eeb1baf7d76196c2",

    },
    {
        repository: "604133292355880fd17ff5b6",
        name: "webhook_branch_2",
        sourceId: "webhook_branch_2",
        ref: "webhook_branch_2",
        lastCommit: "8af9e4483fc067a81ffeab89111b166d66799e21",
    },
];

// Number on Github:
// const commitNum = 27;

// Number Given on example Scrape
const commitNum = 30;

const commitData = [
    {
        fileList: [],
        sha: "b9fb397d186047b9e5c0a4b5eeb1baf7d76196c2",
        committerDate: "2021-01-03 20:16:33 -0500",
        treeHash: "23ef0e0d76d8292f1e5de6966cb8f717e9741201",
        authorName: "kgodara-testing",
        committerName: "GitHub",
        committerEmail: "noreply@github.com",
        commitMessage: "Merge pull request #5 from kgodara-testing/webhook_branch_2",
        repository: "604133292355880fd17ff5b6",
        name: "Merge pull request #5 from kgodara-testing/webhook_branch_2",
        sourceId: "b9fb397d186047b9e5c0a4b5eeb1baf7d76196c2",
        sourceCreationDate: "2021-01-04T01:16:33.000+00:00",

    },
    {
        fileList: ["BinomialQueue.py"],
        sha: "8af9e4483fc067a81ffeab89111b166d66799e21",
        committerDate: "2020-12-15 10:05:50 -0500",
        treeHash: "23ef0e0d76d8292f1e5de6966cb8f717e9741201",
        authorName: "Karan Godara",
        committerName: "Karan Godara",
        committerEmail: "kxg3442@rit.edu",
        commitMessage: "test webhook 2",
        repository: "604133292355880fd17ff5b6",
        name: "test webhook 2",
        sourceId: "8af9e4483fc067a81ffeab89111b166d66799e21",
        sourceCreationDate: "2020-12-15T15:05:50.000+00:00",
    },
    {
        fileList: ["BinomialQueue.py"],
        sha: "089d9cc803fee1c9c9faed7b03645293de22a2e7",
        committerDate: "2020-12-15 09:55:13 -0500",
        treeHash: "fa8802ae835b4fc7479e0638b0a426082ea170b0",
        authorName: "Karan Godara",
        committerName: "Karan Godara",
        committerEmail: "kxg3442@rit.edu",
        commitMessage: "test webhook 1",
        repository: "604133292355880fd17ff5b6",
        name: "test webhook 1",
        sourceId: "089d9cc803fee1c9c9faed7b03645293de22a2e7",
        sourceCreationDate: "2020-12-15T14:55:13.000+00:00",
    },
    {
        fileList: [".BinomialQueue.py.swp", "BinomialQueue.py"],
        sha: "0fa21fe27a89854eb493542a0719839c1003eddf",
        committerDate: "2020-12-11 19:26:37 -0500",
        treeHash: "bf3aabed1606ea93b3c624b886d04148ff6ea34c",
        authorName: "Karan Godara",
        committerName: "Karan Godara",
        committerEmail: "kxg3442@rit.edu",
        commitMessage: "new branch",
        repository: "604133292355880fd17ff5b6",
        name: "new branch",
        sourceId: "0fa21fe27a89854eb493542a0719839c1003eddf",
        sourceCreationDate: "2020-12-12T00:26:37.000+00:00",
    },
    {
        fileList: [".BinomialQueue.py.swp", "BinomialQueue.py"],
        sha: "b2fd3c8d3ed1afc4b06c73faea8db59d64ff953d",
        committerDate: "2020-10-04 00:47:37 -0400",
        treeHash: "9edad45bbff29c23803992f11adc78dd52e07f00",
        authorName: "Karan Godara",
        committerName: "Karan Godara",
        committerEmail: "kxg3442@rit.edu",
        commitMessage: "RAW 3",
        repository: "604133292355880fd17ff5b6",
        name: "RAW 3",
        sourceId: "b2fd3c8d3ed1afc4b06c73faea8db59d64ff953d",
        sourceCreationDate: "2020-10-04T04:47:37.000+00:00",
    },
    {
        fileList: [".BinomialQueue.py.swp", "BinomialQueue.py"],
        sha: "6eafcc998e6de134b5bdc9757e3df20d9113a4ee",
        committerDate: "2020-10-03 23:49:11 -0400",
        treeHash: "fe6e5c11d234c245f886daf00cb52d0600a969e7",
        authorName: "Karan Godara",
        committerName: "Karan Godara",
        committerEmail: "kxg3442@rit.edu",
        commitMessage: "RAW 2",
        repository: "604133292355880fd17ff5b6",
        name: "RAW 2",
        sourceId: "6eafcc998e6de134b5bdc9757e3df20d9113a4ee",
        sourceCreationDate: "2020-10-04T03:49:11.000+00:00",
    },
    {
        fileList: [".BinomialQueue.py.swp", "BinomialQueue.py"],
        sha: "64a4fadb13fa23a89943298d66968a86cf3b7aa8",
        committerDate: "2020-10-03 23:40:55 -0400",
        treeHash: "3336581a379b109dbc679dd717dda287e335cc58",
        authorName: "Karan Godara",
        committerName: "Karan Godara",
        committerEmail: "kxg3442@rit.edu",
        commitMessage: "RAW 1",
        repository: "604133292355880fd17ff5b6",
        name: "RAW 1",
        sourceId: "64a4fadb13fa23a89943298d66968a86cf3b7aa8",
        sourceCreationDate: "2020-10-04T03:40:55.000+00:00",
    },
    {
        fileList: [".BinomialQueue.py.swp", "BinomialQueue.py"],
        sha: "3ae1937dc990088674563976a581abcadf53171c",
        committerDate: "2020-10-03 23:32:22 -0400",
        treeHash: "b6241333b92ac70b8f7211d4b64648ec92e2b5cb",
        authorName: "Karan Godara",
        committerName: "Karan Godara",
        committerEmail: "kxg3442@rit.edu",
        commitMessage: "Test Modify BinomialQueue.py 18",
        repository: "604133292355880fd17ff5b6",
        name: "Test Modify BinomialQueue.py 18",
        sourceId: "3ae1937dc990088674563976a581abcadf53171c",
        sourceCreationDate: "2020-10-04T03:32:22.000+00:00",
    },
    {
        fileList: [".BinomialQueue.py.swp", "BinomialQueue.py"],
        sha: "927ae95ce8a7c7625755ea13b7702be84bc4a321",
        committerDate: "2020-10-03 23:17:37 -0400",
        treeHash: "bc56052be9a3a575e532e8797192ed7529f028dd",
        authorName: "Karan Godara",
        committerName: "Karan Godara",
        committerEmail: "kxg3442@rit.edu",
        commitMessage: "Test Modify BinomialQueue.py 17",
        repository: "604133292355880fd17ff5b6",
        name: "Test Modify BinomialQueue.py 17",
        sourceId: "927ae95ce8a7c7625755ea13b7702be84bc4a321",
        sourceCreationDate: "2020-10-04T03:17:37.000+00:00",
    },
];




module.exports = {
    insertHunkFilePathLookup,
    prInsertHunkLookup,
    
    prNum,
    prData,

    branchNum,
    branchData,

    commitNum,
    commitData,
    
}