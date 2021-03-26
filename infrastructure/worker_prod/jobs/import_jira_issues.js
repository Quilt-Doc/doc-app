const fs = require("fs");

const apis = require("../apis/api");

require("dotenv").config();

const constants = require("../constants/index");

const JiraSite = require("../models/integrations/jira/JiraSite");
const IntegrationBoard = require("../models/integrations/integration_objects/IntegrationBoard");
const IntegrationTicket = require("../models/integrations/integration_objects/IntegrationTicket");
const IntegrationInterval = require("../models/integrations/integration_objects/IntegrationInterval");
const IntegrationAttachment = require("../models/integrations/integration_objects/IntegrationAttachment");

const Workspace = require("../models/Workspace");
const Repository = require("../models/Repository");

const axios = require("axios");

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const _ = require("lodash");

const Sentry = require("@sentry/node");

const { serializeError, deserializeError } = require("serialize-error");

let db = mongoose.connection;

const fetchRepositoriesFromIdList = async (repositoryIdList, selectionString) => {

    var repositoryObjList;

    try {
        repositoryObjList = await Repository.find({ _id: { $in: repositoryIdList } }, selectionString).lean().exec();
    }
    catch (err) {

        console.log(err);

        Sentry.setContext("import-jira-issues", {
            message: `fetchRepositoriesFromIdList - Repository.find() failed`,
            repositoryIdList: repositoryIdList,
        });

        Sentry.captureException(err);

        throw err;
    }

    return repositoryObjList;
}

const fetchJiraIssuesFromIdList = async (jiraIssueIdList) => {
    var jiraIssueObjList;

    try {
        jiraIssueObjList = await IntegrationTicket.find({ _id: { $in: jiraIssueIdList } }).lean().exec();
    }
    catch (err) {

        console.log(err);

        Sentry.setContext("import-jira-issues", {
            message: `fetchJiraIssuesFromIdList - IntegrationTicket.find() failed`,
            numJiraIssues: jiraIssueIdList.length,
        });

        Sentry.captureException(err);

        throw err;
    }
    return jiraIssueObjList;
}

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

