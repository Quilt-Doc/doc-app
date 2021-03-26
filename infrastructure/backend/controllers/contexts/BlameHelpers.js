const _ = require("lodash");

const { checkValid } = require("../../utils/utils");

const InsertHunk = require("../../models/InsertHunk");
const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");
const IntegrationDocument = require("../../models/integrations/integration_objects/IntegrationDocument");
const Association = require("../../models/associations/Association");
const PullRequest = require("../../models/PullRequest");
const Commit = require("../../models/Commit");

const WINDOW_RATIO = 2;

const SEQ_LEN_THRESHOLD = 0.5;

retrieveBlame = async (req, res) => {
    const { repositoryId } = req.params;

    const { filePath, fileText } = req.body;

    // get commit and pull request hunks separately
    let [commitHunks, pullRequestHunks] = await Promise.all([
        InsertHunk.find({
            filePath,
            repository: repositoryId,
            commitSha: {
                $exists: true,
            },
        }).lean(),
        InsertHunk.find({
            filePath,
            repository: repositoryId,
            pullRequestNumber: {
                $exists: true,
            },
        }).lean(),
    ]);

    let encoder = {
        textEncoding: {},
        counter: 0,
    };

    // encode text of file
    const encodedFileText = encodeText(encoder, fileText.split("\n"));

    // for each commit hunk..
    commitHunks.map((hunk) => {
        // encode hunk's lines
        hunk.encodedText = encodeText(encoder, hunk.lines, true);

        // compute context blames for the hunk
        // these blames will be added as chosenPatch on hunk object
        computeContextBlames(encodedFileText, hunk);
    });

    // do the same as above to pr hunks
    pullRequestHunks.map((hunk) => {
        hunk.encodedText = encodeText(encoder, hunk.lines, true);

        computeContextBlames(encodedFileText, hunk);
    });

    // filter hunks without chosenPatch -> no contextual blames were found
    // for these guys
    commitHunks = commitHunks.filter((hunk) => checkValid(hunk.chosenPatch));

    pullRequestHunks = pullRequestHunks.filter((hunk) =>
        checkValid(hunk.chosenPatch)
    );

    // compute density boundaries to group items into annotations
    let boundaries = computeBlameChunkBoundaries(commitHunks, fileText);

    // insert commits into boundaries
    insertHunksIntoBounds(commitHunks, boundaries, "commits");

    // insert prs into boundaries
    insertHunksIntoBounds(pullRequestHunks, boundaries, "pullRequests");

    // query all the objects required for further assoc processing
    const {
        associations,
        commits,
        pullRequests,
        tickets,
        documents,
        rawCommits,
        rawPullRequests,
    } = await queryObjects(commitHunks, pullRequestHunks, repositoryId);

    boundaries = _.mapKeys(boundaries, "start");

    commitsMap = _.mapKeys(rawCommits, "_id");

    pullRequestsMap = _.mapKeys(rawPullRequests, "_id");

    // add assocs to boundary objects
    populateBoundaries(
        associations,
        boundaries,
        pullRequestsMap,
        commitsMap,
        tickets,
        documents
    );

    const itemMap = {
        tickets: tickets, // mapped to _id
        commits: commits, // mapped to sourceId
        documents: documents, // mapped to _id
        pullRequests: pullRequests, // mapped to sourceId
    };

    //console.log("BOUNDARIES", boundaries);

    // map through boundaries and replace the items in the set
    // with populated items from itemMap
    Object.values(boundaries).map((boundary) => {
        const fields = ["tickets", "commits", "pullRequests", "documents"];

        fields.map((field) => {
            if (field in boundary) {
                const items = Array.from(boundary[field]);

                boundary.field = items.map((item) => itemMap[field][item]);
            }
        });
    });

    //console.log("FINAL BOUNDARIES", boundaries);

    return { blameChunks: boundaries };
};

