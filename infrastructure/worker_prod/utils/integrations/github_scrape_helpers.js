const mongoose = require("mongoose");

const _ = require("lodash");

const isUrl = require("is-url");
const removeMd = require("remove-markdown");

const Workspace = require("../../models/Workspace");
const IntegrationLabel = require("../../models/integrations/integration_objects/IntegrationLabel");
const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");
const IntegrationAttachment = require("../../models/integrations/integration_objects/IntegrationAttachment");

const { logger } = require("../../logging");

checkValid = (item) => {
    if (item !== null && item !== undefined) {
        return true;
    }
    return false;
};

// helper method to paginate responses
paginateResponse = async (client, baseUrl) => {
    const func = "paginateResponse";

    let objects = [];

    let page = 1;

    // loop through until all objects from each page are retrieved
    while (true) {
        const route = `${baseUrl}?page=${page}&per_page=100`;

        try {
            // extract a page
            response = await client.get(`${baseUrl}?page=${page}&per_page=100`);

            newObjects = response.data;
        } catch (e) {
            if (e.data) e = e.data.message;

            logger.error(
                `Error occured calling Github API with route: ${route}`,
                {
                    e,
                    func,
                }
            );

            throw new Error(e);
        }

        const count = newObjects.length;

        // push page objects to final array
        objects.push(newObjects);

        // break if count of page is either 0 or not full
        if (count == 0 || count != 100) break;

        page += 1;
    }

    return objects.flat();
};

// extracts and stores all labels in a repo as integration objects
extractRepositoryLabels = async (client, repository) => {
    const func = "extractRepositoryLabels";

    // extract repository identifiers
    const { fullName, _id: repositoryId } = repository;

    logger.info(`Entered with repository ${fullName}`, {
        func,
    });

    // query labels
    let labels = await paginateResponse(client, `/repos/${fullName}/labels`);

    logger.info(`Received ${labels.length} labels`, {
        func,
        obj: labels,
    });

    // insert labels into database
    const insertOps = labels.map((label) => {
        return {
            name: label.name,
            color: label.color,
            sourceId: label.id,
            source: "github",
            repository: repositoryId,
        };
    });

    try {
        labels = await IntegrationLabel.insertMany(insertOps);
    } catch (e) {
        logger.error(`Failed to insert labels into database`, {
            func,
            e,
        });

        throw new Error(e);
    }

    // create a map with sourceId as key
    return _.mapKeys(labels, "sourceId");
};

// creates a unique key for an attachment
acquireKey = (att) => {
    // extract identifying characteristics of attachment
    const { modelType, repository, sourceId } = att;

    // if commit, key can be sliced sha
    const suffix = modelType == "commit" ? sourceId.slice(0, 7) : sourceId;

    // return keys
    return `${modelType}-${repository.toString()}-${suffix}`;
};

// filters out duplicates
filterUniqueAttachments = (attachments) => {
    let seen = new Set();

    return attachments.filter((att) => {
        const key = acquireKey(att);

        if (seen.has(key)) return false;

        seen.add(key);

        return true;
    });
};

// create update ops to extend issue attachments
createIssueUpdateBulkWriteOps = async (insertOps, issueUpdates) => {
    const func = "createIssueUpdateBulkWriteOps";

    // insert attachments into database
    let insertedAttachments;

    try {
        insertedAttachments = await IntegrationAttachment.insertMany(insertOps);

        logger.info(
            `${insertedAttachments.length} attachments were inserted into the database`,
            {
                func,
                obj: insertedAttachments,
            }
        );
    } catch (e) {
        logger.error(
            `An error occurred during IntegrationAttachment insertion`,
            {
                func,
                e,
            }
        );

        throw new Error(e);
    }

    insertedAttachments.map((att) => {
        att.key = acquireKey(att);
    });

    insertedAttachments = _.mapKeys(insertedAttachments, "key");

    logger.info(`Mapped inserted attachments to generated key.`, {
        func,
        obj: insertedAttachments,
    });

    // update the attachments of each issue
    const bulkWriteOps = Object.values(issueUpdates)
        .map((update) => {
            let { newAttachments, issue } = update;

            // acquire inserted attachments for this issue
            newAttachments = filterUniqueAttachments(newAttachments).map(
                (att) => {
                    return insertedAttachments[acquireKey(att)]._id;
                }
            );

            if (newAttachments.length == 0) return null;

            return {
                updateOne: {
                    filter: { _id: issue._id },
                    update: {
                        $push: {
                            attachments: {
                                $each: newAttachments,
                            },
                        },
                    },
                    upsert: false,
                },
            };
        })
        .filter((op) => op != null);

    logger.info(`${bulkWriteOps.length} bulkWriteOps queued.`, {
        func,
        obj: bulkWriteOps,
    });

    return bulkWriteOps;
};

