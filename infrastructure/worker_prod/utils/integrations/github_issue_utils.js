const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const { serializeError, deserializeError } = require("serialize-error");

var LinkHeader = require( 'http-link-header' );
const parseUrl = require("parse-url");
const queryString = require('query-string');

// const getUrls = require('get-urls');
const _ = require("lodash");

const Sentry = require("@sentry/node");




const GithubIssue = require("../../models/integrations/github/GithubIssue");
const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");
const IntegrationInterval = require('../../models/integrations/integration_objects/IntegrationInterval');
const IntegrationAttachment = require("../../models/integrations/integration_objects/IntegrationAttachment");
const PullRequest = require("../../models/PullRequest");

const api = require('../../apis/api');


const { gql, rawRequest, request } = require('graphql-request');

// const { GraphQLClient } = require('../../mod-graphql-request/dist');


const fetchScrapedIssues = async (insertedIssueIds) => {
    // Fetch Github Issue IntegrationTickets
    var scrapedIssues;
    try {
        scrapedIssues = await IntegrationTicket.find({ _id: { $in: insertedIssueIds.map(id => ObjectId(id.toString())) } },
                                                        '_id githubIssueNumber githubIssueBody githubIssueClosedAt githubIssueCreatedAt githubIssueUpdatedAt')
                                                    .lean()
                                                    .exec();
    }
    catch (err) {
        console.log(err);
        throw new Error(`Error finding scraped Github Issue Integration Tickets - insertedIssueIds.length - ${insertedIssueIds.length}`);
    }

    return scrapedIssues;
}

const createGithubIssueIntervals = async (scrapedIssues) => {

    var integrationIntervalsToCreate = [];

    var currentIssue;
    var i = 0;
    for (i = 0; i < scrapedIssues.length; i++) {
        currentIssue = scrapedIssues[i];
        // Create IntegrationInterval using githubIssueCreatedAt & githubIssueClosedAt
        if (currentIssue.githubIssueClosedAt && currentIssue.githubIssueClosedAt != null && currentIssue.githubIssueClosedAt != 'null' ) {
            integrationIntervalsToCreate.push({
                integrationTicket: currentIssue._id,
                start: currentIssue.githubIssueCreatedAt,
                end: currentIssue.githubIssueClosedAt,
            });
        }

        // Check if githubIssueCreatedAt and githubIssueUpdateAt dates are different, if so make an interval, otherwise continue
        else {
            if (currentIssue.githubIssueCreatedAt.toString() != currentIssue.githubIssueUpdatedAt.toString()) {
                integrationIntervalsToCreate.push({
                    integrationTicket: currentIssue._id,
                    start: currentIssue.githubIssueCreatedAt,
                    end: currentIssue.githubIssueUpdatedAt,
                }); 
            }
            else {
                continue;
            }
        }
    }

    if (integrationIntervalsToCreate.length > 0) {
        var insertResults;
        var insertedIntervalIds;

        // Create IntegrationIntervals
        try {
            insertResults = await IntegrationInterval.insertMany(integrationIntervalsToCreate, { rawResult: true });

            console.log('IntegrationInterval.insertMany.insertResults.insertedIds');
            console.log(insertResults.insertedIds);

            insertedIntervalIds = Object.values(insertResults.insertedIds).map(id => id.toString());
        }
        catch (err) {
            console.log(err);
            throw new Error(`Error could not insert IntegrationIntervals - integrationIntervalsToCreate.length: ${integrationIntervalsToCreate.length}`);
        }

        // Fetch new IntegrationIntervals

        var insertedIntervals;
        try {
            insertedIntervals = await IntegrationInterval.find({ _id: { $in: insertedIntervalIds.map(id => ObjectId(id.toString())) } }, '_id integrationTicket')
                                        .lean()
                                        .exec();
        }
        catch (err) {
            console.log(err);
            throw new Error(`Error finding inserted IntegrationIntervals - insertedIntervalIds.length - ${insertedIntervalIds.length}`);
        }

        // Update IntegrationTickets with IntegrationIntervals

        let bulkUpdateIntegrationTicketsOps = insertedIntervals.map((intervalObj) => {
            return ({
                updateOne: {
                    filter: { _id: ObjectId(intervalObj.integrationTicket.toString()) },
                    // Where field is the field you want to update
                    update: { $push: { intervals: ObjectId(intervalObj._id.toString()) } },
                    upsert: false
                }
            })
        })

        // mongoose bulkwrite for one many update db call
        try {
            await IntegrationTicket.bulkWrite(bulkUpdateIntegrationTicketsOps);
        } 
        catch (err) {
            console.log(err);
            throw new Error("createGithubIssueIntervals Error: bulk update of IntegrationTickets failed");
        }

    }

}


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