encodeText = (encoder, newText, removeSpace) => {
    const lines = newText;

    return lines
        .map((line) => {
            line = line.trim();

            if (line == "" && removeSpace) {
                return null;
            }

            if (!(line in encoder.textEncoding)) {
                encoder.textEncoding[line] = encoder.counter;

                encoder.counter += 1;
            }

            return encoder.textEncoding[line];
        })
        .filter((encoded) => checkValid(encoded));
};

computeContextBlames = (text, hunk, windowRatio, lengthThreshold) => {
    const hunkText = hunk.encodedText;

    windowRatio = checkValid(windowRatio) ? windowRatio : WINDOW_RATIO;

    const windowSize = windowRatio * hunk.lines.length;

    lengthThreshold = checkValid(lengthThreshold)
        ? lengthThreshold
        : SEQ_LEN_THRESHOLD;

    const seqIndices = lcs(text, hunkText);

    let sliceStart = 0;

    let sliceEnd = Math.floor(sliceStart + windowSize);

    sliceEnd = sliceEnd >= text.length ? text.length - 1 : sliceEnd;

    let chosenIndices = [];

    let currentIndices = [];

    while (
        seqIndices.length > 0 &&
        seqIndices[seqIndices.length - 1] <= sliceEnd
    ) {
        currentIndices.push(seqIndices.pop());
    }

    while (sliceEnd < text.length) {
        if (currentIndices.length > 0 && currentIndices[0] < sliceStart) {
            currentIndices.shift();
        }

        if (
            seqIndices.length > 0 &&
            seqIndices[seqIndices.length - 1] == sliceEnd
        ) {
            currentIndices.push(seqIndices.pop());
        }

        if (currentIndices.length > chosenIndices.length) {
            chosenIndices = [...currentIndices];
        }

        sliceStart += 1;

        sliceEnd += 1;
    }

    const minSeqLen = lengthThreshold
        ? Math.floor(lengthThreshold * hunkText.length)
        : 0;

    if (chosenIndices.length <= minSeqLen) {
        return { chosenSequence: null, patch: null };
    } else {
        const patch = {
            start: chosenIndices[0],
            end: chosenIndices[chosenIndices.length - 1],
        };

        hunk.chosenPatch = patch;

        if (process.env.isTesting) {
            chosenSequence = chosenIndices.map((ind) => text[ind]);

            return { chosenSequence, patch: patch };
        }
    }
};

computeBlameChunkBoundaries = (hunks, text) => {
    if (!hunks || hunks.length == 0) {
        return [{ start: 0, end: text.length - 1 }];
    }

    hunks.sort((a, b) => {
        if (a.chosenPatch.start < b.chosenPatch.start) {
            return -1;
        }

        return 1;
    });

    if (hunks[0].chosenPatch.start != 0) {
        hunks = [
            {
                chosenPatch: {
                    start: 0,
                    end: hunks[0].chosenPatch.start - 1,
                },
            },
            ...hunks,
        ];
    }

    let hunksIndex = 0;

    let densitySet = new Set();

    let boundaries = [];

    let boundaryStart = null;

    for (let i = 0; i < text.length; i++) {
        let shouldBreak = false;

        let isChanged = false;

        while (!shouldBreak) {
            if (hunksIndex >= hunks.length) {
                break;
            }

            const hunk = hunks[hunksIndex];

            if (hunk.chosenPatch.start == i) {
                densitySet.add(hunk.chosenPatch.end + 1);

                isChanged = true;

                hunksIndex += 1;
            } else {
                shouldBreak = true;
            }
        }

        if (densitySet.has(i)) {
            isChanged = true;

            densitySet.delete(i);
        }

        if (isChanged) {
            if (checkValid(boundaryStart)) {
                boundaries.push({
                    start: boundaryStart,
                    end: i - 1,
                });
            }

            boundaryStart = i;
        }
    }

    boundaries.push({
        start: boundaryStart,
        end: text.length - 1,
    });

    return boundaries;
};

