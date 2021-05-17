const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const { serializeError, deserializeError } = require("serialize-error");

var LinkHeader = require("http-link-header");
const parseUrl = require("parse-url");
const queryString = require("query-string");

// const getUrls = require('get-urls');
const _ = require("lodash");

const Sentry = require("@sentry/node");

const GithubIssue = require("../../models/integrations/github/GithubIssue");
const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");
const IntegrationInterval = require("../../models/integrations/integration_objects/IntegrationInterval");
const IntegrationAttachment = require("../../models/integrations/integration_objects/IntegrationAttachment");
const PullRequest = require("../../models/PullRequest");

const { fetchAllInsertedRepositoryCommits } = require("../github/commit_utils");

const api = require("../../apis/api");

const { gql, rawRequest, request } = require("graphql-request");

const { printExecTime } = require('../print');

// const { GraphQLClient } = require('../../mod-graphql-request/dist');

const fetchScrapedIssues = async (insertedIssueIds) => {
    // Fetch Github Issue IntegrationTickets
 var scrapedIssues;
 try {
        scrapedIssues = await IntegrationTicket.find(
            {
                _id: {
                    $in: insertedIssueIds.map((id) => ObjectId(id.toString())),
                },
            },
            "_id githubIssueNumber githubIssueBody githubIssueClosedAt githubIssueCreatedAt githubIssueUpdatedAt"
        )
            .lean()
            .exec();
    } catch (err) {
        console.log(err);
        throw new Error(
            `Error finding scraped Github Issue Integration Tickets - insertedIssueIds.length - ${insertedIssueIds.length}`
        );
    }

    return scrapedIssues;
};

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
        }

        // Check if githubIssueCreatedAt and githubIssueUpdateAt dates are different, if so make an interval, otherwise continue
        else {
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
                            ObjectId(id.toString())
                        ),
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

// const generatePR


const generateIssueQuery = () => {
    const ISSUE_NUM = 100;
    const EVENT_NUM = 100;

    return gql`
    query getIssueLinkages($repoName: String!, $repoOwner: String!, $cursor: String) { 
        repository(name:$repoName, owner: $repoOwner) {
          issues(first: ${ISSUE_NUM}, after: $cursor) {
            nodes {
              number
              timelineItems(itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT, REFERENCED_EVENT, CROSS_REFERENCED_EVENT], first: ${EVENT_NUM}) {
                nodes {
                  ... on ReferencedEvent {
                    commit {
                      oid
                    }
                  }
                  ... on ConnectedEvent {
                    subject {
                      ... on Issue {
                        __typename
                        id
                        number
                      }
                      ... on PullRequest {
                        __typename
                        id
                        number
                      }
                    }
                  }
                  ... on DisconnectedEvent {
                    subject {
                      ... on Issue {
                        __typename
                        id
                        number
                      }
                      ... on PullRequest {
                        __typename
                        id
                        number
                      }
                    }
                  }
                  ... on CrossReferencedEvent {
                    isCrossRepository
                    source {
                      ... on Issue {
                        __typename
                        title
                        number
                      }
                      ... on PullRequest {
                        __typename
                        title
                        number
                      }
                    }
                    target {
                      ... on Issue {
                        __typename
                        title
                        number
                      }
                      ... on PullRequest {
                        __typename
                        title
                        number
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    `;
};

const getLinkedObjects = (issueEvents, prEvents) => {
    const issues = {};
    const prs = {};
    
    // Filter to PRs still linked
    prEvents.map((subject) => {
        if (prs.hasOwnProperty(subject.number)) {
            prs[subject.number]++;
        } else {
            prs[subject.number] = 1;
        }
    });

    // Filter to issues still linked
    issueEvents.map((subject) => {
        if (issues.hasOwnProperty(subject.number)) {
            issues[subject.number]++;
        } else {
            issues[subject.number] = 1;
        }
    });

    // Create final lists of currently-linked issues and PRs

    const linkedIssues = [];
    for (const [issue, count] of Object.entries(issues)) {
        if (count % 2 != 0) {
            linkedIssues.push(issue);
        }
    }

    const linkedPRs = [];
    for (const [pr, count] of Object.entries(prs)) {
        if (count % 2 != 0) {
            linkedPRs.push(pr);
        }
    }

    return { linkedIssues, linkedPRs };
}

