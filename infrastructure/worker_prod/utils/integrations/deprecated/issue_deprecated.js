
// NOT IN USE
const createGithubIssueIntervals = async (scrapedIssues) => {
    var integrationIntervalsToCreate = [];

    var currentIssue;
    var i = 0;
    for (i = 0; i < scrapedIssues.length; i++) {
        currentIssue = scrapedIssues[i];
        // Create IntegrationInterval using githubIssueCreatedAt & githubIssueClosedAt
        if (
            currentIssue.githubIssueClosedAt &&
            currentIssue.githubIssueClosedAt != null &&
            currentIssue.githubIssueClosedAt != "null"
        ) {
            integrationIntervalsToCreate.push({
                integrationTicket: currentIssue._id,
                start: currentIssue.githubIssueCreatedAt,
                end: currentIssue.githubIssueClosedAt,
            });
        } else {
            // Check if githubIssueCreatedAt and githubIssueUpdateAt dates are different, if so make an interval, otherwise continue

            if (
                currentIssue.githubIssueCreatedAt.toString() !=
                currentIssue.githubIssueUpdatedAt.toString()
            ) {
                integrationIntervalsToCreate.push({
                    integrationTicket: currentIssue._id,
                    start: currentIssue.githubIssueCreatedAt,
                    end: currentIssue.githubIssueUpdatedAt,
                });
            } else {
                continue;
            }
        }
    }

    if (integrationIntervalsToCreate.length > 0) {
        var insertResults;
        var insertedIntervalIds;

        // Create IntegrationIntervals
        try {
            insertResults = await IntegrationInterval.insertMany(
                integrationIntervalsToCreate,
                { rawResult: true }
            );

            console.log(
                "IntegrationInterval.insertMany.insertResults.insertedIds"
            );
            console.log(insertResults.insertedIds);

            insertedIntervalIds = Object.values(
                insertResults.insertedIds
            ).map((id) => id.toString());
        } catch (err) {
            console.log(err);
            throw new Error(
                `Error could not insert IntegrationIntervals - integrationIntervalsToCreate.length: ${integrationIntervalsToCreate.length}`
            );
        }

        // Fetch new IntegrationIntervals

        var insertedIntervals;
        try {
            insertedIntervals = await IntegrationInterval.find(
                {
                    _id: {
                        $in: insertedIntervalIds.map((id) =>
                            ObjectId(id.toString())),
                    },
                },
                "_id integrationTicket"
            )
                .lean()
                .exec();
        } catch (err) {
            console.log(err);
            throw new Error(
                `Error finding inserted IntegrationIntervals - insertedIntervalIds.length - ${insertedIntervalIds.length}`
            );
        }

        // Update IntegrationTickets with IntegrationIntervals

        let bulkUpdateIntegrationTicketsOps = insertedIntervals.map(
            (intervalObj) => {
                return {
                    updateOne: {
                        filter: {
                            _id: ObjectId(
                                intervalObj.integrationTicket.toString()
                            ),
                        },
                        // Where field is the field you want to update
                        update: {
                            $push: {
                                intervals: ObjectId(intervalObj._id.toString()),
                            },
                        },
                        upsert: false,
                    },
                };
            }
        );

        // mongoose bulkwrite for one many update db call
        try {
            await IntegrationTicket.bulkWrite(bulkUpdateIntegrationTicketsOps);
        } catch (err) {
            console.log(err);
            throw new Error(
                "createGithubIssueIntervals Error: bulk update of IntegrationTickets failed"
            );
        }
    }
};