insertHunksIntoBounds = (hunks, boundaries, type) => {
    const sourceId = type == "commits" ? "commitSha" : "pullRequestNumber";

    hunks.map((hunk, i) => {
        const {
            chosenPatch: { start: hunkStart, end: hunkEnd },
        } = hunk;

        boundaries.map((boundary, j) => {
            const cond1 =
                boundary.start <= hunkStart && boundary.end >= hunkStart;

            const cond2 =
                hunkStart <= boundary.start && hunkEnd >= boundary.start;

            if (cond1 || cond2) {
                if ("chunks" in hunks[i]) {
                    hunks[i].chunks.push(boundary.start);
                } else {
                    hunks[i].chunks = [boundary.start];
                }

                if (type in boundaries[j]) {
                    boundaries[j][type].add(hunk[sourceId]);
                } else {
                    boundaries[j][type] = new Set([hunk[sourceId]]);
                }
            }
        });
    });
};

lcs = (set1, set2) => {
    // Init LCS matrix.
    const lcsMatrix = Array(set2.length + 1)
        .fill(null)
        .map(() => Array(set1.length + 1).fill(null));

    // Fill first row with zeros.
    for (let columnIndex = 0; columnIndex <= set1.length; columnIndex += 1) {
        lcsMatrix[0][columnIndex] = 0;
    }

    // Fill first column with zeros.
    for (let rowIndex = 0; rowIndex <= set2.length; rowIndex += 1) {
        lcsMatrix[rowIndex][0] = 0;
    }

    // Fill rest of the column that correspond to each of two strings.
    for (let rowIndex = 1; rowIndex <= set2.length; rowIndex += 1) {
        for (
            let columnIndex = 1;
            columnIndex <= set1.length;
            columnIndex += 1
        ) {
            if (set1[columnIndex - 1] === set2[rowIndex - 1]) {
                lcsMatrix[rowIndex][columnIndex] =
                    lcsMatrix[rowIndex - 1][columnIndex - 1] + 1;
            } else {
                lcsMatrix[rowIndex][columnIndex] = Math.max(
                    lcsMatrix[rowIndex - 1][columnIndex],
                    lcsMatrix[rowIndex][columnIndex - 1]
                );
            }
        }
    }

    // Calculate LCS based on LCS matrix.
    if (!lcsMatrix[set2.length][set1.length]) {
        // If the length of largest common string is zero then return empty string.
        return [];
    }

    const seqIndices = [];
    let columnIndex = set1.length;
    let rowIndex = set2.length;

    while (columnIndex > 0 || rowIndex > 0) {
        if (set1[columnIndex - 1] === set2[rowIndex - 1]) {
            // Move by diagonal left-top.
            //longestSequence.unshift(set1[columnIndex - 1]);
            columnIndex -= 1;
            rowIndex -= 1;

            seqIndices.push(columnIndex);
        } else if (
            lcsMatrix[rowIndex][columnIndex] ===
            lcsMatrix[rowIndex][columnIndex - 1]
        ) {
            // Move left.
            columnIndex -= 1;
        } else {
            // Move up.
            rowIndex -= 1;
        }
    }

    return seqIndices;
};

