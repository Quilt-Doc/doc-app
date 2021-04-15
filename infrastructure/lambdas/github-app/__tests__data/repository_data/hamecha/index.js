// Crude verification command: 'git log --all --first-parent --remotes --reflog --author-date-order -- $fileName'


const insertHunkFilePathLookup = {
    // This file was created without any content, so no InsertHunks
    "new_dir_43/new_file.py": { count: 0 },

    ".gitignore": { count: 4 },
    "added_file_44.py": { count: 1 },
    "arby_log_handler.py": { count: 2 },
    "arby_redis.py": { count: 109 },
    "new_dir.sh": { count: 4 },
    "test_worker_update.js": { count: 0 },
    "test_worker_update_10.js": { count: 0 },
    "test_worker_update_11.js": { count: 0 },
    "test_worker_update_2.js": { count: 0 },
    "test_worker_update_3.js": { count: 0 },
    "test_worker_update_4.js": { count: 0 },
    "test_worker_update_5.js": { count: 0 },
    "test_worker_update_6.js": { count: 0 },
    "test_worker_update_7.js": { count: 0 },
    "test_worker_update_8.js": { count: 0 },
    "test_worker_update_9.js": { count: 0 },  
};

const prInsertHunkLookup = {
    1: { count: 0 },
    2: { count: 0 },
    3: { count: 0 },
    4: { count: 0 },
    5: { count: 0 },
}

const prNum = 0;

const prData = [];

const branchNum = 1;

const branchData = [
    {
        repository: "604133292355880fd17ff5b4",
        name: "master",
        sourceId: "master",
        ref: "master",
        lastCommit: "4db5bec90b39261c92a36139fb38d881d7efb31e",
    }
];

// Number on Github:
// const commitNum = 109;

// Number Given on example Scrape
const commitNum = 108;