const getGithubIssueLinkages = async (
    installationId,
    repositoryObj,
    public = false
    ) => {

    var repoOwner = repositoryObj.fullName.split("/")[0];
    var repoName = repositoryObj.fullName.split("/")[1];

    var query = generateIssueQuery(repoName, repoOwner);

    var hasNextPage = true;
    var queryResponse;

    var issueLinkages = [];

    var variables = { "repoName": repoName, "repoOwner": repoOwner };

    var cursor = undefined;

    var total_issues_scraped = 0;


    var client;
    if (public) {
        client = api.requestPublicGraphQLClient();
    }
    else {
        try {
            client = await api.requestInstallationGraphQLClient(
                installationId
            );
        } catch (err) {
            Sentry.setContext("getGithubIssueLinkages", {
                message: `Failed to get installation GraphQL client`,
                installationId: installationId,
            });

            Sentry.captureException(err);

            throw err;
        }
    }

    var issuesWithLinkedPRs = 0;
    var issuesWithLinkedIssues = 0;

    while (hasNextPage) {
        if (cursor) {
            variables.cursor = cursor;
        }
        queryResponse = await client.request(query, variables);

        total_issues_scraped += queryResponse.repository.issues.nodes.length;


        // Iterate over list of Issues
        for (i = 0; i < queryResponse.repository.issues.nodes.length; i++) {
            var hasLinkedPRs = false;
            var hasLinkedIssues = false;

            var currentIssueObj = queryResponse.repository.issues.nodes[i];

            var currentLinkageObj = { issueNumber: currentIssueObj.number, commitLinkages: [] };

            // Used for Connected/Disconnected Events
            var issueEvents = [];
            var prEvents = [];

            // Used for CrossReferencedEvent
            var referencingIssues = [];
            var referencingPrs = [];


            // Iterate over list of timelineItems
            for (k = 0; k < currentIssueObj.timelineItems.nodes.length; k++) {
                var currentTimelineItem = currentIssueObj.timelineItems.nodes[k];

                // Handle 'ReferencedEvent' (Commit Referencing Issue)
                if (currentTimelineItem.commit) {
                    currentLinkageObj.commitLinkages.push(currentTimelineItem.commit.oid);
                }

                // Handle 'ConnectedEvent' & 'DisconnectedEvent'
                if (currentTimelineItem.hasOwnProperty("subject")) {
                    // The event is related to a PR
                    if (currentTimelineItem.subject.__typename == "PullRequest") {
                        prEvents.push(currentTimelineItem.subject);
                    }
        
                    // The event is related to an issue
                    else if (currentTimelineItem.subject.__typename == "Issue") {
                        issueEvents.push(currentTimelineItem.subject);
                    }
                }

                // Handle 'CrossReferencedEvent'
                if (currentTimelineItem.hasOwnProperty("isCrossRepository")) {
                    // console.log("FOUND ");
                    if (currentTimelineItem.isCrossRepository == false) {
                        if (currentTimelineItem.source.__typename == "PullRequest") {
                            referencingPrs.push(currentTimelineItem.source.number);
                        }
                        else if (currentTimelineItem.source.__typename == "Issue") {
                            referencingIssues.push(currentTimelineItem.source.number);
                        }
                    }
                }
            }

            // Create final lists of currently-linked issues and PRs

            var { linkedIssues, linkedPRs } = getLinkedObjects(issueEvents, prEvents);

            linkedIssues = linkedIssues.map(Number);
            linkedPRs = linkedPRs.map(Number);

            // Merge linkedIssues with referencingIssues
            linkedIssues = [ ...new Set(linkedIssues.concat(referencingIssues)) ];

            // Merge linkedPRs with referencingPrs
            linkedPRs = [ ...new Set(linkedPRs.concat(referencingPrs)) ];


            if (linkedIssues.length > 0 && hasLinkedIssues == false) {
                hasLinkedIssues = true;
            }

            if (linkedPRs.length > 0 && hasLinkedPRs == false) {
                hasLinkedPRs = true;
            }


            currentLinkageObj.issueLinkages = linkedIssues;
            currentLinkageObj.prLinkages = linkedPRs;

            issueLinkages.push(currentLinkageObj);

            if (hasLinkedIssues == true) {
                issuesWithLinkedIssues += 1;
            }

            if (hasLinkedPRs == true) {
                issuesWithLinkedPRs += 1;
            }

        }

        hasNextPage = queryResponse.repository.issues.pageInfo.hasNextPage;
        if (hasNextPage) {
            cursor = queryResponse.repository.issues.pageInfo.endCursor;
        }
    }

    console.log(`Total issues Scraped: ${total_issues_scraped}`);

    console.log(`${issuesWithLinkedIssues} Issues with linked Issues`);
    console.log(`${issuesWithLinkedPRs} Issues with linked PRs`);

    return issueLinkages;

}