const generateIssueQuery = (repositoryObj, issueNumber) => {

    return gql`
    {
        resource(url: "${repositoryObj.htmlUrl}/issues/${issueNumber}") {
          ... on Issue {
            timelineItems(itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT, REFERENCED_EVENT], first: 100) {
              nodes {
                ... on ReferencedEvent {
                  commit {
                    oid
                  }
                }
                ... on ConnectedEvent {
                  subject {
                    ... on Issue {
                      number
                    }
                    ... on PullRequest {
                      id
                      number
                    }
                  }
                }
                ... on DisconnectedEvent {
                  subject {
                    ... on Issue {
                      number
                    }
                    ... on PullRequest {
                      id
                      number
                    }
                  }
                } 
              }
            }
          }
        }
      }
    `;
}




const getGithubIssueLinkages = async (installationId, issueObj, repositoryObj, worker) => {

    var prismaQuery = generateIssueQuery(repositoryObj, issueObj.githubIssueNumber);

    var prismaClient;
    
    try {
        prismaClient = await api.requestInstallationGraphQLClient(installationId);
    }
    catch (err) {

        Sentry.setContext("getGithubIssueLinkages", {
            message: `Failed to get installation GraphQL client`,
            installationId: installationId,
        });

        Sentry.captureException(err);

        throw err;
    }

    var queryResponse;
    try {
        queryResponse = await prismaClient.request(prismaQuery);
    }
    catch (err) {

        Sentry.setContext("getGithubIssueLinkages", {
            message: `GraphQL query failed for Issue`,
            issueNumber: issueObj.githubIssueNumber,
            repositoryUrl: repositoryObj.htmlUrl,
        });

        Sentry.captureException(err);

        throw err;
    }

    // console.log("Issue Timeline GraphQL query Response: ");
    // console.log(queryResponse);

    const issues = {};
    const prs = {};


    var issueEvents = [];
    var prEvents = [];


    // Get all Commits that Reference this Issue
    var linkedCommits = [];

    console.log(`Github Issue Number: ${issueObj.githubIssueNumber}`);


    console.log("prismaQuery: ");
    console.log(prismaQuery);

    queryResponse.resource.timelineItems.nodes.map(node => {
        if (node.hasOwnProperty('commit')) {
            console.log("FOUND COMMIT LINKAGE");
            linkedCommits.push(node.commit.oid);
        }
    });

    // Separate issue events into PR events and Non-issue PR events
    queryResponse.resource.timelineItems.nodes.map(node => {
        if (node.hasOwnProperty('subject')) {

            // The event is related to a PR
            if (node.subject.hasOwnProperty("id")) {
                prEvents.push(node.subject);
            }

            // The event is related to an issue
            else {
                issueEvents.push(node.subject);
            }
        }
    });

    // Filter to PRs still linked
    prEvents.map(subject => {
        if (prs.hasOwnProperty(subject.number)) {
            prs[subject.number]++;
        }
        else {
            prs[subject.number] = 1;
        }
    });


    // Filter to issues still linked
    issueEvents.map(subject => {
        if (issues.hasOwnProperty(subject.number)) {
            issues[subject.number]++;
        }
        else {
            issues[subject.number] = 1;
        }
    });


    console.log(`\nLinkages found for Issue #${issueObj.githubIssueNumber}: `);

    console.log("queryResponse.resource.timelineItems.nodes");
    console.log(queryResponse.resource.timelineItems.nodes);


    // Create final lists of currently-linked issues and PRs

    console.log("issues: ");
    console.log(issues);

    const linkedIssues = [];
    for (const [issue, count] of Object.entries(issues)) {
        if (count % 2 != 0) {
            linkedIssues.push(issue);
        }
    }

    console.log("prs: ");
    console.log(prs);

    const linkedPRs = [];
    for (const [pr, count] of Object.entries(prs)) {
        if (count % 2 != 0) {
            linkedPRs.push(pr);
        }
    }
    
    console.log("linkedIssues: ");
    console.log(linkedIssues);

    console.log("linkedPRs: ");
    console.log(linkedPRs);

    console.log("linkedCommits: ");
    console.log(linkedCommits);
    



    // End Result is a list of commits and issue & pr numbers indicating linkages
    return { issueNumber: issueObj.githubIssueNumber,
                issueLinkages: linkedIssues,
                prLinkages: linkedPRs,
                commitLinkages: linkedCommits, 
            };
}