// DEPRECATED
const getGithubIssueLinkagesFromCommit = (commitObj) => {
    const regex = /[#][0-9]+/g;

    var foundMatches = commitObj.commitMessage.match(regex);

    if (foundMatches == null) {
        foundMatches = [];
    }

    return {
        commitSha: commitObj.sourceId,
        linkages: foundMatches.map((e) => e.replace(/\D/g, "")),
    };
};

// DEPRECATED
const getGithubIssueLinkagesFromCommitMessages = async (scrapedIssues, insertedCommits) => {

    var issueToCommitMap = {};

    var allCommitIssueReferences = [];

    var distinctIssueNumbers = new Set(scrapedIssues.map(issueObj => issueObj.githubIssueNumber));


    // Get posible Issues references in each Commit
    insertedCommits.map(commitObj => {
        allCommitIssueReferences.push(getGithubIssueLinkagesFromCommit(commitObj));
    });

    // Filter by Issues that actually exist
    // and
    // Create mapping of issue number to commit sha's referencing given issue
    allCommitIssueReferences.map(referencesObj => {
        referencesObj.linkages.map(issueNum => {
            if (distinctIssueNumbers.has(issueNum)) {
                if (Object.prototype.hasOwnProperty.call(issueToCommitMap, issueNum)) {
                    issueToCommitMap[issueNum].push(referencesObj.commitSha);
                } else {
                    issueToCommitMap[issueNum] = [referencesObj.commitSha];
                }
            }
        });
    });

    // Ensure no duplicate commit shas for one issue

    Object.entries(issueToCommitMap).forEach(function([key, value]) {
        console.log(`${key} ${value}`);
    });

    issueToCommitMap = Object.fromEntries(
        Object.entries(issueToCommitMap)
            .map(([k, v]) => [k, [...new Set(v)]])
    );
    /*
    issueToCommitMap = issueToCommitMap.map(shaList => {
        [...new Set(shaList)]
    });
    */



    return issueToCommitMap;

};

const fetchAllRepoIssuesAPI = async (installationId, installationClient, repositoryId, fullName, integrationBoardId, public=false) => {
    // GET /repos/{owner}/{repo}/issues

    var client = (public) ? api.requestPublicClient() : installationClient;

    var pageNum = 0;

    // 100 is max page size
    var pageSize = 100;

    // Default value of 10
    var lastPageNum = 10;

    var foundIssueList = [];
    var searchString;

    var issueListPageResponse;

    while (pageNum <= lastPageNum) {
        try {
            issueListPageResponse = await client.get(
                `/repos/${fullName}/issues?state=all&per_page=${pageSize}&page=${pageNum}`
            );
        } catch (err) {

            console.log(err);

            Sentry.setContext("scrapeGithubRepoIssues", {
                message: "GET Github Repository Issues failed",
                fullURL: `/repos/${fullName}/issues?state=all&per_page=${pageSize}&page=${pageNum}`,
                installationId: installationId,
                repositoryId: repositoryId.toString(),
            });
    
            Sentry.captureException(err);
    
            throw err;
        }

        if (!issueListPageResponse.headers.link) {
            pageNum = lastPageNum;
        } else {
            var link;
            try {
                link = LinkHeader.parse(issueListPageResponse.headers.link);
            } catch (err) {
                console.log(err);

                Sentry.setContext("scrapeGithubRepoIssues", {
                    message: "GET Github Repository Issues - Failed to parse link header",
                    fullURL: `/repos/${fullName}/issues?state=all&per_page=${pageSize}&page=${pageNum}`,
                    installationId: installationId,
                    repositoryId: repositoryId.toString(),
                    linkHeader: issueListPageResponse.headers.link,
                });
        
                Sentry.captureException(err);
        
                throw err;
            }

            var i;
            for (i = 0; i < link.refs.length; i++) {
                if (link.refs[i].rel == "last") {
                    searchString = parseUrl(link.refs[i].uri).search;

                    lastPageNum = queryString.parse(searchString).page;
                    break;
                }
            }
        }

        if (issueListPageResponse.data.length < 1) {
            break;
        }

        pageNum += 1;

        foundIssueList.push(issueListPageResponse.data);
    }

    foundIssueList = foundIssueList.flat();

    foundIssueList = foundIssueList.filter(
        (issueObj) => !issueObj.pull_request
    );


    foundIssueList = foundIssueList.map(
        (repositoryIssueObj) => {
            /*
        if ( idx < 2) {
            console.log(`Mapping Issue ${idx}`);
            console.log(repositoryIssueObj);
        }
        */

            return {
                repositoryId: repositoryId,
                board: integrationBoardId,

                name: repositoryIssueObj.title,
                sourceId: repositoryIssueObj.number,
                description: repositoryIssueObj.body,
                sourceCreationDate: repositoryIssueObj.created_at,
                sourceUpdateDate: repositoryIssueObj.updated_at,
                sourceCloseDate:
                    repositoryIssueObj.closed_at == null ||
                    repositoryIssueObj.closed_at == "null"
                        ? undefined
                        : repositoryIssueObj.closed_at,

                source: "github",
                githubIssueHtmlUrl: repositoryIssueObj.html_url,
                githubIssueNumber: repositoryIssueObj.number,
                githubIssueState: repositoryIssueObj.state,
                githubIssueTitle: repositoryIssueObj.title,
                githubIssueBody: repositoryIssueObj.body,
                // githubIssueUserId: repositoryIssueObj.user.id,
                githubIssueLabels: repositoryIssueObj.labels.map(
                    (labelObj) => labelObj.name
                ),
                githubIssueLocked: repositoryIssueObj.locked,
                githubIssueCommentNumber: repositoryIssueObj.comments,
                githubIssueClosedAt:
                    repositoryIssueObj.closed_at == null ||
                    repositoryIssueObj.closed_at == "null"
                        ? undefined
                        : repositoryIssueObj.closed_at,
                githubIssueCreatedAt: repositoryIssueObj.created_at,
                githubIssueUpdatedAt: repositoryIssueObj.updated_at,
                githubIssueAuthorAssociation:
                    repositoryIssueObj.author_association,
            };
        }
    );




    return foundIssueList;
};

/*
parseBodyAttachments = (issueList) => {
    issueList.map((issueObj) => {
        const { githubIssueBody, attachments } = issueObj;

        var urlTokens = getUrls(githubIssueBody);

        urlTokens = urlTokens.map((url) => {
            return { url: token };
        });

        issueObj.attachments = [...attachments, ...tokens];
    });

    return issueList;
};






const enrichGithubIssueDirectAttachments = async (issueList) => {

    issueList = issueList.map(issueObj => {
        return Object.assign({}, issueObj, { attachments: [] });
    });

    issueList = parseBodyAttachments(issueList);

    let insertOps = [];

    let seenUrls = new Set();

    issueList.map((issueObj) => {
        const { attachments } = issueObj;

        const modelTypeMap = {
            tree: "branch",
            issues: "issue",
            pull: "pullRequest",
            commit: "commit",
        };

        attachments.map((attachment) => {
            const { date, url, name } = attachment;

            if (
                !url ||
                !url.includes("https://github.com") ||
                seenUrls.has(url)
            )
                return;

            const splitURL = url.split("/");

            try {
                if (splitURL.length < 2) return null;

                let githubType = splitURL.slice(
                    splitURL.length - 2,
                    splitURL.length - 1
                )[0];

                const modelType = modelTypeMap[githubType];

                if (!modelType) return;

                const sourceId = splitURL.slice(splitURL.length - 1)[0];

                const fullName = splitURL
                    .slice(splitURL.length - 4, splitURL.length - 2)
                    .join("/");

                attachment = {
                    modelType,
                    link: url,
                    sourceId,
                };

                if (date) attachment.sourceCreationDate = new Date(date);

                
                //if (currentRepositories[fullName]) {
                //    attachment.repository = currentRepositories[fullName]._id;
                //}
                

                insertOps.push(attachment);

                seenUrls.add(url);
            } catch (err) {
                return null;
            }
        });
    });

    let attachments;

    try {
        attachments = await IntegrationAttachment.insertMany(insertOps);
    } catch (e) {
        console.log(e);
    }

    attachments = _.mapKeys(attachments, "link");

    cards.map((card) => {
        card.attachmentIds = card.attachments
            .map((attachment) => {
                const { url } = attachment;

                if (attachments[url]) {
                    return attachments[url]._id;
                }

                return null;
            })
            .filter((attachmentId) => attachmentId != null);
    });

}
*/