const getGithubIssueLinkagesFromMarkdown = (issueObj) => {
    const regex = /[#][0-9]+/g;

    var foundMatches = issueObj.githubIssueBody.match(regex);

    if (foundMatches == null) {
        foundMatches = [];
    }

    return {
        issueNumber: issueObj.githubIssueNumber,
        linkages: foundMatches.map((e) => e.replace(/\D/g, "")),
    };
};

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
                if (issueToCommitMap.hasOwnProperty(issueNum)) {
                    issueToCommitMap[issueNum].push(referencesObj.commitSha);
                }
                else {
                    issueToCommitMap[issueNum] = [referencesObj.commitSha];
                }
            }
        });
    });


    var finalResult = [];


    // Ensure no duplicate commit shas for one issue

    Object.entries(issueToCommitMap).forEach(function([key, value]) {
        console.log(`${key} ${value}`);
    });

    issueToCommitMap = Object.fromEntries(Object.entries(issueToCommitMap).map(([k, v]) => [k, [...new Set(v)]]))
    /*
    issueToCommitMap = issueToCommitMap.map(shaList => {
        [...new Set(shaList)]
    });
    */



    return issueToCommitMap;

};


const fetchIntegrationAttachments = async (
    attachmentsToCreate,
    repositoryId,
    modelType
) => {
    if (attachmentsToCreate.length < 1) {
        return [];
    }

    /*
    console.log('Fetching Integration Attachments - attachmentsToCreate: ');
    console.log(attachmentsToCreate);

    console.log("Before toString(): ");
    console.log(attachmentsToCreate[0].nonCodeId.toString())

    console.log("After toString(): ");
    console.log(attachmentsToCreate[0].nonCodeId.toString());
    */

    return await IntegrationAttachment.find(
        {
            repository: repositoryId,
            modelType: modelType,
            sourceId: { $in: attachmentsToCreate.map((obj) => obj.sourceId) },
            nonCodeId: {
                $in: attachmentsToCreate.map((obj) =>
                    ObjectId(obj.nonCodeId.toString())
                ),
            },
        },
        "_id nonCodeId"
    )
        .lean()
        .exec();
};

const addAttachmentsToIntegrationTickets = async (insertedAttachments) => {
    // Add to `attachments` field of IntegrationTicket

    let bulkUpdateIntegrationTickets = insertedAttachments.map(
        (attachmentObj) => {
            return {
                updateOne: {
                    filter: {
                        _id: ObjectId(attachmentObj.nonCodeId.toString()),
                    },
                    // Where field is the field you want to update
                    update: {
                        $push: {
                            attachments: ObjectId(attachmentObj._id.toString()),
                        },
                    },
                    upsert: false,
                },
            };
        }
    );

    // mongoose bulkwrite for one many update db call
    try {
        await IntegrationTicket.bulkWrite(bulkUpdateIntegrationTickets);
    } catch (err) {
        Sentry.captureException(err);
        throw err;
    }
};