const getGithubIssueLinkagesFromMarkdown = (installationId, issueObj, repositoryObj) => {

    const regex = /[#][0-9]+/g

    var foundMatches = issueObj.githubIssueBody.match(regex);

    if (foundMatches == null) {
        foundMatches = [];
    }

    return { issueNumber: issueObj.githubIssueNumber, linkages: foundMatches.map(e => e.replace(/\D/g,'')) };
}


const fetchIntegrationAttachments = async (attachmentsToCreate, repositoryId, modelType) => {

    if (attachmentsToCreate.length < 1) {
        return [];
    }

    return await IntegrationAttachment.find({ repository: repositoryId,
                                              modelType: modelType,
                                              sourceId: { $in: attachmentsToCreate.map(obj => obj.sourceId) } }, '_id nonCodeId' ).lean().exec();
}

const addAttachmentsToIntegrationTickets = async (insertedAttachments) => {
    // Add to `attachments` field of IntegrationTicket

    let bulkUpdateIntegrationTickets = insertedAttachments.map((attachmentObj) => {
        return ({
            updateOne: {
                filter: { _id: ObjectId(attachmentObj.nonCodeId.toString()) },
                // Where field is the field you want to update
                update: { $push: { attachments: ObjectId(attachmentObj._id.toString()) } },
                upsert: false
            }
        })
    });

    // mongoose bulkwrite for one many update db call
    try {
        await IntegrationTicket.bulkWrite(bulkUpdateIntegrationTickets);
    } 
    catch (err) {
        Sentry.captureException(err);
        throw err;
    }
}


// KARAN TODO: add to `attachments` field of IntegrationTicket
const generateDirectAttachmentsFromIssues = async (issueLinkages, scrapedIssues, repositoryObj) => {

    var attachmentsToCreate = [];

    var currentIssueLinkages = [];
    var i = 0;

    for ( i = 0; i < issueLinkages.length; i++) {

        currentIssueLinkages = issueLinkages[i].issueLinkages;

        var k = 0;
        for ( k = 0; k < currentIssueLinkages.length; k++ ) {

            var scrapedIssueIdx = scrapedIssues.findIndex(issueObj => issueObj.githubIssueNumber == issueLinkages[i].issueNumber);

            if (scrapedIssueIdx < 0) {
                continue;
            }

            attachmentsToCreate.push({
                modelType: 'issue',
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
                            repository: ObjectId(
                                attachmentObj.repository
                            ),
                            modelType: attachmentObj.modelType,
                            sourceId: attachmentObj.sourceId,
                            link: attachmentObj.link,
                            nonCodeId: attachmentObj.nonCodeId,
                        },
                        // Where field is the field you want to update
                        update: {
                            $set: {
                                attachmentObj
                            },
                        },
                        upsert: true,
                    },
                };
            }
        );
        
        try {
            await IntegrationAttachment.bulkWrite(bulkUpdateAttachmentsOps);
        }
        catch (err) {
            console.log(err);
            Sentry.captureException(err);
            throw err;
        }


        // Fetch inserted IntegrationAttachments
        var insertedAttachments = [];
        try {
            insertedAttachments = await fetchIntegrationAttachments(attachmentsToCreate, repositoryObj._id.toString(), 'issue');
        }
        catch (err) {
            Sentry.captureException(err);
            throw err;
        }

        console.log('generateDirectAttachmentsFromIssues - insertedAttachments: ');
        console.log(insertedAttachments);

        // Add to `attachments` field of IntegrationTicket

        try {
            await addAttachmentsToIntegrationTickets(insertedAttachments);
        } 
        catch (err) {
            Sentry.captureException(err);
            throw err;
        }
    }
    

}

