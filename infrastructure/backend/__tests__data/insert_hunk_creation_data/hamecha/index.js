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


module.exports = {
    prInsertHunkLookup,
    insertHunkFilePathLookup
}
// 5692659e30d775ba7abb86ccd2691dd863031a3a
// ef53c12c1e794bb244e741eaab0989f25e559c03
// 9a556b291943ccfbe771399ad32cecafe38a32b2