const generateDirectAttachmentsFromIssues = async (
    issueLinkages,
    scrapedIssues,
    repositoryObj
) => {
    var attachmentsToCreate = [];

    var currentIssueLinkages = [];
    var i = 0;

    for (i = 0; i < issueLinkages.length; i++) {
        currentIssueLinkages = issueLinkages[i].issueLinkages;

        var k = 0;
        for (k = 0; k < currentIssueLinkages.length; k++) {
            var scrapedIssueIdx = scrapedIssues.findIndex(
                (issueObj) =>
                    issueObj.githubIssueNumber == issueLinkages[i].issueNumber
            );

            if (scrapedIssueIdx < 0) {
                continue;
            }

            attachmentsToCreate.push({
                modelType: "issue",
                sourceId: currentIssueLinkages[k],
                repository: repositoryObj._id.toString(),
                link: `${repositoryObj.htmlUrl}/issues/${currentIssueLinkages[k]}`,
                nonCodeId: scrapedIssues[scrapedIssueIdx]._id,
            });
        }
    }

    // Create/Insert IntegrationAttachments
    if (attachmentsToCreate.length > 0) {
        let bulkUpdateAttachmentsOps = attachmentsToCreate.map(
            (attachmentObj) => {
                return {
                    updateOne: {
                        filter: {
                            repository: ObjectId(attachmentObj.repository),
                            modelType: attachmentObj.modelType,
                            sourceId: attachmentObj.sourceId,
                            link: attachmentObj.link,
                            nonCodeId: attachmentObj.nonCodeId,
                        },
                        // Where field is the field you want to update
                        update: {
                            $set: {
                                attachmentObj,
                            },
                        },
                        upsert: true,
                    },
                };
            }
        );

        try {
            await IntegrationAttachment.bulkWrite(bulkUpdateAttachmentsOps);
        } catch (err) {
            console.log(err);
            Sentry.captureException(err);
            throw err;
        }

        // Fetch inserted IntegrationAttachments
        var insertedAttachments = [];
        try {
            insertedAttachments = await fetchIntegrationAttachments(
                attachmentsToCreate,
                repositoryObj._id.toString(),
                "issue"
            );
        } catch (err) {
            Sentry.captureException(err);
            throw err;
        }

        console.log(`generateDirectAttachmentsFromIssues - insertedAttachments.length: ${insertedAttachments.length}`);

        // Add to `attachments` field of IntegrationTicket

        try {
            await addAttachmentsToIntegrationTickets(insertedAttachments);
        } catch (err) {
            Sentry.captureException(err);
            throw err;
        }
    }
};

