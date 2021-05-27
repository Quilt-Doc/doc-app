const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;


var LinkHeader = require("http-link-header");
const parseUrl = require("parse-url");
const queryString = require("query-string");

// const getUrls = require('get-urls');
const _ = require("lodash");

const Sentry = require("@sentry/node");

const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");
// const IntegrationInterval = require("../../models/integrations/integration_objects/IntegrationInterval");
const IntegrationAttachment = require("../../models/integrations/integration_objects/IntegrationAttachment");
const PullRequest = require("../../models/PullRequest");

const api = require("../../apis/api");

const { gql, rawRequest, request } = require("graphql-request");

const { printExecTime } = require("../print");

const { getRequestLists } = require("../fetch_utils");

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
        if (Object.prototype.hasOwnProperty.call(prs, subject.number)) {
            prs[subject.number]++;
        } else {
            prs[subject.number] = 1;
        }
    });

    // Filter to issues still linked
    issueEvents.map((subject) => {
        if (Object.prototype.hasOwnProperty.call(issues, subject.number)) {
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
};

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
    } else {
        try {
            client = await api.requestInstallationGraphQLClient(
                installationId
            );
        } catch (err) {
            Sentry.setContext("getGithubIssueLinkages", {
                message: "Failed to get installation GraphQL client",
                installationId: installationId,
            });

            Sentry.captureException(err);

            throw err;
        }
    }

    var issuesWithLinkedPRs = 0;
    var issuesWithLinkedIssues = 0;
    var issuesWithLinkedCommits = 0;

    while (hasNextPage) {
        if (cursor) {
            variables.cursor = cursor;
        }
        queryResponse = await client.request(query, variables);

        total_issues_scraped += queryResponse.repository.issues.nodes.length;

        var i;

        // Iterate over list of Issues
        for (i = 0; i < queryResponse.repository.issues.nodes.length; i++) {
            var hasLinkedPRs = false;
            var hasLinkedIssues = false;
            var hasLinkedCommits = false;

            var currentIssueObj = queryResponse.repository.issues.nodes[i];

            var currentLinkageObj = { issueNumber: currentIssueObj.number, commitLinkages: [] };

            // Used for Connected/Disconnected Events
            var issueEvents = [];
            var prEvents = [];

            // Used for CrossReferencedEvent
            var referencingIssues = [];
            var referencingPrs = [];


            // Iterate over list of timelineItems
            for (var k = 0; k < currentIssueObj.timelineItems.nodes.length; k++) {
                var currentTimelineItem = currentIssueObj.timelineItems.nodes[k];

                // Handle 'ReferencedEvent' (Commit Referencing Issue)
                if (currentTimelineItem.commit) {
                    currentLinkageObj.commitLinkages.push(currentTimelineItem.commit.oid);
                    hasLinkedCommits = true;
                }

                // Handle 'ConnectedEvent' & 'DisconnectedEvent'
                if (Object.prototype.hasOwnProperty.call(currentTimelineItem, "subject")) {
                    // The event is related to a PR
                    if (currentTimelineItem.subject.__typename == "PullRequest") {
                        prEvents.push(currentTimelineItem.subject);
                    } else if (currentTimelineItem.subject.__typename == "Issue") {
                        // The event is related to an issue
                        issueEvents.push(currentTimelineItem.subject);
                    }
                }

                // Handle 'CrossReferencedEvent'
                if (Object.prototype.hasOwnProperty.call(currentTimelineItem, "isCrossRepository")) {
                    // console.log("FOUND ");
                    if (currentTimelineItem.isCrossRepository == false) {
                        if (currentTimelineItem.source.__typename == "PullRequest") {
                            referencingPrs.push(currentTimelineItem.source.number);
                        } else if (currentTimelineItem.source.__typename == "Issue") {
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
            linkedIssues = [...new Set(linkedIssues.concat(referencingIssues))];

            // Merge linkedPRs with referencingPrs
            linkedPRs = [...new Set(linkedPRs.concat(referencingPrs))];


            if (linkedIssues.length > 0 && hasLinkedIssues == false) {
                hasLinkedIssues = true;
            }

            if (linkedPRs.length > 0 && hasLinkedPRs == false) {
                hasLinkedPRs = true;
            }

            currentLinkageObj.issueLinkages = linkedIssues;
            currentLinkageObj.prLinkages = linkedPRs;
            currentLinkageObj.commitLinkages = [...new Set(currentLinkageObj.commitLinkages)];

            issueLinkages.push(currentLinkageObj);

            if (hasLinkedIssues == true) {
                issuesWithLinkedIssues += 1;
            }

            if (hasLinkedPRs == true) {
                issuesWithLinkedPRs += 1;
            }

            if (hasLinkedCommits == true) {
                issuesWithLinkedCommits += 1;
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
    console.log(`${issuesWithLinkedCommits} Issues with linked Commits`);

    return issueLinkages;

};


const getGithubIssueLinkagesFromMarkdown = (issueObj) => {
    const regex = /[#][0-9]+/g;

    // console.log(`Finding Issue Linkages for Issue #${issueObj.githubIssueNumber}`);

    var foundMatches;
    
    if (issueObj.githubIssueBody == null) {
        foundMatches = [];
    } else {
        foundMatches = issueObj.githubIssueBody.match(regex);
    }

    if (foundMatches == null) {
        foundMatches = [];
    }

    return {
        issueNumber: issueObj.githubIssueNumber,
        linkages: foundMatches.map((e) => e.replace(/\D/g, "")),
    };
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
                    ObjectId(obj.nonCodeId.toString())),
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

const generateDirectAttachmentsFromCommits = async (
    issueLinkages,
    scrapedIssues,
    repositoryObj
) => {
    var attachmentsToCreate = [];

    var currentCommitLinkages = [];
    var i = 0;

    for (i = 0; i < issueLinkages.length; i++) {
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

        console.log(`generateDirectAttachmentsFromCommits - insertedAttachments.length: ${insertedAttachments.length}`);

        // Add to `attachments` field of IntegrationTicket

        try {
            await addAttachmentsToIntegrationTickets(insertedAttachments);
        } catch (err) {
            Sentry.captureException(err);
            throw err;
        }
    }
};


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

    // console.log("Unique Markdown Issue Numbers: ");
    // console.log(linkedIssueNumbers);

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
        k = 0;

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

const generateIssueFetchQuery = () => {
    const LABEL_NUM = 100;
    
    return gql`
    query fetchRepoIssues($repoName: String!, $repoOwner: String!, $issueNumber: Int!, $cursor: String) {
        repository(name: $repoName, owner: $repoOwner) { 
          issues(first: $issueNumber, after: $cursor) {
            nodes {
              title
              number
              author {
                  login
              }
              body
              createdAt
              updatedAt
              closedAt
              url
              state
              labels (first: ${LABEL_NUM}) {
                nodes {
                  name
                }
              }
              locked
              comments {
                totalCount
              }
              authorAssociation
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

const generateIssueFetchBackwardsQuery = () => {

    return gql`
    query fetchRepoIssues($repoName: String!, $repoOwner: String!, $issueNumber: Int!, $cursor: String) { 
        repository(name: $repoName, owner:$repoOwner) { 
          issues(last: $issueNumber, before: $cursor) {
            nodes {
              title
              author {
                  login
              }
              number
              body
              createdAt
              updatedAt
              closedAt
              url
              state
              labels (first: 100) {
                nodes {
                  name
                }
              }
              locked
              comments {
                totalCount
              }
              authorAssociation
            }
            pageInfo {
              startCursor
              hasPreviousPage
            }
          }
        }
      }
    `;
};

const fetchAllRepoIssuesAPIGraphQL = async (client, repositoryId,
    fullName, integrationBoardId, req_list=undefined, backwards=false) => {

    if (req_list) {
        if (req_list.length == 0) {
            return [];
        }
    }

    var repoName = fullName.split("/")[1];
    var repoOwner = fullName.split("/")[0];

    var query;
    if (backwards == false) {
        query = generateIssueFetchQuery();
    } else {
        query = generateIssueFetchBackwardsQuery();
    }

    var hasNextPage = true;
    var queryResponse;
  
    var variables = { "repoName": repoName, "repoOwner": repoOwner };

    if (!req_list) {
        variables.issueNumber = 100;
    }

    var cursor = undefined;

    var found_issue_list = [];
    var total_issues_scraped = 0;

    var req_num = 0;

    while (hasNextPage) {

        if (req_list) {
            if (req_num >= req_list.length) {
                break;
            }
            variables.issueNumber = req_list[req_num];
        }

        if (cursor) {
            variables.cursor = cursor;
        }
        queryResponse = await client.request(query, variables);
  
        total_issues_scraped += queryResponse.repository.issues.nodes.length;
  
  
        // Iterate over list of PRs
        for (var i = 0; i < queryResponse.repository.issues.nodes.length; i++) {
            var issue = queryResponse.repository.issues.nodes[i];
        
            found_issue_list.push({
                repositoryId: repositoryId,
                board: integrationBoardId,

                name: issue.title,
                
                sourceId: issue.number,

                description: issue.body,
                sourceCreationDate: issue.createdAt,
                sourceUpdateDate: issue.updatedAt,
                sourceCloseDate: issue.closedAt,

                source: "github",

                creator: (issue.author != null) ? issue.author.login : null,
                repository: repositoryId,
                status: issue.state,
                labels: issue.labels.nodes.map(labelObj => labelObj.name),
                commentNum: issue.comments.totalCount,

                githubIssueCreator: (issue.author != null) ? issue.author.login : null,
                githubIssueHtmlUrl: issue.url,
                githubIssueNumber: issue.number,
                githubIssueState: issue.state,
                githubIssueTitle: issue.title,
                githubIssueBody: issue.body,
                // githubIssueUserId: repositoryIssueObj.user.id,
                githubIssueLabels: issue.labels.nodes.map(labelObj => labelObj.name),
                githubIssueLocked: issue.locked,
                githubIssueCommentNumber: issue.comments.totalCount,
                githubIssueClosedAt: issue.closedAt,
                githubIssueCreatedAt: issue.createdAt,
                githubIssueUpdatedAt: issue.UpdatedAt,
                githubIssueAuthorAssociation: issue.authorAssociation,
                
            });
        }
        
        if (backwards == false) {
            hasNextPage = queryResponse.repository.issues.pageInfo.hasNextPage;
        } else {
            hasNextPage = queryResponse.repository.issues.pageInfo.hasPreviousPage;
        }

        if (hasNextPage) {
            if (backwards == false) {
                cursor = queryResponse.repository.issues.pageInfo.endCursor;
            } else {
                cursor = queryResponse.repository.issues.pageInfo.startCursor;
            }
        }
        // console.log(`cursor is ${cursor}`);
        console.log(`total_issues_scraped: ${total_issues_scraped}`);
        req_num += 1;
    }
  
  
    console.log(`Total Issues Scraped: ${total_issues_scraped}`);

    return found_issue_list;

};

const fetchIssueNum = async (client, fullName) => {
    var query = gql`
        query getTotalCounts($repoName: String!, $repoOwner: String!) {
            repository(name: $repoName, owner: $repoOwner) {
                issues {
                    totalCount
                }
            }  
        }
    `;
    
    var repoName = fullName.split("/")[1];
    var repoOwner = fullName.split("/")[0];

    var variables = { "repoName": repoName, "repoOwner": repoOwner };

    var queryResponse = await client.request(query, variables);

    return queryResponse.repository.issues.totalCount;
};

const fetchAllRepoIssuesAPIConcurrent = async (client, repositoryId, fullName, integrationBoardId) => {

    var issueNum = await fetchIssueNum(client, fullName);
    
    var req_lists = getRequestLists(issueNum);

    var fetchResults;

    try {
        fetchResults = await Promise.allSettled([fetchAllRepoIssuesAPIGraphQL(client, repositoryId, fullName, integrationBoardId, req_lists.forward, false),
            fetchAllRepoIssuesAPIGraphQL(client, repositoryId, fullName, integrationBoardId, req_lists.backward, true)]
        );
    } catch (err) {
        console.log(err);

        Sentry.setContext("fetchAllRepoIssuesAPIConcurrent", {
            message: "Promise.allSettled([fetchAllRepoIssuesAPIGRaphQL()]) failed",
            fullName: fullName,
            forward_list: JSON.stringify(req_lists.forward),
            backward_list: JSON.stringify(req_lists.backward),
        });

        Sentry.captureException(err);

        throw err;
    }

    var validResults = fetchResults.filter(resultObj => resultObj.value && !resultObj.value.error);
    validResults = validResults.map(resultObj => resultObj.value);

    validResults = validResults.flat();

    return validResults;

};



const scrapeGithubRepoIssues = async (
    installationId,
    repositoryId,
    repositoryObj,
    workspaceId,
    integrationBoardId,
    public = false
) => {

    var client = (public) ? api.requestPublicGraphQLClient() :
        await api.requestInstallationGraphQLClient(installationId);
    
    
    var start = process.hrtime();
    var bulkGithubIssueInsertList = [];

    try {
        bulkGithubIssueInsertList = await fetchAllRepoIssuesAPIGraphQL(client, repositoryId, repositoryObj.fullName, integrationBoardId);
        // bulkGithubIssueInsertList = await fetchAllRepoIssuesAPIConcurrent(client, repositoryId, repositoryObj.fullName, integrationBoardId);
    } catch (err) {
        console.log(err);
        Sentry.captureException(err);
        throw err;
    }
    printExecTime(process.hrtime(start), `fetchAllRepoIssuesAPIGraphQL("${repositoryObj.fullName}")`);
    // printExecTime(process.hrtime(start), `fetchAllRepoIssuesAPIConcurrent("${repositoryObj.fullName}")`);



    if (bulkGithubIssueInsertList.length > 0) {

        start = process.hrtime();
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
                message: "IntegrationTicket{source = \"github\"} insertMany failed",
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
                message: "Error fetching Scraped GithubIssues",
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

        start = process.hrtime();
        var issueLinkages;
        try {
            issueLinkages = await getGithubIssueLinkages(installationId, repositoryObj, public);
        } catch (err) {
            console.log(err);
            Sentry.setContext("scrapeGithubRepoIssues", {
                message: "GithubIssue getGithubIssueLinkages failed",
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
                linkageObj.issueNumber == issueObj.githubIssueNumber);

            issueLinkages[issueLinkagesIdx].markdownLinkages = 
                getGithubIssueLinkagesFromMarkdown(issueObj);

            // markdownLinkages.push(getGithubIssueLinkagesFromMarkdown(issueObj));
        });

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