// KARAN TODO: add to `attachments` field of IntegrationTicket
const generateDirectAttachmentsFromPRs = async (issueLinkages, scrapedIssues, repositoryObj) => {

    var attachmentsToCreate = [];

    var currentPRLinkages = [];
    var i = 0;

    for ( i = 0; i < issueLinkages.length; i++) {
        
        currentPRLinkages = issueLinkages[i].prLinkages;

        var k = 0;
        for ( k = 0; k < currentPRLinkages.length; k++ ) {

            var scrapedIssueIdx = scrapedIssues.findIndex(issueObj => issueObj.githubIssueNumber == issueLinkages[i].issueNumber);

            if (scrapedIssueIdx < 0) {
                continue;
            }


            attachmentsToCreate.push({
                modelType: 'pullRequest',
                sourceId: currentPRLinkages[k],
                repository: repositoryObj._id.toString(),
                link: `${repositoryObj.htmlUrl}/pull/${currentPRLinkages[k]}`,
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
                            repository: ObjectId(
                                attachmentObj.repository
                            ),
                            modelType: attachmentObj.modelType,
                            sourceId: attachmentObj.sourceId,
                            link: attachmentObj.link,
                            nonCodeId: attachmentObj.nonCodeId,
                        },
                        // Where field is the field you want to update
                        update: {
                            $set: {
                                attachmentObj
                            },
                        },
                        upsert: true,
                    },
                };
            }
        );
        
        try {
            await IntegrationAttachment.bulkWrite(bulkUpdateAttachmentsOps);
        }
        catch (err) {
            console.log(err);
            Sentry.captureException(err);
            throw err;
        }


        // Fetch inserted IntegrationAttachments
        var insertedAttachments = [];
        try {
            insertedAttachments = await fetchIntegrationAttachments(attachmentsToCreate, repositoryObj._id.toString(), 'pullRequest');
        }
        catch (err) {
            Sentry.captureException(err);
            throw err;
        }

        console.log('generateDirectAttachmentsFromPRs - insertedAttachments: ');
        console.log(insertedAttachments);

        // Add to `attachments` field of IntegrationTicket

        try {
            await addAttachmentsToIntegrationTickets(insertedAttachments);
        } 
        catch (err) {
            Sentry.captureException(err);
            throw err;
        }
    }
    

}

const generateDirectAttachmentsFromCommits = async (issueLinkages, scrapedIssues, repositoryObj) => {

    var attachmentsToCreate = [];

    var currentCommitLinkages = [];
    var i = 0;

    for ( i = 0; i < issueLinkages.length; i++) {
        
        currentCommitLinkages = issueLinkages[i].commitLinkages;

        var k = 0;
        for ( k = 0; k < currentCommitLinkages.length; k++ ) {

            var scrapedIssueIdx = scrapedIssues.findIndex(issueObj => issueObj.githubIssueNumber == issueLinkages[i].issueNumber);

            if (scrapedIssueIdx < 0) {
                continue;
            }


            attachmentsToCreate.push({
                modelType: 'commit',
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
                            repository: ObjectId(
                                attachmentObj.repository
                            ),
                            modelType: attachmentObj.modelType,
                            sourceId: attachmentObj.sourceId,
                            link: attachmentObj.link,
                            nonCodeId: attachmentObj.nonCodeId,
                        },
                        // Where field is the field you want to update
                        update: {
                            $set: {
                                attachmentObj
                            },
                        },
                        upsert: true,
                    },
                };
            }
        );
        
        try {
            await IntegrationAttachment.bulkWrite(bulkUpdateAttachmentsOps);
        }
        catch (err) {
            console.log(err);
            Sentry.captureException(err);
            throw err;
        }


        // Fetch inserted IntegrationAttachments
        var insertedAttachments = [];
        try {
            insertedAttachments = await fetchIntegrationAttachments(attachmentsToCreate, repositoryObj._id.toString(), 'commit');
        }
        catch (err) {
            Sentry.captureException(err);
            throw err;
        }

        console.log('generateDirectAttachmentsFromCommits - insertedAttachments: ');
        console.log(insertedAttachments);

        // Add to `attachments` field of IntegrationTicket

        try {
            await addAttachmentsToIntegrationTickets(insertedAttachments);
        } 
        catch (err) {
            Sentry.captureException(err);
            throw err;
        }
    }

}



