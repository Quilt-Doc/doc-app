const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const { serializeError, deserializeError } = require("serialize-error");

const GithubIssue = require("../../models/integrations/github/GithubIssue");
const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");

scrapeGithubRepoIssues = async (
    installationId,
    repositoryId,
    installationClient,
    repositoryObj,
    workspaceId,
    worker
) => {
    // TEST ISSUE SCRAPING

    // GET /repos/{owner}/{repo}/issues

    var pageNum = 0;

    // 100 is max page size
    var pageSize = 100;

    var issueListPageResponse;
    try {
        issueListPageResponse = await installationClient.get(
            `/repos/${repositoryObj.fullName}/issues?state=all&per_page=${pageSize}&page=${pageNum}`
        );
    } catch (err) {
        await worker.send({
            action: "log",
            info: {
                level: "error",
                message: serializeError(err),
                errorDescription: `Error running GET Github Repository Issues - fullName, installationId: ${repositoryObj.fullName}, ${installationId}`,
                source: "worker-instance",
                function: "scrapeGithubRepoIssues",
            },
        });

        throw new Error(
            `Error running GET Github Repository Issues - fullName, installationId: ${repositoryObj.fullName}, ${installationId}`
        );
    }

    var repositoryIssueList = issueListPageResponse.data;

    // Bulk create GithubProject models for all Objects found

    /*
    id: {type: String, required: true},
    html_url: {type: String, required: true},
    number: {type: Number, required: true},
    state: {type: String, enum: ['open', 'closed'], required: true},
    title: {type: String, required: true},
    body: {type: String, required: true},
    githubUserId: {type: Number, required: true},
    labels: [{type: String, required: true}],
    assignee: {type: String, required: true},
    assignees: [{type: String, required: true}],
    milestone: {type: String, required: true},
    locked: {type: Boolean, required: true},
    comments: { type: Number, required: true },
    pull_request: { type: String, required: true },
    closed_at: { type: Date, required: true },
    created_at: { type: Date, required: true },
    updated_at: { type: Date, required: true},
    // TODO: Add enum for this
    author_association: {type: String, required: true},
    */

    const bulkGithubIssueInsertList = repositoryIssueList.map(
        (repositoryIssueObj, idx) => {
            return {
                repositoryId: repositoryId,
                id: repositoryIssueObj.id,
                htmlUrl: repositoryIssueObj.html_url,
                number: repositoryIssueObj.number,
                state: repositoryIssueObj.state,
                title: repositoryIssueObj.title,
                body: repositoryIssueObj.body,
                githubUserId: repositoryIssueObj.user.id,
                labels: JSON.stringify(repositoryIssueObj.labels),
                assignee: JSON.stringify(repositoryIssueObj.assignee),
                assignees: JSON.stringify(repositoryIssueObj.assignees),
                milestone: JSON.stringify(repositoryIssueObj.milestone),
                locked: repositoryIssueObj.locked,
                comments: repositoryIssueObj.comments,
                pullRequest: JSON.stringify(repositoryIssueObj.pull_request),
                closedAt: repositoryIssueObj.closed_at,
                createdAt: repositoryIssueObj.created_at,
                updatedAt: repositoryIssueObj.updated_at,
                authorAssociation: repositoryIssueObj.author_association,
            };
        }
    );

    if (bulkGithubIssueInsertList.length > 0) {
        var bulkInsertResult;

        await worker.send({
            action: "log",
            info: {
                level: "info",
                message: `GithubIssue - bulkGithubIssueInsertList.length: ${bulkGithubIssueInsertList.length}`,
                source: "worker-instance",
                function: "scrapeGithubRepoIssues",
            },
        });

        try {
            bulkInsertResult = await GithubIssue.insertMany(
                bulkGithubIssueInsertList,
                { rawResult: true }
            );
            /*
            await worker.send({action: 'log', info: {level: 'info',
                                                        message: `GithubIssue insertMany success - bulkInsertResult: ${JSON.stringify(bulkInsertResult)}`,
                                                        source: 'worker-instance',
                                                        function: 'scrapeGithubRepoIssues'}});
            */
        } catch (err) {
            await worker.send({
                action: "log",
                info: {
                    level: "error",
                    message: serializeError(err),
                    errorDescription: `GithubIssue insertMany failed - bulkGithubIssueInsertList: ${JSON.stringify(
                        bulkGithubIssueInsertList
                    )}`,
                    source: "worker-instance",
                    function: "scrapeGithubRepoIssues",
                },
            });

            throw new Error(
                `GithubIssue insertMany failed - bulkGithubIssueInsertList: ${JSON.stringify(
                    bulkGithubIssueInsertList
                )}`
            );
        }
    }

    // console.log('ISSUE LIST PAGE SPECIFIC LINK: ');
    // console.log(issueListPageResponse.headers.link);
};

module.exports = {
    scrapeGithubRepoIssues,
};
