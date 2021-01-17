const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const { serializeError, deserializeError } = require("serialize-error");

var LinkHeader = require( 'http-link-header' );
const parseUrl = require("parse-url");
const queryString = require('query-string');

const getUrls = require('get-urls');
const _ = require("lodash");




const GithubIssue = require("../../models/integrations/github/GithubIssue");
const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");
const IntegrationInterval = require('../../models/integrations/integration_objects/IntegrationInterval');

const api = require('../../apis/api');

/*
const { gql, rawRequest, request } = require('graphql-request');
*/
// const { GraphQLClient } = require('../../mod-graphql-request/dist');


const fetchScrapedIssues = async (insertedIssueIds) => {
    // Fetch Github Issue IntegrationTickets
    var scrapedIssues;
    try {
        scrapedIssues = await IntegrationTicket.find({ _id: { $in: insertedIssueIds.map(id => ObjectId(id.toString())) } }, '_id githubIssueClosedAt githubIssueCreatedAt githubIssueUpdatedAt')
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

                /*
                if (currentRepositories[fullName]) {
                    attachment.repository = currentRepositories[fullName]._id;
                }
                */

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


/*
const generateIssueQuery = (repositoryObj, issueNumber) => {

    return gql`
      {
        resource(url: "${repositoryObj.htmlUrl}/issues/${issueNumber}") {
          ... on Issue {
            timelineItems(itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT], first: 100) {
              nodes {
                ... on ConnectedEvent {
                  id
                  subject {
                    ... on Issue {
                      number
                    }
                  }
                }
                ... on DisconnectedEvent {
                  id
                  subject {
                    ... on Issue {
                      number
                    }
                  }
                }
              }
            }
          }
        }
      }
    `
}




const getGithubIssueLinkages = async (installationId, issueObj, repositoryObj) => {

    var prismaQuery = generateIssueQuery(repositoryObj, issueObj.githubIssueNumber);

    var prismaClient;
    
    try {
        prismaClient = await api.requestInstallationGraphQLClient(installationId);
    }
    catch (err) {
        await worker.send({
            action: "log",
            info: {
                level: "error",
                message: serializeError(err),
                errorDescription: `Error requesting installation GraphQL Client - installationId: ${installationId}`,
                source: "worker-instance",
                function: "getGithubIssueLinkages",
            },
        });

        throw new Error(
            `Error requesting installation GraphQL Client - installationId: ${installationId}`
        );
    }

    var queryResponse;
    try {
        queryResponse = await prismaClient.request(prismaQuery, variables);
    }
    catch (err) {
        await worker.send({
            action: "log",
            info: {
                level: "error",
                message: serializeError(err),
                errorDescription: `Error fetching Issue timelineItems - repositoryObj.htmlUrl, issueObj.githubIssueNumber: ${repositoryObj.htmlUrl}, ${issueObj.githubIssueNumber}`,
                source: "worker-instance",
                function: "getGithubIssueLinkages",
            },
        });
        throw new Error(
            `Error fetching Issue timelineItems - repositoryObj.htmlUrl, issueObj.githubIssueNumber: ${repositoryObj.htmlUrl}, ${issueObj.githubIssueNumber}`
        );
    }

    const issues = {};
    queryResponse.data.resource.timelineItems.nodes.map(node => {
        if (issues.hasOwnProperty(node.subject.number)) {
            issues[node.subject.number]++;
        }
        else {
            issues[node.subject.number] = 1;
        }
    });

    const linkedIssues = [];
    for (const [issue, count] of Object.entries(issues)) {
        if (count % 2 != 0) {
            linkedIssues.push(issue);
        }
    }


    await worker.send({action: "log", info: {
        level: "info",
        message: `All Issues found to be connected/disconnected - issueObj.githubIssueNumber, issues: ${issueObj.githubIssueNumber}, ${JSON.stringify(issues)}`,
        source: "worker-instance",
        function: "getGithubIssueLinkages",
    }});

    await worker.send({action: "log", info: {
        level: "info",
        message: `All Issues currently linked - - issueObj.githubIssueNumber, linkedIssues: ${issueObj.githubIssueNumber}, ${JSON.stringify(linkedIssues)}`,
        source: "worker-instance",
        function: "getGithubIssueLinkages",
    }});

    // End Result is a list of issue numbers indicating what has been linked
    return { issueNumber: issueObj.githubIssueNumber, linkages: linkedIssues };
}
*/


// issueLinkages -> [{ issueNumber: 5,linkages: [1, 2, 3, 4] }, ... ]
const generateDirectAttachmentsFromIssueNumbers = async (issueLinkages) => {

    issueLinkages = issueLinkages.filter(linkageObj => linkageObj.linkages.length > 0);




}




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

    // Bulk create GithubProject models for all Objects found

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
            sourceId: repositoryIssueObj.id,
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

        /*

        // Create IntegrationAttachments for Issue Timeline Connections
        var getIssueLinkageRequestList = scrapedIssues.map( async (issueObj) => {
            var issueLinkageResponse;
            try {
                issueLinkageResponse = await getGithubIssueLinkages(installationId, issueObj, repositoryObj);
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

        try {
            await generateDirectAttachmentsFromIssueNumbers(validResults.map(resultObj => resultObj.value));
        }
        catch (err) {
            await worker.send({
                action: "log",
                info: {
                    level: "error",
                    message: serializeError(err),
                    errorDescription: `GithubIssue generateDirectAttachmentsFromIssueNumbers failed - validResults: ${JSON.stringify(validResults.map(resultObj => resultObj.value))}`,
                    source: "worker-instance",
                    function: "scrapeGithubRepoIssues",
                },
            });

            throw new Error(`GithubIssue generateDirectAttachmentsFromIssueNumbers failed - validResults: ${JSON.stringify(validResults.map(resultObj => resultObj.value))}`);
        }
        */

    }

    // console.log('ISSUE LIST PAGE SPECIFIC LINK: ');
    // console.log(issueListPageResponse.headers.link);
};

module.exports = {
    scrapeGithubRepoIssues,
};