const generateDirectAttachmentsFromMarkdown = async (issueLinkages, scrapedIssues, repositoryObj) => {


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
        linkedPRs = await PullRequest.find({ number: { $in: Array.from(linkedIssueNumbers) }, repository: repositoryObj._id }).lean().exec();
    }
    catch (err) {
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

            var linkedPRsIdx = linkedPRs.findIndex(prObj => prObj.number == currentMarkdownLinkages.linkages[k]);

            // If no matching PR, add to markdownIssueLinkages
            if (linkedPRsIdx < 0) {
                currentMarkdownIssueLinkages.push(currentMarkdownLinkages.linkages[k]);
            }
            else {
                currentMarkdownPRLinkages.push(currentMarkdownLinkages.linkages[k]);
            }

        }

        markdownIssueLinkages.push({ issueNumber: issueLinkages[i].issueNumber, issueLinkages: currentMarkdownIssueLinkages });
        markdownPRLinkages.push({ issueNumber: issueLinkages[i].issueNumber, prLinkages: currentMarkdownPRLinkages });

    }

    console.log("markdownPRLinkages: ");
    console.log(markdownPRLinkages);

    console.log("markdownIssueLinkages: ");
    console.log(markdownIssueLinkages);

    try {
        await generateDirectAttachmentsFromIssues(markdownIssueLinkages, scrapedIssues, repositoryObj);
    }
    catch (err) {
        Sentry.captureException(err);
        throw err;
    }

    try {
        await generateDirectAttachmentsFromPRs(markdownPRLinkages, scrapedIssues, repositoryObj);
    }
    catch (err) {
        Sentry.captureException(err);
        throw err;
    }



}


const generateDirectAttachmentsFromLinkages = async (issueLinkages, scrapedIssues, repositoryObj) => {

    if (issueLinkages.length < 1) {
        return;
    }

    // 4 possible sources of linkages:
    //      issueLinkages[x].issueLinkages
    //      issueLinkages[x].prLinkages
    //      issueLinkages[x].commitLinkages
    //      issueLinkages[x].markdownLinkages

    // Handle issueLinkages[x].issueLinkages
    try {
        await generateDirectAttachmentsFromIssues(issueLinkages, scrapedIssues, repositoryObj);
    }
    catch (err) {
        Sentry.captureException(err);
        throw err;
    }


    // Handle issueLinkages[x].prLinkages
    try {
        await generateDirectAttachmentsFromPRs(issueLinkages, scrapedIssues, repositoryObj);
    }
    catch (err) {
        Sentry.captureException(err);
        throw err;
    }

    // Handle issueLinkages[x].commitLinkages
    try {
        await generateDirectAttachmentsFromCommits(issueLinkages, scrapedIssues, repositoryObj);
    }
    catch (err) {
        Sentry.captureException(err);
        throw err;
    }

    // Handle issueLinkages[x].markdownLinkages
    try {
        await generateDirectAttachmentsFromMarkdown(issueLinkages, scrapedIssues, repositoryObj);
    }
    catch (err) {
        Sentry.captureException(err);
        throw err;
    }

}






