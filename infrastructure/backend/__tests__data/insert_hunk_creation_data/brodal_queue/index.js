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


module.exports = {
    insertHunkFilePathLookup,
    prInsertHunkLookup
}