const generateDirectAttachmentsFromPRs = async (
    issueLinkages,
    scrapedIssues,
    repositoryObj
) => {
    var attachmentsToCreate = [];

    var currentPRLinkages = [];
    var i = 0;

    for (i = 0; i < issueLinkages.length; i++) {
        currentPRLinkages = issueLinkages[i].prLinkages;

        var k = 0;
        for (k = 0; k < currentPRLinkages.length; k++) {
            var scrapedIssueIdx = scrapedIssues.findIndex(
                (issueObj) =>
                    issueObj.githubIssueNumber == issueLinkages[i].issueNumber
            );

            if (scrapedIssueIdx < 0) {
                continue;
            }

            attachmentsToCreate.push({
                modelType: "pullRequest",
                sourceId: currentPRLinkages[k],
                repository: repositoryObj._id.toString(),
                link: `${repositoryObj.htmlUrl}/pull/${currentPRLinkages[k]}`,
                nonCodeId: scrapedIssues[scrapedIssueIdx]._id,
            });
            // console.log(`Setting nonCodeId to: ${scrapedIssues[scrapedIssueIdx]._id}`);
        }
    }

    // Create/Insert IntegrationAttachments
    if (attachmentsToCreate.length > 0) {
        let bulkUpdateAttachmentsOps = attachmentsToCreate.map(
            (attachmentObj) => {
                return {
                    updateOne: {
                        filter: {
                            repository: ObjectId(attachmentObj.repository),
                            modelType: attachmentObj.modelType,
                            sourceId: attachmentObj.sourceId,
                            link: attachmentObj.link,
                            nonCodeId: attachmentObj.nonCodeId,
                        },
                        // Where field is the field you want to update
                        update: {
                            $set: {
                                attachmentObj,
                            },
                        },
                        upsert: true,
                    },
                };
            }
        );

        try {
            await IntegrationAttachment.bulkWrite(bulkUpdateAttachmentsOps);
        } catch (err) {
            console.log("IntegrationAttachment.bulkWrite failed");
            console.log(err);
            Sentry.captureException(err);
            throw err;
        }

        // Fetch inserted IntegrationAttachments
        var insertedAttachments = [];
        try {
            insertedAttachments = await fetchIntegrationAttachments(
                attachmentsToCreate,
                repositoryObj._id.toString(),
                "pullRequest"
            );
        } catch (err) {
            console.log("fetchIntegrationAttachments failed");
            Sentry.captureException(err);
            throw err;
        }

        console.log(`generateDirectAttachmentsFromPRs - insertedAttachments.length: ${insertedAttachments.length}`);

        // Add to `attachments` field of IntegrationTicket

        try {
            await addAttachmentsToIntegrationTickets(insertedAttachments);
        } catch (err) {
            Sentry.captureException(err);
            throw err;
        }
    }
};
/*
const generateDirectAttachmentsFromCommits = async (
    issueLinkages,
    scrapedIssues,
    repositoryObj
) => {
    var attachmentsToCreate = [];

    var currentCommitLinkages = [];
    var i = 0;

    for (i = 0; i < issueLinkages.length; i++) {
        console.log(`generateDirectAttachmentsFromCommits - issueLinkages[i]: ${JSON.stringify(issueLinkages[i])}`);
        currentCommitLinkages = issueLinkages[i].commitLinkages;

        var k = 0;
        for (k = 0; k < currentCommitLinkages.length; k++) {
            var scrapedIssueIdx = scrapedIssues.findIndex(
                (issueObj) =>
                    issueObj.githubIssueNumber == issueLinkages[i].issueNumber
            );

            if (scrapedIssueIdx < 0) {
                continue;
            }

            attachmentsToCreate.push({
                modelType: "commit",
                sourceId: currentCommitLinkages[k],
                repository: repositoryObj._id.toString(),
                link: `${repositoryObj.htmlUrl}/commit/${currentCommitLinkages[k]}`,
                nonCodeId: scrapedIssues[scrapedIssueIdx]._id,
            });
        }
    }

    // Create/Insert IntegrationAttachments
    if (attachmentsToCreate.length > 0) {
        let bulkUpdateAttachmentsOps = attachmentsToCreate.map(
            (attachmentObj) => {
                return {
                    updateOne: {
                        filter: {
                            repository: ObjectId(attachmentObj.repository),
                            modelType: attachmentObj.modelType,
                            sourceId: attachmentObj.sourceId,
                            link: attachmentObj.link,
                            nonCodeId: attachmentObj.nonCodeId,
                        },
                        // Where field is the field you want to update
                        update: {
                            $set: {
                                attachmentObj,
                            },
                        },
                        upsert: true,
                    },
                };
            }
        );

        try {
            await IntegrationAttachment.bulkWrite(bulkUpdateAttachmentsOps);
        } catch (err) {
            console.log(err);
            Sentry.captureException(err);
            throw err;
        }

        // Fetch inserted IntegrationAttachments
        var insertedAttachments = [];
        try {
            insertedAttachments = await fetchIntegrationAttachments(
                attachmentsToCreate,
                repositoryObj._id.toString(),
                "commit"
            );
        } catch (err) {
            Sentry.captureException(err);
            throw err;
        }

        console.log(
            "generateDirectAttachmentsFromCommits - insertedAttachments: "
        );
        console.log(insertedAttachments);

        // Add to `attachments` field of IntegrationTicket

        try {
            await addAttachmentsToIntegrationTickets(insertedAttachments);
        } catch (err) {
            Sentry.captureException(err);
            throw err;
        }
    }
};
*/