queryObjects = async (commitHunks, pullRequestHunks, repositoryId) => {
    let [commits, pullRequests] = await Promise.all([
        Commit.find({
            sourceId: { $in: commitHunks.map((hunk) => hunk.commitSha) },
            repository: repositoryId,
        }).lean(),
        PullRequest.find({
            sourceId: {
                $in: pullRequestHunks.map((hunk) => hunk.pullRequestNumber),
            },
            repository: repositoryId,
        }).lean(),
    ]);

    let associations = await Promise.all([
        Association.find({
            firstElementModelType: {
                $in: ["IntegrationDocument", "IntegrationTicket"],
            },
            secondElement: { $in: commits.map((commit) => commit._id) },
            secondElementModelType: "Commit",
        }).lean(),
        Association.find({
            firstElementModelType: {
                $in: ["IntegrationDocument", "IntegrationTicket"],
            },
            secondElement: { $in: pullRequests.map((pr) => pr._id) },
            secondElementModelType: "PullRequest",
        }).lean(),
    ]);

    associations = associations.flat();

    let tickets = await IntegrationTicket.find({
        _id: {
            $in: associations
                .filter(
                    (assoc) =>
                        assoc.firstElementModelType == "IntegrationTicket"
                )
                .map((assoc) => assoc.firstElement),
        },
    });

    let documents = await IntegrationDocument.find({
        _id: {
            $in: associations
                .filter(
                    (assoc) =>
                        assoc.firstElementModelType == "IntegrationDocument"
                )
                .map((assoc) => assoc.firstElement),
        },
    });

    const rawCommits = commits;

    const rawPullRequests = pullRequests;

    commits = _.mapKeys(commits, "sourceId");

    pullRequests = _.mapKeys(pullRequests, "sourceId");

    tickets = _.mapKeys(tickets, "_id");

    documents = _.mapKeys(documents, "_id");

    let check;

    commitHunks.map((hunk) => {
        const commit = commits[hunk.commitSha];

        if (!commit) {
            check = hunk.commitSha;

            return;
        }

        if ("hunks" in commit) {
            commit.hunks.push(hunk);
        } else {
            commit.hunks = [hunk];
        }
    });

    if (check) {
        const commit = await Commit.findOne({
            sourceId: "055150c6d1f2809a738d8a9cc5519c9c8d011b9e",
        });

        console.log("CHECK", check);

        console.log("COMMIT", commit);
    }

    pullRequestHunks.map((hunk) => {
        const pullRequest = pullRequests[hunk.pullRequestNumber];

        if ("hunks" in pullRequest) {
            pullRequest.hunks.push(hunk);
        } else {
            pullRequest.hunks = [hunk];
        }
    });

    return {
        commits,
        pullRequests,
        tickets,
        documents,
        rawCommits,
        rawPullRequests,
        associations,
    };
};

populateBoundaries = (
    associations,
    boundaries,
    pullRequestsMap,
    commitsMap,
    tickets,
    documents
) => {
    const maps = {
        PullRequest: pullRequestsMap,
        Commit: commitsMap,
    };

    const metadatas = {
        IntegrationTicket: {
            collection: tickets,
            fieldName: "tickets",
        },
        IntegrationDocument: {
            collection: documents,
            fieldName: "documents",
        },
    };

    // map through associations
    associations.map((assoc) => {
        const {
            firstElementModelType,
            secondElementModelType,
            firstElement,
            secondElement,
        } = assoc;

        // extract metadata for model
        const metadata = metadatas[firstElementModelType];

        // extract item from collections obj
        const item = metadata["collection"][firstElement];

        // extract field name
        const field = metadata["fieldName"];

        // extract correct map using current code object type
        const map = maps[secondElementModelType];

        // use codeObject._id to find element in mmap
        const co = map[secondElement];

        // code object should exist since assocs are queried using
        // code object -> if obj has hunks
        if (co.hunks) {
            // add code object hunks to item hunks
            if (item.hunks) {
                item.hunks = [...item.hunks, ...co.hunks];
            } else {
                item.hunks = co.hunks;
            }

            // map through code object hunks
            co.hunks.map((hunk) => {
                const { chunks } = hunk;

                // extract starts of chunks of hunks
                chunks.map((start) => {
                    const chunk = boundaries[start];

                    // add assoc item to chunk
                    if (field in chunk) {
                        chunk[field].add(firstElement);
                    } else {
                        chunk[field] = new Set([firstElement]);
                    }
                });
            });
        }
    });
};

module.exports = {
    encodeText,
    computeContextBlames,
    computeBlameChunkBoundaries,
    insertHunksIntoBounds,
    populateBoundaries,
    queryObjects,
    retrieveBlame,
};