const generateDirectAttachmentsFromIssues = async (scrapedIssues, personalAccessToken, jiraEmailAddress, repositoryObjList) => {

    // var base64Credentials = btoa(`${jiraEmailAddress}:${personalAccessToken}`);

    // axios.get(`https://api.atlassian.com/ex/jira/${cloudId}/rest/dev-status/latest/issue/detail?issueId=10010&applicationType=GitHub&dataType=repository`)
    // { headers: { Authorization: `Bearer ${personalAccessToken}` } }

    var attachmentsToCreate = [];

    var issueDevelopmentInfoRequests = scrapedIssues.map(async (issueObj) => {

        var foundAttachments = [];

        // Get Issue Commits
        var issueCommitInfoResponse;
        try {
            issueCommitInfoResponse = await axios.get(`https://api.atlassian.com/ex/jira/${issueObj.cloudId}/rest/dev-status/latest/issue/detail?issueId=${issueObj.sourceId}&applicationType=GitHub&dataType=repository`,
                // { headers: { Authorization: `Basic ${base64Credentials}` } }
                { auth: { username: jiraEmailAddress, password: personalAccessToken } }

            );
        }
        catch (err) {

            console.log(err);
            Sentry.setContext("generateDirectAttachmentsFromIssues", {
                message: `Jira API Get Issue Github Repository dataType=repository Info failed`,
                issueId: issueObj.sourceId,
                personalAccessToken: personalAccessToken,
                cloudId: issueObj.cloudId,
            });

            Sentry.captureException(err);

            return {
                error: "Error",
                cloudId: issueObj.cloudId,
                personalAccessToken: personalAccessToken,
                issueId: issueObj.sourceId,
            };
        }

        issueCommitInfoResponse = issueCommitInfoResponse.data;


        if (issueCommitInfoResponse.detail) {

            var currentDetailObj;
            var k;
            for (k = 0; k < issueCommitInfoResponse.detail.length; k++) {
                currentDetailObj = issueCommitInfoResponse.detail[k];

                if (currentDetailObj.repositories) {
                    if (currentDetailObj.repositories.length > 0) {
                        var currentResponseRepository;
                        var i;
                        for (i = 0; i < currentDetailObj.repositories.length; i++) {
                            currentResponseRepository = currentDetailObj.repositories[i];


                            var currentRepositoryUrl = currentResponseRepository.url;

                            repositoryObjIndex = repositoryObjList.findIndex(obj => obj.htmlUrl == currentRepositoryUrl);


                            var currentCommitObj;
                            var k;
                            for (k = 0; k < currentResponseRepository.commits.length; k++) {
                                currentCommitObj = currentResponseRepository.commits[k];

                                foundAttachments.push({
                                    modelType: "commit",
                                    sourceId: currentCommitObj.id,
                                    repository: repositoryObjIndex >= 0 ? repositoryObjList[repositoryObjIndex]._id.toString() : undefined,
                                    board: issueObj.board,
                                    nonCodeId: issueObj._id.toString(),
                                    link: currentCommitObj.url,
                                });
                            }

                        }
                    }
                }
            }
        }



        // Get Issue Branches and PullRequests
        var issueBranchInfoResponse;
        try {
            issueBranchInfoResponse = await axios.get(`https://api.atlassian.com/ex/jira/${issueObj.cloudId}/rest/dev-status/latest/issue/detail?issueId=${issueObj.sourceId}&applicationType=GitHub&dataType=branch`,
                // { headers: { Authorization: `Bearer ${personalAccessToken}` } }
                { auth: { username: jiraEmailAddress, password: personalAccessToken } }
            );
        }
        catch (err) {

            console.log(err);
            Sentry.setContext("generateDirectAttachmentsFromIssues", {
                message: `Jira API Get Issue Github Repository dataType=branch Info failed`,
                issueId: issueObj.sourceId,
                personalAccessToken: personalAccessToken,
                cloudId: issueObj.cloudId,
            });

            Sentry.captureException(err);

            return {
                error: "Error",
                cloudId: issueObj.cloudId,
                personalAccessToken: personalAccessToken,
                issueId: issueObj.sourceId,
            };
        }


        // Find any object in ["data"]["detail"]["branches"]["repository"]["url"] is in repositoryObjList{x.htmlUrl}
        /*
        // For any found instance: return: {
            modelType: "branch",
            sourceId: ["data"]["detail"]["branches"][x]["name"],
            repository: repositoryObjList[x]._id.toString(),
            board: issueObj.board,
            nonCodeId: issueObj._id,
            link: ["data"]["detail"]["branches"][x]["url"]
        }
        */

        issueBranchInfoResponse = issueBranchInfoResponse.data;
        // console.log("issueBranchInfoResponse: ");
        // console.log(issueBranchInfoResponse);

        if (issueBranchInfoResponse.detail) {
            // Add Branch Attachments
            var currentDetailObj;
            var k;
            for (k = 0; k < issueBranchInfoResponse.detail.length; k++) {
                currentDetailObj = issueBranchInfoResponse.detail[k];
                if (currentDetailObj.branches) {
                    // console.log("branch 2 deep");
                    if (currentDetailObj.branches.length > 0) {
                        // console.log("Iterating Over Issue Branches");
                        var i = 0;
                        var currentBranchObj;
                        var currentRepositoryUrl;
                        var repositoryObjIndex;
                        for (i = 0; i < currentDetailObj.branches.length; i++) {
                            currentBranchObj = currentDetailObj.branches[i];
                            if (!currentBranchObj.repository) {
                                continue;
                            }
                            currentRepositoryUrl = currentBranchObj.repository.url;
                            repositoryObjIndex = repositoryObjList.findIndex(obj => obj.htmlUrl == currentRepositoryUrl);
                            foundAttachments.push({
                                modelType: "branch",
                                sourceId: currentBranchObj.name,
                                repository: repositoryObjIndex >= 0 ? repositoryObjList[repositoryObjIndex]._id.toString() : undefined,
                                board: issueObj.board,
                                nonCodeId: issueObj._id.toString(),
                                link: currentBranchObj.url,
                            });
                        }
                    }
                }
            }



            // Add PullRequest Attachments
            if (issueBranchInfoResponse.detail) {
                var currentDetailObj;
                var k;

                for (k = 0; k < issueBranchInfoResponse.detail.length; k++) {
                    currentDetailObj = issueBranchInfoResponse.detail[k];
                    // console.log("PR currentDetailObj: ");
                    // console.log(currentDetailObj);

                    if (currentDetailObj.pullRequests) {

                        if (currentDetailObj.pullRequests.length > 0) {
                            var i = 0;
                            var currentPRObj;
                            var currentRepositoryUrl;
                            var repositoryObjIndex;
                            for (i = 0; i < currentDetailObj.pullRequests.length; i++) {
                                currentPRObj = currentDetailObj.pullRequests[i];

                                if (!currentPRObj.url) {
                                    continue;
                                }

                                if (!currentPRObj.url.includes("/pull")) {
                                    continue;
                                }


                                currentRepositoryUrl = currentPRObj.url.substring(0, currentPRObj.url.indexOf("/pull"));
                                repositoryObjIndex = repositoryObjList.findIndex(obj => obj.htmlUrl == currentRepositoryUrl);

                                foundAttachments.push({
                                    modelType: "pullRequest",
                                    sourceId: currentPRObj.id.replace("#", ""),
                                    repository: repositoryObjIndex >= 0 ? repositoryObjList[repositoryObjIndex]._id.toString() : undefined,
                                    board: issueObj.board,
                                    nonCodeId: issueObj._id.toString(),
                                    link: currentPRObj.url,
                                });
                            }
                        }
                    }
                }
            }
        }

        return { success: true, foundAttachments: foundAttachments };

    });

    // Execute all requests
    var issueAttachmentRequestResults;
    try {
        issueAttachmentRequestResults = await Promise.allSettled(issueDevelopmentInfoRequests);
    } catch (err) {


        console.log(err);

        Sentry.setContext("generateDirectAttachmentsFromIssues", {
            message: `JIRA API Issue Development Info Query failed`,
        });

        Sentry.captureException(err);

        throw err;
    }

    // Non-error responses
    var validResults = issueAttachmentRequestResults.filter(
        (resultObj) => resultObj.value && !resultObj.value.error
    );

    // Error responses
    var invalidResults = issueAttachmentRequestResults.filter(
        (resultObj) => resultObj.value && resultObj.value.error
    );

    validResults = validResults.map(obj => obj.value.foundAttachments);
    validResults = validResults.flat();
    return validResults;

}