// parses the body of pull requests and issues to acquire attachments
parseGithubBody = (body, repository) => {
    const func = "parseGithubBody";

    logger.info(`Entered with params.`, {
        func,
        obj: { body, repository },
    });

    // remove markdown
    body = removeMd(body);

    logger.debug(`Markdown was removed from body.`, {
        func,
        obj: body,
    });

    // acquire tokens split by new line and space
    const tokens = body
        .split("\n")
        .map((phrase) => phrase.split(" "))
        .flat();

    logger.debug(`${tokens.length} tokens were extracted.`, {
        func,
        obj: tokens,
    });

    // create regex to identify possible commit
    const shaRegex = /\b[0-9a-f]{7,40}\b/;

    const modelTypes = new Set(["commit", "branch", "pullRequest", "issue"]);

    const modelTypeMap = {
        tree: "branch",
        issues: "issue",
        pull: "pullRequest",
        commit: "commit",
    };

    // avoid repeats
    let seen = new Set();

    let extractedAttachments;

    try {
        // map through tokens
        extractedAttachments = tokens
            .map((token) => {
                let modelType;

                // if token is not a url, the id will be the phrase (i.e commit)
                let sourceId = token;

                // otherwise..
                if (isUrl(token)) {
                    const splitToken = token.split("/");

                    const len = splitToken.length;

                    if (splitToken.length > 2) {
                        // can acquire the model
                        modelType =
                            modelTypeMap[splitToken.slice(len - 2, len - 1)[0]];

                        // and id of item from url
                        sourceId = splitToken.slice(-1)[0];
                    }
                    // we can test the regex and classify if it is a commit
                } else if (shaRegex.test(token)) {
                    modelType = "commit";
                }

                // validate model
                if (checkValid(modelType) && modelTypes.has(modelType)) {
                    // create attachment
                    let att = {
                        sourceId,
                        modelType,
                        repository: repository._id,
                    };

                    // create a unique identifier to make sure we haven't seen this attachment
                    let key = acquireKey(att);

                    if (!seen.has(key)) {
                        seen.add(key);

                        return att;
                    }
                }

                return null;
            })
            .filter((att) => att != null);
    } catch (e) {
        logger.error("Error parsing tokens..", {
            func,
            e,
        });
    }

    logger.info(`${extractedAttachments.length} attachments were extracted`, {
        func,
        obj: extractedAttachments,
    });

    return extractedAttachments;
};

