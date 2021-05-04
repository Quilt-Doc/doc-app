const _ = require("lodash");

const { checkValid } = require("../../utils/utils");

const InsertHunk = require("../../models/InsertHunk");

const { logger } = require("../../fs_logging");

const {
    encodeText,
    computeContextBlames,
    computeBlameChunkBoundaries,
    insertHunksIntoBounds,
    populateBoundaries,
    queryObjects,
} = require("./BlameHelpers");

retrieveBlame = async (req, res) => {
    const func = "retrieveBlame";

    const { repositoryId } = req.params;

    const { filePath, fileText } = req.body;

    logger.info("Entered in retrieveBlame.", {
        func,
        obj: {
            filePath,
            repositoryId,
        },
    });

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

    logger.info(
        `Retrieved ${commitHunks.length} commitHunks and ${pullRequestHunks.length} pullRequestHunks`,
        {
            func,
            obj: {
                commitHunks,
                pullRequestHunks,
            },
        }
    );

    if (commitHunks.length == 0 && pullRequestHunks.length == 0) {
        return res.json({ success: true, result: { blameChunks: {} } });
    }

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

    logger.info("Successfully computed context blames.", {
        func,
    });

    // filter hunks without chosenPatch -> no contextual blames were found
    // for these guys
    commitHunks = commitHunks.filter((hunk) => checkValid(hunk.chosenPatch));

    pullRequestHunks = pullRequestHunks.filter((hunk) =>
        checkValid(hunk.chosenPatch)
    );

    // compute density boundaries to group items into annotations
    let boundaries = computeBlameChunkBoundaries(commitHunks, encodedFileText);

    logger.info(
        `Successfully computed ${boundaries.length} blame boundaries using density.`,
        {
            func,
        }
    );

    // insert commits into boundaries
    insertHunksIntoBounds(commitHunks, boundaries, "commits");

    // insert prs into boundaries
    insertHunksIntoBounds(pullRequestHunks, boundaries, "pullRequests");

    logger.info(`Inserted hunks into boundaries`, {
        func,
        obj: boundaries,
    });

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

    logger.info(
        `Queried necessary objects to insert tickets and docs into boundaries.`,
        {
            func,
            obj: boundaries,
        }
    );

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

    logger.info("Boundaries have item ids.", {
        func,
        obj: boundaries,
    });

    // map through boundaries and replace the items in the set
    // with populated items from itemMap
    boundaries = _.mapKeys(
        Object.values(boundaries)
            .map((boundary) => {
                const fields = [
                    "tickets",
                    "commits",
                    "pullRequests",
                    "documents",
                ];

                // map through each item field
                fields.map((field) => {
                    if (field in boundary) {
                        const items = Array.from(boundary[field]);

                        boundary[field] = items.map(
                            (item) => itemMap[field][item]
                        );
                    }
                });

                return boundary;
            })
            .filter((boundary) => {
                let keep = false;

                const fields = [
                    "commits",
                    "pullRequests",
                    "tickets",
                    "documents",
                ];

                for (let i = 0; i < fields.length; i++) {
                    const field = fields[i];

                    if (field in boundary && boundary[field].length > 0) {
                        keep = true;

                        break;
                    }
                }

                return keep;
            }),
        "start"
    );

    logger.info("Boundaries were populated.", {
        func,
        obj: boundaries,
    });

    return res.json({ success: true, result: { blameChunks: boundaries } });
};

module.exports = {
    retrieveBlame,
};
