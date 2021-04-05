const Sentry = require("@sentry/node");


const handlePullRequestEvent = async (backendClient, event, githubEvent) => {
    console.log(`Pull Request '${event.body.action}' Event Received`);

    var prAction = event.body.action;

    if (prAction == 'opened') {

        var prObj = event.body.pull_request;

        var prCreateData = {
            pullRequestId: prObj.id,
            number: prObj.number,

            name: prObj.title,
            description: prObj.body,
            sourceId: prObj.number,
            // creator: NA,
    
            sourceCreationDate: prObj.created_at,
            sourceUpdateDate: prObj.updated_at,
            sourceCloseDate: prObj.closed_at,
    
            // branchLabelList -> NA,
            // branches -> NA,
    
            htmlUrl: prObj.html_url,
            issueUrl: prObj.issue_url,
            state: prObj.state,
            locked: prObj.locked,
            title: prObj.title,
            body: prObj.body,
            labels: prObj.labels,
            createdAt: prObj.created_at,
            updatedAt: prObj.updated_at,
            closedAt: prObj.closed_at,
            mergedAt: prObj.merged_at,
            mergeCommitSha: prObj.merge_commit_sha,
    
            headRef: prObj.head.ref,
            headLabel: prObj.head.label,
            headSha: prObj.head.sha,
    
            baseRef: prObj.base.ref,
            baseLabel: prObj.base.label,
            baseSha: prObj.base.sha,
    
            draft: prObj.draft,
            merged: prObj.merged,
            commentNum: prObj.comments,
            reviewCommentNum: prObj.review_comments,
            commitNum: prObj.commits,
            additionNum: prObj.additions,
            deletionNum: prObj.deletions,
            changedFileNum: prObj.changed_files,

        };

        var installationId = event.installation.id;
        var repositoryFullName = event.body.repository.full_name;

        var createPRResponse;

        try {
            createPRResponse = await backendClient.post("/pull_requests/create", {  installationId,
                                                                                    repositoryFullName,
                                                                                    prData: prCreateData
                                                                                });
        }
        catch (err) {

            console.log(err);

            Sentry.setContext("handlePullRequestEvent", {
                message: `Error Creating PR`,
                installationId: installationId,
                repositoryFullName: repositoryFullName,
                prNumber: prCreateData.number,
            });

            Sentry.captureException(err);

            throw err;
        }

    }
}

module.exports = {
    handlePullRequestEvent
}