const commitData = [
    {
        fileList: ["test_worker_update_11.js"],
        sha: "4db5bec90b39261c92a36139fb38d881d7efb31e",
        committerDate: "2020-10-16 12:03:26 -0400",
        treeHash: "8139249ead20142055d4a2bfb97e55a154776977",
        authorName: "kgodara-testing",
        committerName: "GitHub",
        committerEmail: "noreply@github.com",
        commitMessage: "Create test_worker_update_11.js",
        repository: "604133292355880fd17ff5b4",
        name: "Create test_worker_update_11.js",
        sourceId: "4db5bec90b39261c92a36139fb38d881d7efb31e",
        sourceCreationDate: "2020-10-16T16:03:26.000+00:00",
    },
    {
        fileList: ["test_worker_update_10.js"],
        sha: "ad732f5e4e0fb23eb8440aadca6c5e180e5be503",
        committerDate: "2020-10-16 12:00:26 -0400",
        treeHash: "4c43e2162fbb4ea076a832d4a3acb408429896dd",
        authorName: "kgodara-testing",
        committerName: "GitHub",
        committerEmail: "noreply@github.com",
        commitMessage: "Create test_worker_update_10.js",
        repository: "604133292355880fd17ff5b4",
        name: "Create test_worker_update_10.js",
        sourceId: "ad732f5e4e0fb23eb8440aadca6c5e180e5be503",
        sourceCreationDate: "2020-10-16T16:00:26.000+00:00",
    },
    {
        fileList: ["test_worker_update_9.js"],
        sha: "f05d8abf85ece9b418d31bb3c3da8df3a2cddfa7",
        committerDate: "2020-10-16 11:55:37 -0400",
        treeHash: "44327dda53841892c8aee22a1af6bb3ed31fc4c3",
        authorName: "kgodara-testing",
        committerName: "GitHub",
        committerEmail: "noreply@github.com",
        commitMessage: "Create test_worker_update_9.js",
        repository: "604133292355880fd17ff5b4",
        name: "Create test_worker_update_9.js",
        sourceId: "f05d8abf85ece9b418d31bb3c3da8df3a2cddfa7",
        sourceCreationDate: "2020-10-16T15:55:37.000+00:00",
    },
    {
        fileList: ["test_worker_update_8.js"],
        sha: "417253b5aff8f199d49edd9348318cf3512daf5a",
        committerDate: "2020-10-16 11:52:11 -0400",
        treeHash: "d80eaa1ced94ea344c2c833de9cd909e19e04d5a",
        authorName: "kgodara-testing",
        committerName: "GitHub",
        committerEmail: "noreply@github.com",
        commitMessage: "Create test_worker_update_8.js",
        repository: "604133292355880fd17ff5b4",
        name: "Create test_worker_update_8.js",
        sourceId: "417253b5aff8f199d49edd9348318cf3512daf5a",
        sourceCreationDate: "2020-10-16T15:52:11.000+00:00",
    },
    {
        fileList: ["test_worker_update_7.js"],
        sha: "6f52e01132ab6ab95cc5e3e385ac3f7b64d1a015",
        committerDate: "2020-10-16 11:48:55 -0400",
        treeHash: "fe6b39be79362c3ec51e5262ed0a0e98f5b1bd00",
        authorName: "kgodara-testing",
        committerName: "GitHub",
        committerEmail: "noreply@github.com",
        commitMessage: "Create test_worker_update_7.js",
        repository: "604133292355880fd17ff5b4",
        name: "Create test_worker_update_7.js",
        sourceId: "6f52e01132ab6ab95cc5e3e385ac3f7b64d1a015",
        sourceCreationDate: "2020-10-16T15:48:55.000+00:00",
    },
    {
        fileList: ["test_worker_update_6.js"],
        sha: "4d2a9c77ff9895f4563bb8f09710f62d28551adb",
        committerDate: "2020-10-16 11:34:05 -0400",
        treeHash: "2eb4bddef022259fba2b1c8f974a21f74eef201d",
        authorName: "kgodara-testing",
        committerName: "GitHub",
        committerEmail: "noreply@github.com",
        commitMessage: "Create test_worker_update_6.js",
        repository: "604133292355880fd17ff5b4",
        name: "Create test_worker_update_6.js",
        sourceId: "4d2a9c77ff9895f4563bb8f09710f62d28551adb",
        sourceCreationDate: "2020-10-16T15:34:05.000+00:00",
    },
    {
        fileList: ["test_worker_update_5.js"],
        sha: "f9226e3bb2b602c8087bcc0b5f33e6cae6fde389",
        committerDate: "2020-10-16 11:14:33 -0400",
        treeHash: "746e201835d6e9c5c08e566c83173ee8a07f0428",
        authorName: "kgodara-testing",
        committerName: "GitHub",
        committerEmail: "noreply@github.com",
        commitMessage: "Create test_worker_update_5.js",
        repository: "604133292355880fd17ff5b4",
        name: "Create test_worker_update_5.js",
        sourceId: "f9226e3bb2b602c8087bcc0b5f33e6cae6fde389",
        sourceCreationDate: "2020-10-16T15:14:33.000+00:00",
    },
    {
        fileList: ["test_worker_update_4.js"],
        sha: "a5bfb9119aeb69c2a8dca97d0b7f7fb9634b83a8",
        committerDate: "2020-10-16 11:10:58 -0400",
        treeHash: "34e22465c401f4d8442cf4dc3b43ec656fe84bb7",
        authorName: "kgodara-testing",
        committerName: "GitHub",
        committerEmail: "noreply@github.com",
        commitMessage: "Create test_worker_update_4.js",
        repository: "604133292355880fd17ff5b4",
        name: "Create test_worker_update_4.js",
        sourceId: "a5bfb9119aeb69c2a8dca97d0b7f7fb9634b83a8",
        sourceCreationDate: "2020-10-16T15:10:58.000+00:00",
    },
    {
        fileList: ["test_worker_update_3.js"],
        sha: "0c55910c5783e25910b1d530e40d3877771d9b24",
        committerDate: "2020-10-16 11:05:41 -0400",
        treeHash: "36f8bceb354420e613c04840299615d1b4c9f82e",
        authorName: "kgodara-testing",
        committerName: "GitHub",
        committerEmail: "noreply@github.com",
        commitMessage: "Create test_worker_update_3.js",
        repository: "604133292355880fd17ff5b4",
        name: "Create test_worker_update_3.js",
        sourceId: "0c55910c5783e25910b1d530e40d3877771d9b24",
        sourceCreationDate: "2020-10-16T15:05:41.000+00:00",
    },
    {
        fileList: ["test_worker_update_2.js"],
        sha: "e45b305b4d0d99b41d74966f8e42d3439dc1a4f8",
        committerDate: "2020-10-16 10:45:33 -0400",
        treeHash: "615f68edda3a6477f01e101fca4c028412679082",
        authorName: "kgodara-testing",
        committerName: "GitHub",
        committerEmail: "noreply@github.com",
        commitMessage: "Create test_worker_update_2.js",
        repository: "604133292355880fd17ff5b4",
        name: "Create test_worker_update_2.js",
        sourceId: "e45b305b4d0d99b41d74966f8e42d3439dc1a4f8",
        sourceCreationDate: "2020-10-16T14:45:33.000+00:00",
    },
];


module.exports = {
    prInsertHunkLookup,
    insertHunkFilePathLookup,
    
    prNum,
    prData,

    branchNum,
    branchData,

    commitNum,
    commitData,
    
}
// 5692659e30d775ba7abb86ccd2691dd863031a3a
// ef53c12c1e794bb244e741eaab0989f25e559c03
// 9a556b291943ccfbe771399ad32cecafe38a32b2