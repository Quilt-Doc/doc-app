// Crude verification command: 'git log --all --first-parent --remotes --reflog --author-date-order -- $fileName'


const prInsertHunkLookup = {
    3: { count: 1 },
    4: { count: 1 },
}

const prNum = 2;

const prData = [
    {
        fileList: ["file2.rs"],
        repository: "604133292355880fd17ff5b2",
        name: "[QIJ-1] Update file2.rs for branch-2",
        sourceId: "4",
        sourceCloseDate: null,
        pullRequestId: 581674826,
        number: 4,
        htmlUrl: "https://github.com/kgodara-testing/issue-scrape/pull/4",
        issueUrl: "https://api.github.com/repos/kgodara-testing/issue-scrape/issues/4",
        state: "open",
        locked: false,
        title: "[QIJ-1] Update file2.rs for branch-2",
        body: "",
        closedAt: null,
        mergedAt: null,
        mergeCommitSha: "0ca43c9231ec66321f9921e2b7bdaa2cc218ef3d",
        headRef: "branch-2",
        headLabel: "kgodara-testing:branch-2",
        headSha: "3d9e2c17ded6a9858a33040451ec268cf07ea57d",
        baseRef: "main",
        baseLabel: "kgodara-testing:main",
        baseSha: "19117a9a6c6148f1a4ef313ebda367896b62ba86",
        draft: false,
    },
    {
        fileList: ["file3.rs"],
        repository: "604133292355880fd17ff5b2",
        name: "Update file3.rs for new branch",
        sourceId: "3",
        sourceCloseDate: "2021-03-01T03:02:25.000+00:00",
        pullRequestId: 581674011,
        number: 3,
        htmlUrl: "https://github.com/kgodara-testing/issue-scrape/pull/3",
        issueUrl: "https://api.github.com/repos/kgodara-testing/issue-scrape/issues/3",
        state: "closed",
        locked: false,
        title: "Update file3.rs for new branch",
        body: "",
        closedAt: "2021-03-01T03:02:25.000+00:00",
        mergedAt: "2021-03-01T03:02:25.000+00:00",
        mergeCommitSha: "19117a9a6c6148f1a4ef313ebda367896b62ba86",
        headRef: "branch-1",
        headLabel: "kgodara-testing:branch-1",
        headSha: "62f0a69fc781dc8b6c81afb325d6339a3e144e76",
        baseRef: "main",
        baseLabel: "kgodara-testing:main",
        baseSha: "e8e23f44ddf2746c964dbfb75257ee6cd8d7c950",
        draft: false,
    }
];

const branchNum = 3;

const branchData = [
    {
        repository: "604133292355880fd17ff5b2",
        name: "branch-1",
        sourceId: "branch-1",
        ref: "branch-1",
        lastCommit: "62f0a69fc781dc8b6c81afb325d6339a3e144e76",
    },
    {
        repository: "604133292355880fd17ff5b2",
        name: "branch-2",
        sourceId: "branch-2",
        ref: "branch-2",
        lastCommit: "3d9e2c17ded6a9858a33040451ec268cf07ea57d",
    },
    {
        repository: "604133292355880fd17ff5b2",
        name: "main",
        sourceId: "main",
        ref: "main",
        lastCommit: "ef38c3ffa0b830168f02f34d555a9377c5969208",
    },
]

const commitNum = 11;

