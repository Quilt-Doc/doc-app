const { gql } = require("graphql-request");

const { requestPublicGraphQLClient } = require("../../apis/api");

const acquireSampleBlames = async (commitSample, repo) => {
    const client = requestPublicGraphQLClient();

    const query = generateCommitBlameQuery();

    let variables = {
        repoName: repo.fullName.split("/")[0],
        repoOwner: repo.fullName.split("/")[1],
    };

    let progress = 0;

    let results = [];
    while (progress != commitSample.length) {
        // batch of 10
        results.push(
            await Promise.all(
                commitSample.slice(progress, progress + 10).map((commit) => {
                    const { sourceId: sha, fileList } = commit;

                    fileList.map((file) => {
                        return client.request(query, {
                            ...variables,
                            commitSha: sha,
                            filePath: file,
                        });
                    });
                })
            )
        );
    }

    return results;
};

const generateCommitBlameQuery = () => {
    return gql`
        query fetchCommitWithBlames(
            $repoName: String!
            $repoOwner: String!
            $commitSha: String!
            $filePath: String
        ) {
            repository(name: $repoName, owner: $repoOwner) {
                object(oid: $commitSha) {
                    ... on Commit {
                        additions
                        deletions
                        blame(path: $filePath) {
                            ranges {
                                startingLine
                                endingLine
                            }
                        }
                    }
                }
            }
        }
    `;
};

const compareScrapeToSampleBlames = (commitSample, insertHunks, blameRanges) => {
    let results = {};

    commitSample.map((commit, i) => {
        const { fileList, sourceId } = commit;

        const commitHunks = insertHunks[i];

        const commitRanges = blameRanges[i];

        let areBlamesCorrect = true;

        let data = {};

        fileList.map((file, i) => {
            const fileHunks = commitHunks[i];

            const fileRanges = commitRanges[i];

            if (fileHunks.length != fileRanges.length) {
                areBlamesCorrect = false;
                data[file] = {
                    scrapedCount: fileHunks.length,
                    rawCount: fileRanges.length,
                };
            } else {
                fileHunks.sort((a, b) => a.lineStart - b.lineStart);

                fileRanges.sort((a, b) => a.startingLine - b.startingLine);

                for (let j = 0; j < fileHunks.length; j++) {
                    const { lineStart, lines } = fileHunks[j];

                    const { startingLine, endingLine } = fileRanges[j];

                    if (
                        lineStart != startingLine ||
                        lineStart + lines.length != endingLine
                    ) {
                        if (!(file in data)) data[file] = [];

                        areBlamesCorrect = false;

                        data[file].push({
                            scraped: fileHunks[i],
                            raw: fileRanges[i],
                        });
                    }
                }
            }
        });

        results[sourceId] = {
            areBlamesCorrect,
            errorData: data,
        };
    });

    return results;
};

module.exports = {
    acquireSampleBlames,
    compareScrapeToSampleBlames,
};