/*
computeContextBlames = (text, hunk, windowRatio, lengthThreshold) => {
    const hunkText = hunk.encodedText;

    windowRatio = checkValid(windowRatio) ? windowRatio : WINDOW_RATIO;

    const windowSize = windowRatio * hunkText.length;

    lengthThreshold = checkValid(lengthThreshold)
        ? lengthThreshold
        : SEQ_LEN_THRESHOLD;

    let sliceStart = 0;

    let seqLen = Math.floor(lengthThreshold * hunkText.length);

    let chosenSequence = null;

    let chosenPatch = null;

    let shouldBreak = false;

    while (!shouldBreak) {
        let sliceEnd = Math.floor(sliceStart + windowSize);

        if (sliceEnd >= text.length) {
            shouldBreak = true;

            sliceEnd = text.length;
        }

        const textSlice = text.slice(sliceStart, sliceEnd);

        const { longestSequence, patch } = lcs(textSlice, hunkText);

        if (longestSequence.length > seqLen) {
            chosenPatch = {
                start: patch.start + sliceStart,
                end: patch.end + sliceStart,
            };

            seqLen = longestSequence.length;

            chosenSequence = longestSequence;
        }

        sliceStart += 1;
    }

    hunk.chosenPatch = chosenPatch;

    //console.log("OUTPUT", { chosenSequence, patch: hunk.chosenPatch });

    return { chosenSequence, patch: hunk.chosenPatch };


populateBoundaries = (
    associations,
    boundaries,
    pullRequestsMap,
    commitsMap
) => {
    const modelMap = {
        IntegrationTicket: tickets,
        IntegrationDocument: documents,
    };

    const fieldMap = {
        IntegrationTicket: "tickets",
        IntegrationDocument: "documents",
    };

    const metadata = {
        IntegrationTicket: {
            collection: tickets,
            fieldName: "tickets",
        },
        IntegrationDocument: {
            collection: documents,
            fieldName: "documents",
        },
    };

    
    associations.map((assoc) => {
        const {
            firstElementModelType,
            secondElementModelType,
            firstElement,
            secondElement,
        } = assoc;

        if (secondElementModelType == "PullRequest") {
            const pullRequest = pullRequestsMap[secondElement];

            if (pullRequest.hunks) {
                if (hunks in modelMap[firstElementModelType]) {
                    modelMap[firstElementModelType][firstElement].hunks = [
                        ...modelMap[firstElementModelType][firstElement].hunks,
                        ...pullRequest.hunks,
                    ];
                } else {
                    modelMap[firstElementModelType][firstElement].hunks =
                        pullRequest.hunks;
                }

                pullRequest.hunks.map((hunk) => {
                    const { chunks } = hunk;

                    const field = fieldMap[firstElementModelType];

                    chunks.map((chunkStart) => {
                        const chunk = boundaries[chunkStart];

                        if (field in chunk) {
                            chunk[field].add(firstElement);
                        } else {
                            chunk[field] = new Set([firstElement]);
                        }
                    });
                });
            }
        } else {
            const commit = commitsMap[secondElement];

            if (commit.hunks) {
                if (hunks in modelMap[firstElementModelType]) {
                    modelMap[firstElementModelType][firstElement].hunks = [
                        ...modelMap[firstElementModelType].hunks,
                        ...commit.hunks,
                    ];
                } else {
                    modelMap[firstElementModelType][firstElement].hunks =
                        commit.hunks;
                }

                commit.hunks.map((hunk) => {
                    const { chunks } = hunk;

                    const field = fieldMap[firstElementModelType];

                    chunks.map((chunkStart) => {
                        const chunk = boundaries[chunkStart];

                        if (field in chunk) {
                            chunk[field].add(firstElement);
                        } else {
                            chunk[field] = new Set([firstElement]);
                        }
                    });
                });
            }
        }
    });
};
};*/
