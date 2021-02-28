const fs = require("fs");

const apis = require("../apis/api");

require("dotenv").config();

const constants = require("../constants/index");

const JiraSite = require("../models/integrations/jira/JiraSite");
const IntegrationBoard = require("../models/integrations/integration_objects/IntegrationBoard");
const IntegrationTicket = require("../models/integrations/integration_objects/IntegrationTicket");
const IntegrationInterval = require("../models/integrations/integration_objects/IntegrationInterval");
const IntegrationAttachment = require("../models/integrations/integration_objects/IntegrationAttachment");

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const _ = require("lodash");

const { serializeError, deserializeError } = require("serialize-error");

let db = mongoose.connection;

const createJiraIssueIntervals = async (insertedIssueIds) => {
    // Fetch Jira Issue IntegrationTickets
    var scrapedIssues;
    try {
        scrapedIssues = await IntegrationTicket.find(
            {
                _id: {
                    $in: insertedIssueIds.map((id) => ObjectId(id.toString())),
                },
            },
            "_id jiraIssueResolutionStatus jiraIssueResolutionDate jiraIssueCreationDate jiraIssueUpdatedDate"
        )
            .lean()
            .exec();
    } catch (err) {
        console.log(err);
        throw new Error(
            `Error finding scraped Jira Issue Integration Tickets - insertedIssueIds.length - ${insertedIssueIds.length}`
        );
    }

    var integrationIntervalsToCreate = [];

    var currentIssue;
    var i = 0;
    for (i = 0; i < scrapedIssues.length; i++) {
        currentIssue = scrapedIssues[i];
        // Create IntegrationInterval, for resolved Jira Issue
        if (currentIssue.jiraIssueResolutionStatus) {
            integrationIntervalsToCreate.push({
                integrationTicket: currentIssue._id,
                start: currentIssue.jiraIssueCreationDate,
                end: currentIssue.jiraIssueResolutionDate,
            });
        }

        // Check if jiraIssueCreationDate and jiraIssueUpdatedDate dates are different, if so make an interval, otherwise continue
        else {
            if (
                currentIssue.jiraIssueCreationDate.toString() !=
                currentIssue.jiraIssueUpdatedDate.toString()
            ) {
                integrationIntervalsToCreate.push({
                    integrationTicket: currentIssue._id,
                    start: currentIssue.jiraIssueCreationDate,
                    end: currentIssue.jiraIssueUpdatedDate,
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
                "createJiraIssueIntervals Error: bulk update of IntegrationTickets failed"
            );
        }
    }
};


function flatten(items) {
    const flat = [];
    items.map(item => {
      flat.push(item)
      if (Array.isArray(item.content) && item.content.length > 0) {
        flat.push(...flatten(item.content));
        delete item.content
      }
      delete item.content
    });
    return flat;
}


const parseDescriptionAttachments = (cards) => {
    cards.map((card) => {
        const { jiraIssueDescription, attachments } = card;

        // KARAN TODO: Handle case where there is no description
        var flattenedTree = flatten(jiraIssueDescription.content);
        var allURLs = [];
        var i = 0;

        var currentTreeObj;
        for (i = 0; i < flattenedTree.length; i++) {
            currentTreeObj = flattenedTree[i];
            if (currentTreeObj.attrs) {
                if (currentTreeObj.attrs.url) {
                    allURLs.push(currentTreeObj.attrs.url);
                }
                if (currentTreeObj.attr.href) {
                    allURLs.push(currentTreeObj.attrs.href);
                }
            }

            if (currentTreeObj.marks) {
                if (currentTreeObj.marks.attrs) {
                    if (currentTreeObj.marks.attrs.url) {
                        allURLs.push(currentTreeObj.marks.attrs.url);
                    }
                    if (currentTreeObj.marks.attr.href) {
                        allURLs.push(currentTreeObj.marks.attrs.href);
                    }
                }
            }
        }


        allURLs = allURLs.map((url) => {
            return { url: url };
        });

        card.attachments = [...attachments, ...allURLs];
    });
    return cards;
}

const enrichJiraIssueDirectAttachments = async (jiraIssueList) => {

    // KARAN TODO: Remove this Section
    var repositoryId = '600032b77c780a751fd82db4';
    jiraIssueList = jiraIssueList.map(issueObj => {
        return Object.assign({}, issueObj, { attachments: [] });
    });

    jiraIssueList = parseDescriptionAttachments(jiraIssueList);


    let insertOps = [];

    let seenUrls = new Set();

    jiraIssueList.map((issueObj) => {
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

    jiraIssueList.map((issueObj) => {
        issueObj.attachmentIds = issueObj.attachments
            .map((attachment) => {
                const { url } = attachment;

                if (attachments[url]) {
                    return attachments[url]._id;
                }

                return null;
            })
            .filter((attachmentId) => attachmentId != null);
    });

    return { attachments, cards };
}




const getJiraSiteObj = async (jiraSiteId) => {
    var jiraSiteObj;
    try {
        jiraSiteObj = await JiraSite.findById(ObjectId(jiraSiteId))
            .lean()
            .exec();
    } catch (err) {
        await worker.send({
            action: "log",
            info: {
                level: "error",
                source: "worker-instance",
                message: serializeError(err),
                errorDescription: `Error fetching JiraSite - jiraSiteId: ${jiraSiteId}`,
                function: "getJiraSiteObj",
            },
        });

        throw Error(`Error fetching JiraSite - jiraSiteId: ${jiraSiteId}`);
    }
    return jiraSiteObj;
};

const getJiraSiteProjects = async (
    jiraCloudIds,
    jiraApiClientList,
    jiraSiteId,
    worker
) => {
    // Get the projects associated with each cloudId

    var projectSearchRequestList = jiraCloudIds.map(async (cloudId, idx) => {
        var projectListResponse;
        var jiraSiteApiClient = jiraApiClientList[idx];

        // GET /rest/api/3/project/search
        try {
            projectListResponse = await jiraSiteApiClient.get(
                "/project/search"
            );
        } catch (err) {
            console.log(err);
            return { error: "Error", cloudId };
        }
        if (idx == 0) {
            await worker.send({
                action: "log",
                info: {
                    level: "info",
                    message: `projectListResponse.data.length: ${projectListResponse.data.length}`,
                    source: "worker-instance",
                    function: "importJiraIssues",
                },
            });
        }
        return { projectData: projectListResponse.data, cloudId };
    });

    // Execute all requests
    var projectListResults;
    try {
        projectListResults = await Promise.allSettled(projectSearchRequestList);
    } catch (err) {
        await worker.send({
            action: "log",
            info: {
                level: "error",
                source: "worker-instance",
                message: serializeError(err),
                errorDescription: `Error fetching project list - cloudIds: ${JSON.stringify(
                    cloudIds
                )}`,
                function: "importJiraIssues",
            },
        });
        throw err;
    }

    // Non-error responses
    var validResults = projectListResults.filter(
        (resultObj) => resultObj.value && !resultObj.value.error
    );

    // Error responses
    var invalidResults = projectListResults.filter(
        (resultObj) => resultObj.value && resultObj.value.error
    );

    await worker.send({
        action: "log",
        info: {
            level: "info",
            message: `projectListResults validResults.length: ${validResults.length}`,
            source: "worker-instance",
            function: "importJiraIssues",
        },
    });

    var jiraProjectsToCreate = [];
    var currentResult;
    var currentValue;

    for (i = 0; i < validResults.length; i++) {
        currentResult = validResults[i];
        if (currentResult.status != "fulfilled") {
            continue;
        }

        currentValue = currentResult.value;
        var currentProject;
        // Get all Projects from cloudId
        for (k = 0; k < currentValue.projectData.values.length; k++) {
            currentProject = currentValue.projectData.values[k];
            /*
            "self": "https://api.atlassian.com/ex/jira/8791c16c-d2d6-483a-bad9-ff96a96f7d16/rest/api/3/project/10001",
            "id": "10001",
            "key": "QKC",
            "name": "quilt-kanban-classic",
            "avatarUrls": {
              "48x48": "https://api.atlassian.com/ex/jira/8791c16c-d2d6-483a-bad9-ff96a96f7d16/secure/projectavatar?pid=10001&avatarId=10408",
              "24x24": "https://api.atlassian.com/ex/jira/8791c16c-d2d6-483a-bad9-ff96a96f7d16/secure/projectavatar?size=small&s=small&pid=10001&avatarId=10408",
              "16x16": "https://api.atlassian.com/ex/jira/8791c16c-d2d6-483a-bad9-ff96a96f7d16/secure/projectavatar?size=xsmall&s=xsmall&pid=10001&avatarId=10408",
              "32x32": "https://api.atlassian.com/ex/jira/8791c16c-d2d6-483a-bad9-ff96a96f7d16/secure/projectavatar?size=medium&s=medium&pid=10001&avatarId=10408"
            },
            "projectTypeKey": "software",
            "simplified": false,
            "style": "classic",
            "isPrivate": false,
            "properties": {}
            */

            /*
                self: {type: String, required: true},
                jiraId: {type: String, required: true},
                key:{type: String, required: true},
                name: {type: String, required: true},
                projectTypeKey:{type: String, required: true},
                simplified:{type: Boolean, required: true},
                style: {type: String, required: true},
                isPrivate: {type: Boolean, required: true},

                cloudId: {type: String, required: true},
            */

            jiraProjectsToCreate.push({
                source: "jira",
                sourceId: currentProject.id,
                self: currentProject.self,
                jiraId: currentProject.id,
                key: currentProject.key,
                name: currentProject.name,
                projectTypeKey: currentProject.projectTypeKey,
                simplified: currentProject.simplified,
                style: currentProject.style,
                isPrivate: currentProject.isPrivate,
                cloudId: currentValue.cloudId,
                jiraSiteId: jiraSiteId,
            });
        }
    }

    var insertedJiraProjects;
    try {
        insertedJiraProjects = await IntegrationBoard.insertMany(jiraProjectsToCreate);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    source: 'worker-instance',
                                                    message: serializeError(err),
                                                    errorDescription: `Error inserting IntegrationBoards(source = "jira") - insertedJiraProjects: ${JSON.stringify(insertedJiraProjects)}`,
                                                    function: 'importJiraIssues'}});

        throw new Error(`Error inserting IntegrationBoards(source = "jira") - insertedJiraProjects: ${JSON.stringify(insertedJiraProjects)}`);
    }

    return insertedJiraProjects;
};

const importJiraIssues = async () => {
    var worker = require("cluster").worker;

    var jiraSiteId = process.env.jiraSiteId;

    var jiraSite = await getJiraSiteObj(jiraSiteId);

    var workspaceId = jiraSite.workspace.toString();

    var jiraCloudIds = jiraSite.cloudIds;

    var jiraApiClientList = jiraCloudIds.map((cloudId) =>
        apis.requestJiraClient(cloudId, jiraSite.accessToken)
    );

    var insertedJiraProjects;
    try {
        insertedJiraProjects = await getJiraSiteProjects(
            jiraCloudIds,
            jiraApiClientList,
            jiraSiteId,
            worker
        );
    } catch (err) {
        console.log(err);
        throw Error(`Error getting Jira Site Projects`);
    }

    // Query for the tickets relevant to each project

    var issueSearchRequestList = insertedJiraProjects.map(
        async (jiraProjectObj, idx) => {
            var issueListResponse;

            // Get appropriate client by matching cloudId
            var jiraIssueApiClient;

            await worker.send({
                action: "log",
                info: {
                    level: "info",
                    message: `jiraApiClientList[0].defaults.baseURL: ${JSON.stringify(
                        jiraApiClientList[0].defaults.baseURL
                    )}`,
                    source: "worker-instance",
                    function: "importJiraIssues",
                },
            });

            for (i = 0; i < jiraApiClientList.length; i++) {
                if (
                    jiraApiClientList[i].defaults.baseURL.includes(
                        jiraProjectObj.cloudId
                    )
                ) {
                    jiraIssueApiClient = jiraApiClientList[i];
                }
            }

            // jiraIssueResponse = await jiraApiClient.get('/search?jql=project=QKC&maxResults=1000');
            try {
                issueListResponse = await jiraIssueApiClient.get(
                    `/search?jql=project=${jiraProjectObj.key}&fields=resolution,summary,resolutiondate,created,description,updated&expand=changelog&maxResults=1000`
                );
            } catch (err) {
                console.log(err);
                return { error: "Error", cloudId: jiraProjectObj.cloudId };
            }
            if (idx < 1) {
                await worker.send({
                    action: "log",
                    info: {
                        level: "info",
                        message: `issueListResponse.data.issues: ${JSON.stringify(
                            issueListResponse.data.issues
                        )}`,
                        source: "worker-instance",
                        function: "importJiraIssues",
                    },
                });
            }
            return {
                issueData: issueListResponse.data.issues,
                siteId: jiraProjectObj.jiraSiteId,
                cloudId: jiraProjectObj.cloudId,
                projectId: jiraProjectObj._id.toString(),
            };
        }
    );

    // Execute all requests
    var issueListResults;
    try {
        issueListResults = await Promise.allSettled(issueSearchRequestList);
    } catch (err) {
        await worker.send({
            action: "log",
            info: {
                level: "error",
                source: "worker-instance",
                message: serializeError(err),
                errorDescription: `Error fetching issue list - insertedJiraProjects: ${JSON.stringify(
                    insertedJiraProjects
                )}`,
                function: "importJiraIssues",
            },
        });
        throw err;
    }

    // Non-error responses
    var issueValidResults = issueListResults.filter(
        (resultObj) => resultObj.value && !resultObj.value.error
    );

    // Error responses
    var issueInvalidResults = issueListResults.filter(
        (resultObj) => resultObj.value && resultObj.value.error
    );

    await worker.send({
        action: "log",
        info: {
            level: "info",
            message: `issueListResults issueValidResults.length: ${issueValidResults.length}`,
            source: "worker-instance",
            function: "importJiraIssues",
        },
    });

    var jiraTicketList = issueValidResults.map((promiseObj) => {
        var newTickets = promiseObj.value.issueData.map((issueObj) => {
            var isResolved =
                issueObj.fields.resolution &&
                issueObj.fields.resolution != null &&
                issueObj.fields.resolution != "null"
                    ? true
                    : false;
            return {
                source: "jira",
                workspace: ObjectId(workspaceId.toString()),
                jiraSiteId: promiseObj.value.siteId,
                jiraProjectId: promiseObj.value.projectId,
                jiraIssueId: issueObj.id,
                jiraIssueKey: issueObj.key,
                jiraIssueSummary: issueObj.fields.summary,
                jiraIssueDescription: issueObj.fields.description,
                jiraIssueResolutionStatus: isResolved,
                jiraIssueResolutionDate: isResolved
                    ? issueObj.fields.resolutiondate
                    : undefined,
                jiraIssueCreationDate: issueObj.fields.created,
                jiraIssueUpdatedDate: issueObj.fields.updated,
            };
        });
        return newTickets;
    });

    jiraTicketList = jiraTicketList.flat();

    // Enrich Jira Issues
    // await enrichJiraIssueDirectAttachments(jiraTicketList);

    if (jiraTicketList.length > 0) {
        await worker.send({
            action: "log",
            info: {
                level: "info",
                message: `jiraTicketList[0]: ${JSON.stringify(
                    jiraTicketList[0]
                )}`,
                source: "worker-instance",
                function: "importJiraIssues",
            },
        });

        var bulkInsertResult;
        var newIssueIds;
        try {
            bulkInsertResult = await IntegrationTicket.insertMany(
                jiraTicketList,
                { rawResult: true }
            );
            newIssueIds = Object.values(
                bulkInsertResult.insertedIds
            ).map((id) => id.toString());
        } catch (err) {
            await worker.send({
                action: "log",
                info: {
                    level: "error",
                    source: "worker-instance",
                    message: serializeError(err),
                    errorDescription: `Error bulk inserting Jira Tickets - jiraTicketList: ${JSON.stringify(
                        jiraTicketList
                    )}`,
                    function: "importJiraIssues",
                },
            });

            throw new Error(
                `Error bulk inserting Jira Tickets - jiraTicketList: ${JSON.stringify(
                    jiraTicketList
                )}`
            );
        }

        // Create Integration Intervals for Issues
        try {
            await createJiraIssueIntervals(newIssueIds);
        } catch (err) {
            console.log(err);
            throw Error(`Error creating Jira Issue IntegrationIntervals`);
        }
    }
};

module.exports = {
    importJiraIssues,
};