const commitData = [
    {
        fileList: ["file.rs"],
        sha: "ef38c3ffa0b830168f02f34d555a9377c5969208",
        committerDate: "2021-03-23 09:20:25 -0400",
        treeHash: "69a72a47ddf098be99d71a24279fbefa35531873",
        authorName: "Karan Godara",
        committerName: "Karan Godara",
        committerEmail: "karan@getquilt.app",
        commitMessage: "QIJ-2 Jira Commit.",
        repository: "604133292355880fd17ff5b2",
        name: "QIJ-2 Jira Commit.",
        sourceId: "ef38c3ffa0b830168f02f34d555a9377c5969208",
        sourceCreationDate: "2021-03-23T13:20:25.000+00:00",
    },
    {
        fileList: ["file.rs"],
        sha: "36f9cf57d6304bf486cb390d655281111a422563",
        committerDate: "2021-03-22 19:12:07 -0400",
        treeHash: "6d7ba393f6e6d20ab9279aa9c274b31d4633a2f8",
        authorName: "Karan Godara",
        committerName: "Karan Godara",
        committerEmail: "karan@getquilt.app",
        commitMessage: "[ QIJ-1 ] Committing for Jira.",
        repository: "604133292355880fd17ff5b2",
        name: "[ QIJ-1 ] Committing for Jira.",
        sourceId: "36f9cf57d6304bf486cb390d655281111a422563",
        sourceCreationDate: "2021-03-22T23:12:07.000+00:00",
    },
    {
        fileList: ["file.rs"],
        sha: "5c50b758ed393466dca02bc8f865ae21e9b71447",
        committerDate: "2021-03-01 13:57:58 -0500",
        treeHash: "f3e585115a05f5714a6f8998050c399af2077911",
        authorName: "Karan Godara",
        committerName: "Karan Godara",
        committerEmail: "karan@getquilt.app",
        commitMessage: "Reference Issue #2 from CLI",
        repository: "604133292355880fd17ff5b2",
        name: "Reference Issue #2 from CLI",
        sourceId: "5c50b758ed393466dca02bc8f865ae21e9b71447",
        sourceCreationDate: "2021-03-01T18:57:58.000+00:00",
    },
    {
        fileList: ["file.rs"],
        sha: "ecda202f96b01a0d4568a8c157240d18964d9734",
        committerDate: "2021-03-01 13:57:02 -0500",
        treeHash: "64e3aeb0afa87065e295439222d825fac8e80777",
        authorName: "Karan Godara",
        committerName: "Karan Godara",
        committerEmail: "karan@getquilt.app",
        commitMessage: "Reference Issue through Push from Local",
        repository: "604133292355880fd17ff5b2",
        name: "Reference Issue through Push from Local",
        sourceId: "ecda202f96b01a0d4568a8c157240d18964d9734",
        sourceCreationDate: "2021-03-01T18:57:02.000+00:00",
    },
    {
        fileList: ["file2.rs"],
        sha: "3d9e2c17ded6a9858a33040451ec268cf07ea57d",
        committerDate: "2021-02-28 22:03:19 -0500",
        treeHash: "b43ee98ac83d4bd0a2744a4f94ce4e54b5c5fd25",
        authorName: "Karan Godara",
        committerName: "Karan Godara",
        committerEmail: "karan@getquilt.app",
        commitMessage: "Update fil2.rs for branch-2",
        repository: "604133292355880fd17ff5b2",
        name: "Update fil2.rs for branch-2",
        sourceId: "3d9e2c17ded6a9858a33040451ec268cf07ea57d",
        sourceCreationDate: "2021-03-01T03:03:19.000+00:00",
    },
    {
        fileList: [],
        sha: "19117a9a6c6148f1a4ef313ebda367896b62ba86",
        committerDate: "2021-02-28 22:02:25 -0500",
        treeHash: "d2ff285edfa65d41a8117774fb5d1b951aaf51fb",
        authorName: "kgodara-testing",
        committerName: "GitHub",
        committerEmail: "noreply@github.com",
        commitMessage: "Merge pull request #3 from kgodara-testing/branch-1",
        repository: "604133292355880fd17ff5b2",
        name: "Merge pull request #3 from kgodara-testing/branch-1",
        sourceId: "19117a9a6c6148f1a4ef313ebda367896b62ba86",
        sourceCreationDate: "2021-03-01T03:02:25.000+00:00",
    },
    {
        fileList: ["file3.rs"],
        sha: "62f0a69fc781dc8b6c81afb325d6339a3e144e76",
        committerDate: "2021-02-28 22:01:22 -0500",
        treeHash: "d2ff285edfa65d41a8117774fb5d1b951aaf51fb",
        authorName: "Karan Godara",
        committerName: "Karan Godara",
        committerEmail: "karan@getquilt.app",
        commitMessage: "Update file3.rs for new branch",
        repository: "604133292355880fd17ff5b2",
        name: "Update file3.rs for new branch",
        sourceId: "62f0a69fc781dc8b6c81afb325d6339a3e144e76",
        sourceCreationDate: "2021-03-01T03:01:22.000+00:00",
    },
    {
        fileList: ["file2.rs"],
        sha: "e8e23f44ddf2746c964dbfb75257ee6cd8d7c950",
        committerDate: "2021-02-28 21:58:19 -0500",
        treeHash: "eaddba9e470e76c60b8236f862cdb28599352289",
        authorName: "kgodara-testing",
        committerName: "GitHub",
        committerEmail: "noreply@github.com",
        commitMessage: "Again referencing this Issue: #2",
        repository: "604133292355880fd17ff5b2",
        name: "Again referencing this Issue: #2",
        sourceId: "e8e23f44ddf2746c964dbfb75257ee6cd8d7c950",
        sourceCreationDate: "2021-03-01T02:58:19.000+00:00",
    },
    {
        fileList: ["file.rs"],
        sha: "6989da1c3c71f0c8d8db0dd57f5508419df9aaec",
        committerDate: "2021-02-28 21:57:20 -0500",
        treeHash: "1045a5a7431a26d6b40a0cb0012aebac81ba9bd7",
        authorName: "kgodara-testing",
        committerName: "GitHub",
        committerEmail: "noreply@github.com",
        commitMessage: "Referencing this Issue: #2",
        repository: "604133292355880fd17ff5b2",
        name: "Referencing this Issue: #2",
        sourceId: "6989da1c3c71f0c8d8db0dd57f5508419df9aaec",
        sourceCreationDate: "2021-03-01T02:57:20.000+00:00",
    },
    {
        fileList: ["file3.rs"],
        sha: "370808d500360208f854dec4b1991515d2de0aca",
        committerDate: "2021-02-28 21:56:50 -0500",
        treeHash: "a3d452ddc87f4515760f23b8b96ab8c084e703a6",
        authorName: "kgodara-testing",
        committerName: "GitHub",
        committerEmail: "noreply@github.com",
        commitMessage: "Init file 3",
        repository: "604133292355880fd17ff5b2",
        name: "Init file 3",
        sourceId: "370808d500360208f854dec4b1991515d2de0aca",
        sourceCreationDate: "2021-03-01T02:56:50.000+00:00",
    },
]


module.exports = {
    prInsertHunkLookup,

    prNum,
    prData,

    branchNum,
    branchData,

    commitNum,
    commitData,
}