const insertIntegrationAttachments = async (attachmentsToCreate) => {
    // Create/Insert IntegrationAttachments
    if (attachmentsToCreate.length > 0) {
        let bulkUpdateAttachmentsOps = attachmentsToCreate.map(
            (attachmentObj) => {
                return {
                    updateOne: {
                        filter: {
                            repository: (attachmentObj.repository) ? ObjectId(attachmentObj.repository) : undefined,
                            modelType: attachmentObj.modelType,
                            sourceId: attachmentObj.sourceId,
                            board: attachmentObj.board,
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
    }
}



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


const fetchIntegrationAttachments = async (
    attachmentsToCreate,
) => {
    if (attachmentsToCreate.length < 1) {
        return [];
    }

    var repositoryIdList = attachmentsToCreate.filter(attachmentObj => attachmentObj.hasOwnProperty("repository"));
    if (repositoryIdList.length > 0) {
        repositoryIdList = [...new Set(repositoryIdList.map(obj => obj.repository))];
    }

    console.log("fetchIntegrationAttachments - repositoryIdList: ");
    console.log(repositoryIdList);

    return await IntegrationAttachment.find(
        {
            repository: (repositoryIdList.length > 0) ? { $in: repositoryIdList.map(id => ObjectId(id)) } : undefined,
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

const generateAssociations = async (workspaceId, boards) => {


    var backendClient = apis.requestBackendClient();

    console.log(`Calling 'generateAssociations' - workspaceId: ${workspaceId}`);
    console.log("boards: ");
    console.log(boards);

    try {
        await backendClient.post(`/associations/${workspaceId}/generate_associations`, { boards: boards });
    }
    catch (err) {
        Sentry.captureException(err);
        throw err;
    }
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
        console.log(err);
        throw Error(`Error fetching JiraSite - jiraSiteId: ${jiraSiteId}`);
    }
    return jiraSiteObj;
};

const getJiraSiteProjects = async (
    jiraCloudIds,
    jiraApiClientList,
    jiraSiteId,
    jiraProjects,
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
            console.log(`projectListResponse.data.length: ${projectListResponse.data.length}`);
        }
        return { projectData: projectListResponse.data, cloudId };
    });

    // Execute all requests
    var projectListResults;
    try {
        projectListResults = await Promise.allSettled(projectSearchRequestList);
    } catch (err) {


        console.log(err);

        Sentry.setContext("import-jira-issues", {
            message: `JIRA API Project Search Query failed`,
            jiraCloudIds: jiraCloudIds,
        });

        Sentry.captureException(err);

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

    console.log(`projectListResults validResults.length: ${validResults.length}`);

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

            // Filter out projects where currentProject.id is not in jiraProjects[ {sourceId, repositoryIds} ]
            var sourceIdMatches = jiraProjects.filter(idPair => idPair.sourceId == currentProject.id);
            if (sourceIdMatches.length < 1) {
                continue;
            }


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

        console.log(err);

        Sentry.setContext("import-jira-issues", {
            message: `Error inserting IntegrationBoards(source = "jira")`,
            numJiraProjects: jiraProjectsToCreate.length,
        });

        Sentry.captureException(err);

        throw err;
    }

    return insertedJiraProjects;
};


const generateAssociationsFromResults = async (workspaceId, projectIdList, successResults) => {

    var createAssociationData = [];

    var i = 0;
    for (i = 0; i < successResults.length; i++) {
        createAssociationData.push({ _id: successResults[i].integrationBoardId, repositories: [successResults[i].repositoryId] });
    }

    var backendClient = apis.requestBackendClient();

    console.log(`Calling 'generate_associations' - workspaceId: ${workspaceId}`);
    console.log(createAssociationData);

    await findBoard(createAssociationData[0]._id);

    try {
        await backendClient.post(`/associations/${workspaceId}/generate_associations`, { boardId: createAssociationData[0]._id, boards: createAssociationData });
    }
    catch (err) {
        Sentry.captureException(err);
        throw err;
    }
}

const importJiraIssues = async () => {
    var worker = require("cluster").worker;

    var jiraSiteId = process.env.jiraSiteId;
    var jiraProjects = JSON.parse(process.env.jiraProjects);

    var jiraSite = await getJiraSiteObj(jiraSiteId);
    var personalAccessToken = jiraSite.personalAccessToken;
    var jiraEmailAddress = jiraSite.jiraEmailAddress;

    var workspaceId = process.env.workspaceId.toString();

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
            jiraProjects,
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

            console.log(`jiraApiClientList[0].defaults.baseURL: ${JSON.stringify(jiraApiClientList[0].defaults.baseURL)}`);

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
            /*
            if (idx < 1) {
                console.log(`issueListResponse.data.issues: ${JSON.stringify(issueListResponse.data.issues)}`);
            }
            */
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
        console.log(`Error fetching issue list - insertedJiraProjects: ${JSON.stringify(insertedJiraProjects)}`);
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

    console.log(`issueListResults issueValidResults.length: ${issueValidResults.length}`);

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
                sourceId: issueObj.id,
                workspace: ObjectId(workspaceId.toString()),
                board: promiseObj.value.projectId,
                jiraSiteId: promiseObj.value.siteId,
                jiraProjectId: promiseObj.value.projectId,
                jiraIssueId: issueObj.id,
                jiraIssueKey: issueObj.key,
                jiraIssueSummary: issueObj.fields.summary,
                // jiraIssueDescription: issueObj.fields.description,
                jiraIssueResolutionStatus: isResolved,
                jiraIssueResolutionDate: isResolved
                    ? issueObj.fields.resolutiondate
                    : undefined,
                jiraIssueCreationDate: issueObj.fields.created,
                jiraIssueUpdatedDate: issueObj.fields.updated,
                cloudId: promiseObj.value.cloudId,
            };
        });
        return newTickets;
    });

    jiraTicketList = jiraTicketList.flat();

    // Enrich Jira Issues
    // await enrichJiraIssueDirectAttachments(jiraTicketList);

    if (jiraTicketList.length > 0) {
        console.log(`jiraTicketList[0]: ${JSON.stringify(jiraTicketList[0])}`);

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
            console.log(`Error bulk inserting Jira Tickets - jiraTicketList: ${JSON.stringify(jiraTicketList)}`);

            throw new Error(
                `Error bulk inserting Jira Tickets - jiraTicketList: ${JSON.stringify(
                    jiraTicketList
                )}`
            );
        }

        // Fetch inserted Issues
        var scrapedIssues;
        try {
            scrapedIssues = await fetchJiraIssuesFromIdList(newIssueIds);
        }
        catch (err) {
            console.log(err);

            Sentry.setContext("import-jira-issues", {
                message: `fetchJiraIssuesFromIdList failed`,
                numIssueIds: newIssueIds.length,
            });

            Sentry.captureException(err);

            throw err;
        }



        // Personal Access Token -> ${personalAccessToken}

        // Fetch all Repository Objects
        var repositoryIdList = jiraProjects.map(idPair => idPair.repositoryIds);
        repositoryIdList = repositoryIdList.flat();
        repositoryIdList = repositoryIdList.map(id => id.toString());
        repositoryIdList = [...new Set(repositoryIdList)];


        var repositoryObjList;
        try {
            repositoryObjList = await fetchRepositoriesFromIdList(repositoryIdList, "_id htmlUrl");
        }
        catch (err) {
            console.log(err);

            Sentry.setContext("import-jira-issues", {
                message: `fetchRepositoriesFromIdList failed`,
                repositoryIdList: repositoryIdList,
            });

            Sentry.captureException(err);

            throw err;
        }

        console.log("repositoryObjList: ");
        console.log(repositoryObjList);

        console.log("scrapedIssues.length: ");
        console.log(scrapedIssues.length);

        console.log("personalAccessToken: ", personalAccessToken);


        if (personalAccessToken && jiraEmailAddress) {
            // Create Attachments
            var attachmentsToCreate;
            try {
                attachmentsToCreate = await generateDirectAttachmentsFromIssues(scrapedIssues, personalAccessToken, jiraEmailAddress, repositoryObjList);
            }
            catch (err) {
                console.log(err);

                Sentry.setContext("import-jira-issues", {
                    message: `generateDirectAttachmentsFromIssues failed`,
                    numScrapedIssue: scrapedIssues.length,
                    numRepositories: repositoryObjList.length,
                    personalAccessToken: personalAccessToken,
                });

                Sentry.captureException(err);

                throw err;
            }
        }

        console.log("generateDirectAttachmentsFromIssues - attachmentsToCreate: ");
        console.log(attachmentsToCreate);

        // insertIntegrationAttachments
        try {
            await insertIntegrationAttachments(attachmentsToCreate);
        }
        catch (err) {
            console.log(err);

            Sentry.setContext("import-jira-issues", {
                message: `insertIntegrationAttachments failed`,
                numAttachments: attachmentsToCreate.length,
            });

            Sentry.captureException(err);

            throw err;
        }

        // fetchIntegrationAttachments
        var insertedAttachments;
        try {
            insertedAttachments = await fetchIntegrationAttachments(attachmentsToCreate);
        }
        catch (err) {
            console.log(err);

            Sentry.setContext("import-jira-issues", {
                message: `fetchIntegrationAttachments failed`,
                numAttachments: attachmentsToCreate.length,
            });

            Sentry.captureException(err);

            throw err;
        }


        // addAttachmentsToIntegrationTickets
        var insertedAttachments;
        try {
            insertedAttachments = await addAttachmentsToIntegrationTickets(insertedAttachments);
        }
        catch (err) {
            console.log(err);

            Sentry.setContext("import-jira-issues", {
                message: `addAttachmentsToIntegrationTickets failed`,
                numAttachments: insertedAttachments.length,
            });

            Sentry.captureException(err);

            throw err;
        }

        // Map jiraProjects[{sourceId, repositoryIds}] to [{ |insertedJiraProjects.sourceId == sourceId|._id, repositoryIds  }]
        var finalProjectRepositoryMapping = jiraProjects.map(idPair => {
            var insertedProjectIdx = insertedJiraProjects.findIndex(projectObj => projectObj.sourceId == idPair.sourceId);
            if (insertedProjectIdx < 0) {
                return undefined;
            }
            return { _id: insertedJiraProjects[insertedProjectIdx]._id.toString(), repositories: idPair.repositoryIds };

        });

        finalProjectRepositoryMapping = finalProjectRepositoryMapping.filter(obj => (obj));

        console.log("finalProjectRepositoryMapping: ");
        console.log(finalProjectRepositoryMapping)

        // Update IntegrationBoard{source = "jira"}.repositories with repositoryIds
        if (finalProjectRepositoryMapping.length > 0) {

            let bulkUpdateIntegrationBoardOps = finalProjectRepositoryMapping.map(
                (idObj) => {
                    return {
                        updateOne: {
                            filter: {
                                _id: ObjectId(
                                    idObj._id.toString()
                                ),
                            },
                            // Where field is the field you want to update
                            update: {
                                $push: {
                                    repositories: idObj.repositories.map(id => ObjectId(id.toString())),
                                },
                            },
                            upsert: false,
                        },
                    };
                }
            );

            // mongoose bulkwrite for one many update db call
            try {
                await IntegrationBoard.bulkWrite(bulkUpdateIntegrationBoardOps);
            } catch (err) {
                console.log(err);
                Sentry.captureException(err);

                throw err;
            }
        }

        // Call Association Pipeline
        if (finalProjectRepositoryMapping.length > 0) {
            try {
                await generateAssociations(workspaceId, finalProjectRepositoryMapping);
            }
            catch (err) {
                console.log(err);
                Sentry.captureException(err);

                throw err;
            }
        }

        // Attach board to Workspace
        if (finalProjectRepositoryMapping.length > 0) {
            var boardsToAdd = finalProjectRepositoryMapping.map(obj => obj._id.toString());
            try {
                await Workspace.findOneAndUpdate({ _id: workspaceId }, { $push: { boards: boardsToAdd.map(boardId => ObjectId(boardId.toString())) } });
            }
            catch (err) {
                console.log(err);
                Sentry.captureException(err);

                throw err;
            }
        }

    }

}



/*
// Create Integration Intervals for Issues
try {
    await createJiraIssueIntervals(newIssueIds);
} catch (err) {
    console.log(err);
    throw Error(`Error creating Jira Issue IntegrationIntervals`);
}
*/


module.exports = {
    importJiraIssues,
};