// traverses threads of issues and pull requests
traverseGithubThreads = async (client, repository, issues, pullRequests) => {
    const func = "traverseGithubThreads";

    logger.info(
        `Entered into function with repository ${repository.fullName}, ${issues.length} issues and ${pullRequests.length} pull requests`,
        {
            func,
        }
    );

    // map issues and prs to sourceId
    issues = _.mapKeys(issues, "sourceId");

    pullRequests = _.mapKeys(pullRequests, "sourceId");

    const { fullName, _id: repositoryId } = repository;

    // request all comments from github api
    const comments = await paginateResponse(
        client,
        `/repos/${fullName}/issues/comments`
    );

    logger.debug(`${comments.length} comments were fetched from github`, {
        func,
        obj: {
            commentUrls: comments.map((comment) => comment.issue_url),
        },
    });

    // final structure used for bulk update
    const issueUpdates = {};

    // map through comments
    const attachments = comments
        .map((comment) => {
            // extract url and body of comment
            const { issue_url: issueUrl, body } = comment;

            // issue number is located at end of url
            const issueSourceId = issueUrl.split("/").pop();

            // if pull request..
            if (checkValid(pullRequests[issueSourceId])) {
                // acquire attachments from comment body
                let commentAttachments = parseGithubBody(body, repository);

                // we only care about issue attachments for issue <-> pull request links
                commentAttachments = commentAttachments.filter(
                    (att) => att.modelType == "issue"
                );

                if (commentAttachments.length == 0) return null;

                // map through attachments
                return commentAttachments
                    .map((att) => {
                        const { sourceId } = att;

                        // we know attachment must be an issue
                        const issue = issues[sourceId];

                        // extract existing attachments of issue
                        let existingAttachmentKeys = new Set(
                            issue.attachments.map((att) => acquireKey(att))
                        );

                        const { _id: issueId } = issue;

                        // we can create a pull request attachment
                        const pullRequestAtt = {
                            // sourceId was found in pull request map so this is a pull request sourceId
                            sourceId: issueSourceId,
                            modelType: "pullRequest",
                            repository: repositoryId,
                        };

                        // if pr att is already on issue skip
                        if (
                            existingAttachmentKeys.has(
                                acquireKey(pullRequestAtt)
                            )
                        )
                            return null;

                        // if we have an update for the issue
                        if (issueId in issueUpdates) {
                            // push the attachment
                            issueUpdates[issueId].newAttachments.push(
                                pullRequestAtt
                            );
                        } else {
                            // otherwise create a new item in the map
                            issueUpdates[issueId] = {
                                issue,
                                newAttachments: [pullRequestAtt],
                            };
                        }

                        return pullRequestAtt;
                    })
                    .filter((att) => att != null);

                // if issue..
            } else if (checkValid(issues[issueSourceId])) {
                // acquire the issue
                const issue = issues[issueSourceId];

                // extract existing attachments of issue
                let existingAttachmentKeys = new Set(
                    issue.attachments.map((att) => acquireKey(att))
                );

                // acquire all attachments
                let commentAttachments = parseGithubBody(body, repository);

                // if att is already on issue skip
                commentAttachments = commentAttachments.filter(
                    (att) => !existingAttachmentKeys.has(acquireKey(att))
                );

                if (commentAttachments.length == 0) return null;

                const { _id: issueId } = issue;

                if (issueId in issueUpdates) {
                    // add attachments
                    issueUpdates[issueId].newAttachments = [
                        ...issueUpdates[issueId].newAttachments,
                        ...commentAttachments,
                    ];
                } else {
                    issueUpdates[issueId] = {
                        issue,
                        newAttachments: commentAttachments,
                    };
                }

                return commentAttachments;
            } else {
                return null;
            }
        })
        .filter((arr) => arr != null)
        .flat();

    logger.info(`Finished creation of issue update object`, {
        func,
        obj: issueUpdates,
    });

    if (_.isEmpty(issueUpdates)) return;

    // extract unique attachments
    const insertOps = filterUniqueAttachments(attachments);

    const bulkWriteOps = await createIssueUpdateBulkWriteOps(
        insertOps,
        issueUpdates
    );

    await IntegrationTicket.bulkWrite(bulkWriteOps);
};

// extracts url and direct sha attachments on issue bodies
extractTextualAttachments = async (issues, repository) => {
    const func = "extractTextualAttachments";

    logger.info(`Entered with params.`, {
        func,
        obj: { issues, repository },
    });

    const issueUpdates = {};

    // map over issues
    const insertOps = issues
        .map((issue) => {
            const { description } = issue;

            // acquire attachments for issue description
            let attachments = parseGithubBody(description, repository);

            logger.debug(
                `${attachments.length} body attachments of issue with sourceId ${issue.sourceId} were extracted.`,
                {
                    func,
                    obj: attachments,
                }
            );

            const alreadyAttached = new Set(
                issue.attachments.map((att) => {
                    return acquireKey(att);
                })
            );

            logger.debug(
                `${
                    Array.from(alreadyAttached).length
                } attachments were already extracted.`,
                {
                    func,
                    obj: alreadyAttached,
                }
            );

            // filter already attached attachments
            attachments = attachments.filter(
                (att) => !alreadyAttached.has(acquireKey(att))
            );

            logger.debug(
                `${attachments.length} body attachments remain after filtering duplicates.`,
                {
                    func,
                    obj: attachments,
                }
            );

            if (attachments.length > 0) {
                issueUpdates[issue._id].newAttachments = attachments;

                issueUpdates[issue._id].issue = issue;
            }

            return attachments;
        })
        .flat();

    const bulkWriteOps = await createIssueUpdateBulkWriteOps(
        insertOps,
        issueUpdates
    );

    try {
        await IntegrationTicket.bulkWrite(bulkWriteOps);
    } catch (e) {
        throw new Error(e);
    }
};

// maps labels to issues
extractIssueLabels = (issues, labels) => {
    issues.map((issue) => {
        issue.labels = issue.labels.map((label) => {
            const { id } = label;

            return labels[id]._id;
        });
    });
};

module.exports = {
    extractRepositoryLabels,
    traverseGithubThreads,
    extractTextualAttachments,
    extractIssueLabels,
    parseGithubBody,
};