scrapeGithubRepoIssues = async (
    installationId,
    repositoryId,
    installationClient,
    repositoryObj,
    workspaceId,
    integrationBoardId,
    worker
) => {
    // TEST ISSUE SCRAPING

    // GET /repos/{owner}/{repo}/issues

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

        if (!issueListPageResponse.headers.link) {
            pageNum = lastPageNum;
        }
        else {
            var link;
            try {
                link = LinkHeader.parse(issueListPageResponse.headers.link);
            } catch (err) {
                console.log(`failed to parse link header`);
                console.log(err);
                throw new Error(`scrapeGithubRepoIssues - Failed to parse link header - issueListPageResponse.headers.link - ${issueListPageResponse.headers.link}`);
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

    var repositoryIssueList = foundIssueList;

    // Bulk create IntegrationTicket models for all Objects found

    // Filter Out Issues that are PullRequests
    repositoryIssueList = repositoryIssueList.filter(issueObj => !issueObj.pull_request);

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

    var bulkGithubIssueInsertList = repositoryIssueList.map((repositoryIssueObj, idx) => {
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
            sourceId: repositoryIssueObj.id,
            description: repositoryIssueObj.body,
            sourceCreationDate: repositoryIssueObj.created_at,
            sourceUpdateDate: repositoryIssueObj.updated_at,
            sourceCloseDate: (repositoryIssueObj.closed_at == null || repositoryIssueObj.closed_at == 'null') ? undefined : repositoryIssueObj.closed_at,

            source: 'github',
            githubIssueHtmlUrl: repositoryIssueObj.html_url,
            githubIssueNumber: repositoryIssueObj.number,
            githubIssueState: repositoryIssueObj.state,
            githubIssueTitle: repositoryIssueObj.title,
            githubIssueBody: repositoryIssueObj.body,
            // githubIssueUserId: repositoryIssueObj.user.id,
            githubIssueLabels: repositoryIssueObj.labels.map(labelObj => labelObj.name),
            githubIssueLocked: repositoryIssueObj.locked,
            githubIssueCommentNumber: repositoryIssueObj.comments,
            githubIssueClosedAt: (repositoryIssueObj.closed_at == null || repositoryIssueObj.closed_at == 'null') ? undefined : repositoryIssueObj.closed_at,
            githubIssueCreatedAt: repositoryIssueObj.created_at,
            githubIssueUpdatedAt: repositoryIssueObj.updated_at,
            githubIssueAuthorAssociation: repositoryIssueObj.author_association,
        };
   });







    if (bulkGithubIssueInsertList.length > 0) {
        var bulkInsertResult;
        var newTicketIds;

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
            bulkInsertResult = await IntegrationTicket.insertMany(
                bulkGithubIssueInsertList,
                { rawResult: true }
            );

            newTicketIds = Object.values(bulkInsertResult.insertedIds).map(id => id.toString());
            /*
            await worker.send({action: 'log', info: {level: 'info',
                                                        message: `GithubIssue insertMany success - bulkInsertResult: ${JSON.stringify(bulkInsertResult)}`,
                                                        source: 'worker-instance',
                                                        function: 'scrapeGithubRepoIssues'}});
            */
            
            // Create IntegrationIntervals for Issues
            // We only create integration intervals for Issues which at least have two different dates attached
            


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

        var scrapedIssues;
        try {
            scrapedIssues = await fetchScrapedIssues(newTicketIds);
        }
        catch (err) {
            console.log(err);
            throw Error(`Error fetching Scraped GithubIssues`);
        }

        // Create IntegrationIntervals for scraped Issues
        try {
            await createGithubIssueIntervals(scrapedIssues);
        }
        catch (err) {
            console.log(err);
            throw new Error(`GithubIssue create IntegrationIntervals failed`);
        }


        // console.log("scrapedIssues: ");
        // console.log(scrapedIssues);


        // Create IntegrationAttachments for Issue Timeline Connections
        var getIssueLinkageRequestList = scrapedIssues.map( async (issueObj) => {
            var issueLinkageResponse;
            try {
                issueLinkageResponse = await getGithubIssueLinkages(installationId, issueObj, repositoryObj, worker);
            }
            catch (err) {
                console.log(err);
                return {error: 'Error', issueNumber: issueObj.githubIssueNumber};
            }

            return issueLinkageResponse;

        });

        // Execute all requests
        var results;
        try {
            results = await Promise.allSettled(getIssueLinkageRequestList);
        }
        catch (err) {
            await worker.send({
                action: "log",
                info: {
                    level: "error",
                    message: serializeError(err),
                    errorDescription: `GithubIssue getLinkages failed - getIssueLinkageRequestList.length: ${getIssueLinkageRequestList.length}`,
                    source: "worker-instance",
                    function: "scrapeGithubRepoIssues",
                },
            });

            throw new Error(`GithubIssue getLinkages failed - getIssueLinkageRequestList.length: ${getIssueLinkageRequestList.length}`);
        }

        // Non-error responses
        validResults = results.filter(resultObj => resultObj.value && !resultObj.value.error);

        // Error responses
        invalidResults = results.filter(resultObj => resultObj.value && resultObj.value.error);


        var issueLinkages = validResults.map(resultObj => resultObj.value);

        
        // Get any linkages from markdown
        scrapedIssues.map(issueObj => {

            var issueLinkagesIdx = issueLinkages.findIndex(linkageObj => linkageObj.issueNumber == issueObj.githubIssueNumber);

            issueLinkages[issueLinkagesIdx].markdownLinkages = getGithubIssueLinkagesFromMarkdown(installationId, issueObj, repositoryObj);
            
            // markdownLinkages.push(getGithubIssueLinkagesFromMarkdown(installationId, issueObj, repositoryObj));
        });

        console.log('FINAL ISSUE LINKAGES: ');
        console.log(issueLinkages);


        try {
            await generateDirectAttachmentsFromLinkages(issueLinkages, scrapedIssues, repositoryObj);
        }
        catch (err) {    
            Sentry.captureException(err);
            throw err;
        }

    }

};

module.exports = {
    scrapeGithubRepoIssues,
};
