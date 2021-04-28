const mongoose = require("mongoose");

const _ = require("lodash");

const isUrl = require("is-url");
const removeMd = require("remove-markdown");

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

extractRepositoryLabels = async (installationClient, repository) => {
    const { fullName, _id: repositoryId } = repository;

    const response = await installationClient.get(`/repos/${fullName}/labels`);

    let labels = response.data;

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
        throw new Error(e);
    }

    return _.mapKeys(labels, "sourceId");
};

acquireKey = (att) => {
    const { modelType, repository, sourceId } = att;

    const suffix = modelType == "commit" ? sourceId.slice(0, 7) : sourceId;

    return `${modelType}-${repository.toString()}-${suffix}`;
};

traverseGithubThreads = async (
    installationClient,
    repository,
    issues,
    pullRequests
) => {
    issues = _.mapKeys(issues, "sourceId");

    pullRequests = _.mapKeys(pullRequests, "sourceId");

    const { fullName } = repository;

    const response = await installationClient.get(
        `/repos/${fullName}/issues/comments`
    );

    const comments = response.data;

    const issueUpdates = {};

    const insertOps = comments
        .map((comment) => {
            const { issue_url: issueUrl, body } = comment;

            const issueSourceId = issueUrl.split("/").pop();

            if (checkValid(pullRequests[issueSourceId])) {
                let commentAttachments = parseGithubBody(body, repository);

                commentAttachments = commentAttachments.filter(
                    (att) => att.modelType == "issue"
                );

                if (commentAttachments.length == 0) return null;

                commentAttachments.map((att) => {
                    const { sourceId } = att;

                    const issue = issues[sourceId];

                    const { _id: issueId } = issue;

                    if (issueId in issueUpdates) {
                        issueUpdates[issueId].commentAttachments.push(att);
                    } else {
                        issueUpdates[issueId].issue = issue;

                        issueUpdates[issueId].commentAttachments = [att];
                    }
                });
            } else if (checkValid(issues[issueSourceId])) {
                const issue = issues[issueSourceId];

                let commentAttachments = parseGithubBody(body, repository);

                if (commentAttachments.length == 0) return null;

                const { _id: issueId } = issue;

                if (issueId in issueUpdates) {
                    issueUpdates[issueId].commentAttachments = [
                        ...issueUpdates[issueId].commentAttachments,
                        ...commentAttachments,
                    ];
                } else {
                    issueUpdates[issueId].issue = issue;

                    issueUpdates[
                        issueId
                    ].commentAttachments = commentAttachments;
                }

                return commentAttachments;
            } else {
                return null;
            }
        })
        .filter((arr) => arr != null)
        .flat();

    let insertedAttachments = IntegrationAttachment.insertMany(insertOps);

    insertedAttachments = insertedAttachments.map(
        (att) =>
            (att.key = `${att.modelType}-${att.repository.toString()}-${
                att.sourceId
            }`)
    );

    insertedAttachments = _.mapKeys(insertedAttachments, "key");

    const bulkWriteOps = Object.values(issueUpdates)
        .map((update) => {
            let { commentAttachments, issue } = update;

            let seen = new Set(
                issue.attachments.map((att) => {
                    const { modelType, repository, sourceId } = att;

                    return `${modelType}-${repository.toString()}-${sourceId}`;
                })
            );

            commentAttachments = commentAttachments
                .map((att) => {
                    const { modelType, repository, sourceId } = att;

                    const key = `${modelType}-${repository.toString()}-${sourceId}`;

                    if (seen.has(key)) return null;

                    seen.add(key);

                    return insertedAttachments[key]._id;
                })
                .filter((att) => att != null);

            if (commentAttachments.length == 0) return null;

            return {
                updateOne: {
                    filter: { _id: issue._id },
                    update: {
                        $push: {
                            attachments: {
                                $each: commentAttachments,
                            },
                        },
                    },
                    upsert: false,
                },
            };
        })
        .filter((op) => op != null);

    return bulkWriteOps;
};

parseGithubBody = (body, repository) => {
    const func = "parseGithubBody";

    logger.info(`Entered with params.`, {
        func,
        obj: { body, repository },
    });

    body = removeMd(body);

    logger.debug(`Markdown was removed from body.`, {
        func,
        obj: body,
    });

    const tokens = body
        .split("\n")
        .map((phrase) => phrase.split(" "))
        .flat();

    logger.debug(`${tokens.length} tokens were extracted.`, {
        func,
        obj: tokens,
    });

    const shaRegex = /\b[0-9a-f]{7,40}\b/;

    const modelTypes = new Set(["commit", "branch", "pullRequest", "issue"]);

    const modelTypeMap = {
        tree: "branch",
        issues: "issue",
        pull: "pullRequest",
        commit: "commit",
    };

    let seen = new Set();

    let extractedAttachments;

    try {
        extractedAttachments = tokens
            .map((token) => {
                let modelType;

                let sourceId = token;

                if (isUrl(token)) {
                    const splitToken = token.split("/");

                    const len = splitToken.length;

                    if (splitToken.length > 2) {
                        modelType =
                            modelTypeMap[splitToken.slice(len - 2, len - 1)[0]];

                        sourceId = splitToken.slice(-1)[0];
                    }
                } else if (shaRegex.test(token)) {
                    modelType = "commit";
                }

                if (checkValid(modelType) && modelTypes.has(modelType)) {
                    let att = {
                        sourceId,
                        modelType,
                        repository: repository._id,
                    };

                    let key = acquireKey(att);

                    if (!seen.has(key)) {
                        seen.add(key);

                        return att;
                    }
                }

                return null;
            })
            .filter((token) => token != null);
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

extractTextualAttachments = async (issues, repository) => {
    const func = "extractTextualAttachments";

    logger.info(`Entered with params.`, {
        func,
        obj: { issues, repository },
    });

    const issueUpdates = {};

    const insertOps = issues
        .map((issue) => {
            const { body } = issue;

            let attachments = parseGithubBody(body, repository);

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

            attachments = attachments.filter((att) => {
                const key = acquireKey(att);

                return !alreadyAttached.has(key);
            });

            logger.debug(
                `${attachments.length} body attachments remain after filtering duplicates.`,
                {
                    func,
                    obj: attachments,
                }
            );

            if (attachments.length > 0) {
                issueUpdates[issue._id].textualAttachments = attachments;

                issueUpdates[issue._id].issue = issue;
            }

            return attachments;
        })
        .flat();

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
            "An error occurred during IntegrationAttachment insertion",
            {
                func,
                e,
            }
        );

        throw new Error(e);
    }

    insertedAttachments = insertedAttachments.map((att) => {
        att.key = acquireKey(att);

        return !alreadyAttached.has(key);
    });

    insertedAttachments = _.mapKeys(insertedAttachments, "key");

    logger.info(`Mapped attachments.`, {
        func,
        obj: insertedAttachments,
    });

    const bulkWriteOps = Object.values(issueUpdates)
        .map((update) => {
            let { textualAttachments, issue } = update;

            let seen = new Set(issue.attachments.map((att) => acquireKey(att)));

            textualAttachments = textualAttachments
                .map((att) => {
                    const key = acquireKey(att);

                    if (seen.has(key)) return null;

                    seen.add(key);

                    return insertedAttachments[key]._id;
                })
                .filter((att) => att != null);

            if (textualAttachments.length == 0) return null;

            return {
                updateOne: {
                    filter: { _id: issue._id },
                    update: {
                        $push: {
                            attachments: {
                                $each: textualAttachments,
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