const generateDirectAttachmentsFromMarkdown = async (
    issueLinkages,
    scrapedIssues,
    repositoryObj
) => {
    // Fetch All PRs from Set of numbers in linkages arrays

    var linkedIssueNumbers = new Set();

    var currentMarkdownLinkages;
    var i = 0;

    for (i = 0; i < issueLinkages.length; i++) {
        currentMarkdownLinkages = issueLinkages[i].markdownLinkages;
        var k = 0;

        for (k = 0; k < currentMarkdownLinkages.linkages.length; k++) {
            linkedIssueNumbers.add(currentMarkdownLinkages.linkages[k]);
        }
    }

    console.log("Unique Markdown Issue Numbers: ");
    console.log(linkedIssueNumbers);

    // No markdown links, return
    if (Array.from(linkedIssueNumbers).length < 1) {
        return;
    }

    // Fetch all possible Pull Requests

    var linkedPRs = [];

    try {
        linkedPRs = await PullRequest.find({
            number: { $in: Array.from(linkedIssueNumbers) },
            repository: repositoryObj._id,
        })
            .lean()
            .exec();
    } catch (err) {
        Sentry.captureException(err);
        throw err;
    }

    var markdownIssueLinkages = [];
    var markdownPRLinkages = [];

    // Match onto PR, and split into two lists of linked PRs and linked Issues
    for (i = 0; i < issueLinkages.length; i++) {
        var currentMarkdownPRLinkages = [];
        var currentMarkdownIssueLinkages = [];

        currentMarkdownLinkages = issueLinkages[i].markdownLinkages;
        var k = 0;

        for (k = 0; k < currentMarkdownLinkages.linkages.length; k++) {
            var linkedPRsIdx = linkedPRs.findIndex(
                (prObj) => prObj.number == currentMarkdownLinkages.linkages[k]
            );

            // If no matching PR, add to markdownIssueLinkages
            if (linkedPRsIdx < 0) {
                currentMarkdownIssueLinkages.push(
                    currentMarkdownLinkages.linkages[k]
                );
            } else {
                currentMarkdownPRLinkages.push(
                    currentMarkdownLinkages.linkages[k]
                );
            }
        }

        markdownIssueLinkages.push({
            issueNumber: issueLinkages[i].issueNumber,
            issueLinkages: currentMarkdownIssueLinkages,
        });
        markdownPRLinkages.push({
            issueNumber: issueLinkages[i].issueNumber,
            prLinkages: currentMarkdownPRLinkages,
        });
    }

    /*
    console.log("markdownPRLinkages.length(0, 5): ");
    console.log(markdownPRLinkages.slice(0, 5));

    console.log("markdownIssueLinkages.slice(0, 5): ");
    console.log(markdownIssueLinkages.slice(0, 5));
    */

    try {
        await generateDirectAttachmentsFromIssues(
            markdownIssueLinkages,
            scrapedIssues,
            repositoryObj
        );
    } catch (err) {
        Sentry.captureException(err);
        throw err;
    }

    try {
        await generateDirectAttachmentsFromPRs(
            markdownPRLinkages,
            scrapedIssues,
            repositoryObj
        );
    } catch (err) {
        Sentry.captureException(err);
        throw err;
    }
};

const generateDirectAttachmentsFromLinkages = async (
    issueLinkages,
    scrapedIssues,
    repositoryObj
) => {
    if (issueLinkages.length < 1) {
        return;
    }

    // 5 possible sources of linkages:
    //      issueLinkages[x].issueLinkages
    //      issueLinkages[x].prLinkages
    //      issueLinkages[x].commitLinkages
    //      issueLinkages[x].markdownLinkages

    // Handle issueLinkages[x].issueLinkages
    try {
        await generateDirectAttachmentsFromIssues(
            issueLinkages,
            scrapedIssues,
            repositoryObj
        );
    } catch (err) {
        Sentry.captureException(err);
        throw err;
    }

    // Handle issueLinkages[x].prLinkages
    try {
        await generateDirectAttachmentsFromPRs(
            issueLinkages,
            scrapedIssues,
            repositoryObj
        );
    } catch (err) {
        Sentry.captureException(err);
        throw err;
    }

    /*
    // Handle issueLinkages[x].commitLinkages
    try {
        await generateDirectAttachmentsFromCommits(
            issueLinkages,
            scrapedIssues,
            repositoryObj
        );
    } catch (err) {
        Sentry.captureException(err);
        throw err;
    }
    */

    
    // Handle issueLinkages[x].markdownLinkages
    try {
        await generateDirectAttachmentsFromMarkdown(
            issueLinkages,
            scrapedIssues,
            repositoryObj
        );
    } catch (err) {
        Sentry.captureException(err);
        throw err;
    }
    
};

