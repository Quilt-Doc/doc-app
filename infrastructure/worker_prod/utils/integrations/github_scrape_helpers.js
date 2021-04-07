const mongoose = require("mongoose");

const _ = require("lodash");

const isUrl = require("is-url");

const IntegrationLabel = require("../../models/integrations/integration_objects/IntegrationLabel");
const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");
const IntegrationAttachment = require("../../models/integrations/integration_objects/IntegrationAttachment");

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

    comments.map((comment) => {
        const { issue_url: issueUrl, body } = comment;

        const issueSourceId = issueUrl.split("/").pop();

        if (issues[issueSourceId]) {
            const issueAttachments = new Set(issue.attachments);

            attachments = parseGithubBody(body);
        }
    });
};

parseGithubBody = (body, repository) => {
    const tokens = body
        .split("/n")
        .map((phrase) => phrase.split(" "))
        .flat();

    tokens = tokens.filter((token) => isUrl(token));

    const shaRegex = new RegExp("\b[0-9a-f]{7,40}\b");

    const modelTypes = new Set(["commit", "branch", "pullRequest", "issue"]);

    const modelTypeMap = {
        tree: "branch",
        issues: "issue",
        pull: "pullRequest",
        commit: "commit",
    };

    return tokens
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
                return {
                    sourceId,
                    modelType,
                    repository: repository._id,
                };
            }

            return null;
        })
        .filter((token) => token != null);
};

extractTextualAttachments = async (issues, repository) => {
    const insertOps = issues
        .map((issue) => {
            const { body } = issue;

            const attachments = parseGithubBody(body, repository);

            issue.textualAttachments = attachments;

            const alreadyAttached = new Set(
                issue.attachments.map((att) => {
                    const { modelType, repository, sourceId } = att;

                    return `${modelType}-${repository.toString()}-${sourceId}`;
                })
            );

            return attachments.filter(
                (att) =>
                    !alreadyAttached.has(
                        `${att.modelType}-${att.repository.toString()}-${
                            att.sourceId
                        }`
                    )
            );
        })
        .flat();

    let textualAttachments = await IntegrationAttachment.insertMany(insertOps);

    textualAttachments = textualAttachments.map(
        (att) =>
            (att.key = `${att.modelType}-${att.repository.toString()}-${
                att.sourceId
            }`)
    );

    textualAttachments = _.mapKeys(textualAttachments, "key");

    issues.map((issue) => {
        issueTextualAttachments = issue.textualAttachments.map((att) => {
            const key = `${att.modelType}-${att.repository.toString()}-${
                att.sourceId
            }`;

            return textualAttachments[key];
        });

        issue.attachments = [...issue.attachments, ...issueTextualAttachments];
    });

    return issues;
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
};