scrapeGithubRepoIssues = async (
    installationId,
    repositoryId,
    installationClient,
    repositoryObj,
    workspaceId,
    integrationBoardId,
    public = false,
) => {
    // TEST ISSUE SCRAPING

    // GET /repos/{owner}/{repo}/issues

    var start = process.hrtime();

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
                `/repos/${repositoryObj.fullName}/issues?state=all&per_page=${pageSize}&page=${pageNum}`
            );
        } catch (err) {

            console.log(err);

            Sentry.setContext("scrapeGithubRepoIssues", {
                message: `GET Github Repository Issues failed`,
                fullURL: `/repos/${repositoryObj.fullName}/issues?state=all&per_page=${pageSize}&page=${pageNum}`,
                installationId: installationId,
                repositoryId: repositoryObj._id.toString(),
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
                    message: `GET Github Repository Issues - Failed to parse link header`,
                    fullURL: `/repos/${repositoryObj.fullName}/issues?state=all&per_page=${pageSize}&page=${pageNum}`,
                    installationId: installationId,
                    repositoryId: repositoryObj._id.toString(),
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

    printExecTime(process.hrtime(start), `scrapeAllIssues("${repositoryObj.fullName}")`);


    foundIssueList = foundIssueList.flat();

    var repositoryIssueList = foundIssueList;

    // Bulk create IntegrationTicket models for all Objects found

    // Filter Out Issues that are PullRequests
    repositoryIssueList = repositoryIssueList.filter(
        (issueObj) => !issueObj.pull_request
    );

    /*
        // Github Issue specific fields
        repositoryId: repositoryId,
        // id: repositoryIssueObj.id, --> sourceId
        githubIssueHtmlUrl: { type: String },
        githubIssueNumber: { type: Number },
        githubIssueState: { type: String },
        githubIssueTitle: { type: String },
        githubIssueBody:  { type: String },
        githubIssueUserId: { type: String },
        githubIssueLabels: [{ type: String }],
        githubIssueLocked: { type: String },
        githubIssueCommentNumber: { type: Number },
        githubIssueClosedAt: { type: Date },
        githubIssueCreatedAt: { type: Date },
        githubIssueUpdatedAt:{ type: Date },
        githubIssueAuthorAssociation: { type: String },
    */

    var bulkGithubIssueInsertList = repositoryIssueList.map(
        (repositoryIssueObj, idx) => {
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

    if (bulkGithubIssueInsertList.length > 0) {

        var start = process.hrtime();
        var bulkInsertResult;
        var newTicketIds;

        console.log(`GithubIssue - bulkGithubIssueInsertList.length: ${bulkGithubIssueInsertList.length}`);

        try {
            bulkInsertResult = await IntegrationTicket.insertMany(
                bulkGithubIssueInsertList,
                { rawResult: true }
            );

            newTicketIds = Object.values(
                bulkInsertResult.insertedIds
            ).map((id) => id.toString());

            // console.log(`GithubIssue insertMany success - bulkInsertResult: ${JSON.stringify(bulkInsertResult)}`);

        } catch (err) {
            console.log(err);

            Sentry.setContext("scrapeGithubRepoIssues", {
                message: `IntegrationTicket{source = "github"} insertMany failed`,
                installationId: installationId,
                repositoryId: repositoryObj._id.toString(),
                attemptedInsertNum: bulkGithubIssueInsertList.length,
            });
    
            Sentry.captureException(err);
    
            throw err;
        }

        printExecTime(process.hrtime(start), `insertAllIssues("${repositoryObj.fullName}")`);


        var scrapedIssues;
        try {
            scrapedIssues = await fetchScrapedIssues(newTicketIds);
        } catch (err) {
            console.log(err);
            Sentry.setContext("scrapeGithubRepoIssues", {
                message: `Error fetching Scraped GithubIssues`,
                installationId: installationId,
                repositoryId: repositoryObj._id.toString(),
                numToFetch: newTicketIds.length,
            });
    
            Sentry.captureException(err);
    
            throw err;
        }

        /*
        // Create IntegrationIntervals for scraped Issues
        try {
            await createGithubIssueIntervals(scrapedIssues);
        } catch (err) {
            console.log(err);
            Sentry.setContext("scrapeGithubRepoIssues", {
                message: `GithubIssue create IntegrationIntervals failed`,
                installationId: installationId,
                repositoryId: repositoryObj._id.toString(),
                numScrapedIssues: scrapedIssues.length,
            });
    
            Sentry.captureException(err);
    
            throw err;
        }
        */

        // console.log("scrapedIssues: ");
        // console.log(scrapedIssues);

        var start = process.hrtime();
        var issueLinkages;
        try {
            issueLinkages = await getGithubIssueLinkages(installationId, repositoryObj, public);
         }
         catch (err) {
             console.log(err);
             Sentry.setContext("scrapeGithubRepoIssues", {
                 message: `GithubIssue getGithubIssueLinkages failed`,
                 installationId: installationId,
                 repositoryId: repositoryObj._id.toString(),
             });
     
             Sentry.captureException(err);
 
             throw err;
         }

        printExecTime(process.hrtime(start), `getGithubIssueLinkages("${repositoryObj.fullName}")`);



        // Get any linkages from markdown
        scrapedIssues.map((issueObj) => {
            var issueLinkagesIdx = issueLinkages.findIndex((linkageObj) =>
                linkageObj.issueNumber == issueObj.githubIssueNumber
            );

            issueLinkages[issueLinkagesIdx].markdownLinkages = getGithubIssueLinkagesFromMarkdown(issueObj);

            // markdownLinkages.push(getGithubIssueLinkagesFromMarkdown(issueObj));
        });




        // Get linkages from Commit messages

        // Fetch all Repository Commits
        var insertedCommits;
        try {
           insertedCommits =  await fetchAllInsertedRepositoryCommits(repositoryObj._id.toString(), "_id sourceId commitMessage");
        }
        catch (err) {
            console.log(err);
            Sentry.setContext("scrapeGithubRepoIssues", {
                message: `GithubIssue fetchAllInsertedRepositoryCommits failed`,
                installationId: installationId,
                repositoryId: repositoryObj._id.toString(),
            });
    
            Sentry.captureException(err);

            throw err;
        }

        // Generate all Issue <-> Commit mappings from commit messages
        var issueCommitMap;
        try {
            issueCommitMap = getGithubIssueLinkagesFromCommitMessages(scrapedIssues, insertedCommits);
        }
        catch (err) {
            console.log(err);
            Sentry.setContext("scrapeGithubRepoIssues", {
                message: `GithubIssue getGithubIssueLinkagesFromCommitMessages failed`,
                installationId: installationId,
                repositoryId: repositoryObj._id.toString(),
                numScrapedIssues: scrapedIssues.length,
                numInsertedCommits: insertedCommits.length,
            });
    
            Sentry.captureException(err);

            throw err;
        }

        // Map linkages from commit messages
        // Adding list of shas to Issues from referencing Commits and
        // merge with issueLinkages[x].commitLinkages
        if (issueCommitMap) {
            scrapedIssues.map((issueObj) => {
                var issueLinkagesIdx = issueLinkages.findIndex((linkageObj) => linkageObj.issueNumber == issueObj.githubIssueNumber);
                if (issueCommitMap[issueObj.githubIssueNumber]) {
                    issueLinkages[issueLinkagesIdx].commitLinkages = [ ...new Set(issueLinkages[issueLinkagesIdx].commitLinkages.concat(issueCommitMap[issueObj.githubIssueNumber])) ];
                }
            });
        }



        // console.log("issueLinkages.slice(0, 5): ");
        // console.log(issueLinkages.slice(0, 5));

        try {
            await generateDirectAttachmentsFromLinkages(
                issueLinkages,
                scrapedIssues,
                repositoryObj
            );
        } catch (err) {
            Sentry.captureException(err);
            throw err;
        }
    }
};

module.exports = {
    scrapeGithubRepoIssues,
};
