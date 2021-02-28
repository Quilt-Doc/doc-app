const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const { serializeError, deserializeError } = require("serialize-error");

const IntegrationBoard = require("../../models/integrations/integration_objects/IntegrationBoard");
const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");

// Scrape a single github repo, call with Promises and so forth to scrape all repositories
// Assumption GithubProject Column names are unique
// KARAN TODO: Decide if this method should be in a transaction or not, currently don't think there's really a need
scrapeGithubRepoProjects = async (
    installationId,
    repositoryId,
    installationClient,
    repositoryObj,
    workspaceId,
    worker
) => {
    /*
    Lists the projects in a repository.
    Returns a 404 Not Found status if projects are disabled in the repository.
    If you do not have sufficient privileges to perform this action,
        a 401 Unauthorized or 410 Gone status is returned.

    GET /repos/:owner/:repo/projects

    Parameter:
    state	string	query	
    Indicates the state of the projects to return. Can be either open, closed, or all.

    per_page	integer	query	
    Results per page (max 100)

    page	integer	query	
    Page number of the results to fetch.
    */

    // Get all projects attached to this Repository

    var repositoryProjectResponse;
    try {
        repositoryProjectResponse = await installationClient.get(
            `/repos/${repositoryObj.fullName}/projects`,
            {
                headers: {
                    Accept: "application/vnd.github.inertia-preview+json",
                },
            }
        );
    } catch (err) {
        // KARAN TODO: Detect if this error is a 401, 404, 410, etc
        await worker.send({
            action: "log",
            info: {
                level: "error",
                message: serializeError(err),
                errorDescription: `Error running getting Github repository projects - fullName, installationId: ${repositoryObj.fullName}, ${installationId}`,
                source: "worker-instance",
                function: "scrapeGithubRepoProjects",
            },
        });

        throw new Error(
            `Error getting Github repository projects - fullName, installationId: ${repositoryObj.fullName}, ${installationId}`
        );
    }

    var repositoryProjectList = repositoryProjectResponse.data;

    // Bulk create GithubProject models for all Objects found

    const bulkGithubProjectInsertList = repositoryProjectList.map(
        (repositoryProjectObjectResponse, idx) => {
            return {
                source: "github",
                sourceId: repositoryProjectObjectResponse.id, // == projectId
                repositoryId: repositoryId,
                projectId: repositoryProjectObjectResponse.id,
                number: repositoryProjectObjectResponse.number,
                name: repositoryProjectObjectResponse.name,
                body: repositoryProjectObjectResponse.body,
                state: repositoryProjectObjectResponse.state,
                createdAt: repositoryProjectObjectResponse.created_at,
                updatedAt: repositoryProjectObjectResponse.updated_at,
            };
        }
    );

    if (bulkGithubProjectInsertList.length > 0) {
        var bulkInsertResult;
        var newGithubProjectIds;
        try {
            bulkInsertResult = await IntegrationBoard.insertMany(
                bulkGithubProjectInsertList,
                { rawResult: true }
            );

            newGithubProjectIds = Object.values(
                bulkInsertResult.insertedIds
            ).map((id) => id.toString());

            await worker.send({
                action: "log",
                info: {
                    level: "info",
                    message: `IntegrationBoard(source="github") insertMany success - bulkInsertResult: ${JSON.stringify(
                        bulkInsertResult
                    )}`,
                    source: "worker-instance",
                    function: "scrapeGithubRepoProjects",
                },
            });
        } catch (err) {
            await worker.send({
                action: "log",
                info: {
                    level: "error",
                    message: serializeError(err),
                    errorDescription: `IntegrationBoard(source="github") insertMany failed - bulkGithubProjectInsertList: ${JSON.stringify(
                        bulkGithubProjectInsertList
                    )}`,
                    source: "worker-instance",
                    function: "scrapeGithubRepoProjects",
                },
            });

            transactionAborted = true;
            transactionError.message = `IntegrationBoard(source="github") insertMany failed - bulkGithubProjectInsertList: ${JSON.stringify(
                bulkGithubProjectInsertList
            )}`;

            throw new Error(
                `IntegrationBoard(source="github") insertMany failed - bulkGithubProjectInsertList: ${JSON.stringify(
                    bulkGithubProjectInsertList
                )}`
            );
        }
    }
    // No Github Projects found, return from method
    else {
        return;
    }

    // Need to use the insertedIds of the new GithubProjects to get the full, unified object from the DB
    var createdGithubProjects;
    try {
        createdGithubProjects = await IntegrationBoard.find({
            _id: { $in: newGithubProjectIds.map((id) => ObjectId(id)) },
        })
            .lean()
            .exec();
    } catch (err) {
        await worker.send({
            action: "log",
            info: {
                level: "error",
                message: serializeError(err),
                errorDescription: `IntegrationBoard(source="github") find failed - newGithubProjectIds: ${JSON.stringify(
                    newGithubProjectIds
                )}`,
                source: "worker-instance",
                function: "scrapeGithubRepoProjects",
            },
        });

        throw new Error(
            `GithubProject find failed - newGithubProjectIds: ${JSON.stringify(
                newGithubProjectIds
            )}`
        );
    }

    // Query each GithubProject to get all of the columns for each Project
    // GET /projects/{project_id}/columns

    // KARAN TODO:  Handle case where there's more than 100 columns and result is paginated
    var projectColumnsRequestList = createdGithubProjects.map(
        async (githubProjectObj, idx) => {
            var columnListResponse;

            // GET /rest/api/3/project/search
            try {
                // "Accept: application/vnd.github.inertia-preview+json"
                columnListResponse = await installationClient.get(
                    `/projects/${githubProjectObj.projectId}/columns`,
                    {
                        headers: {
                            Accept:
                                "application/vnd.github.inertia-preview+json",
                        },
                    }
                );
            } catch (err) {
                console.log(err);
                return { error: "Error" };
            }
            return {
                columnData: columnListResponse.data,
                githubProjectId: githubProjectObj._id.toString(),
            };
        }
    );

    // Execute all requests
    var columnListResults;
    try {
        columnListResults = await Promise.allSettled(projectColumnsRequestList);
    } catch (err) {
        await worker.send({
            action: "log",
            info: {
                level: "error",
                source: "worker-instance",
                message: serializeError(err),
                errorDescription: `Error fetching column list - bulkGithubProjectInsertList: ${JSON.stringify(
                    bulkGithubProjectInsertList
                )}`,
                function: "scrapeGithubRepoProjects",
            },
        });
        throw err;
    }

    // Non-error responses
    var validResults = columnListResults.filter(
        (resultObj) => resultObj.value && !resultObj.value.error
    );

    // Error responses
    var invalidResults = columnListResults.filter(
        (resultObj) => resultObj.value && resultObj.value.error
    );

    await worker.send({
        action: "log",
        info: {
            level: "info",
            message: `columnListResults validResults.length: ${validResults.length}`,
            source: "worker-instance",
            function: "scrapeGithubRepoProjects",
        },
    });

    // promiseObj has columnData, which is a list of all columns for the project,
    // and githubProjectId which is an ObjectId of the GithubProject in the database
    var projectColumnsList = validResults.map((promiseObj) => {
        return promiseObj.value;
    });

    // Create the bulkUpdateOps list which will be used to add the arrays of columns to the GithubProject list
    let bulkWriteColumnOps = projectColumnsList.map((projectColumnsData) => {
        var currentColumnUpdate = projectColumnsData.columnData.map(
            (columnObj) => columnObj.name
        );
        var currentColumnIdUpdate = projectColumnsData.columnData.map(
            (columnObj) => columnObj.id
        );
        return {
            updateOne: {
                filter: {
                    _id: ObjectId(
                        projectColumnsData.githubProjectId.toString()
                    ),
                },
                // Where field is the field you want to update
                update: {
                    $set: {
                        columns: currentColumnUpdate,
                        columnIdList: currentColumnIdUpdate,
                    },
                },
                upsert: false,
            },
        };
    });

    // Update all of the created GithubProjects with their columns
    // KARAN TODO: Verify that these columns are in order
    try {
        await IntegrationBoard.bulkWrite(bulkWriteColumnOps);
    } catch (err) {
        await worker.send({
            action: "log",
            info: {
                level: "error",
                source: "worker-instance",
                message: serializeError(err),
                errorDescription: `Error bulk writing columns to IntegrationBoard(source="github") - projectColumnsList: ${JSON.stringify(
                    projectColumnsList
                )}`,
                function: "scrapeGithubRepoProjects",
            },
        });
        throw err;
    }

    // Get all of the GithubProjects, which will now have both a list of column names and column ids

    var columnCompleteGithubProjects;

    try {
        columnCompleteGithubProjects = await IntegrationBoard.find({
            repositoryId: ObjectId(repositoryId.toString()),
        })
            .lean()
            .exec();
    } catch (err) {
        await worker.send({
            action: "log",
            info: {
                level: "error",
                source: "worker-instance",
                message: serializeError(err),
                errorDescription: `Error finding IntegrationBoard(source="github") - repositoryId: ${JSON.stringify(
                    projectColumnsList
                )}`,
                function: "scrapeGithubRepoProjects",
            },
        });
        throw err;
    }

    // Query Each GithubProject to get all of the cards associated with each project
    // Handle pagination

    // GET /projects/columns/{column_id}/cards
    /*
        accept	string	header	
        This API is under preview and subject to change. See preview notice

        column_id	integer	path	
        column_id parameter

        archived_state	string	query	
        Filters the project cards that are returned by the card's state. Can be one of all,archived, or not_archived.

        per_page	integer	query	
        Results per page (max 100)

        page	integer	query	
        Page number of the results to fetch.
    */

    var columnCardRequestList = columnCompleteGithubProjects.map(
        async (projectObj, idx) => {
            // Create list to use in Promise.all, each element will be used to get all of the cards for one column

            var allCardsInColumnRequestList = projectObj.columns.map(
                async (columnName, idx2) => {
                    var cardPageResponse;

                    var perPage = 100;
                    var pageNum = 0;

                    var cardResultsExhausted = false;

                    var allCardsInColumn = [];

                    while (!cardResultsExhausted) {
                        // GET /projects/columns/{column_id}/cards
                        try {
                            // "Accept: application/vnd.github.inertia-preview+json"
                            cardPageResponse = await installationClient.get(
                                `/projects/columns/${projectObj.columnIdList[idx2]}/cards?page=${pageNum}&per_page=${perPage}`,
                                {
                                    headers: {
                                        Accept:
                                            "application/vnd.github.inertia-preview+json",
                                    },
                                }
                            );
                        } catch (err) {
                            console.log(err);
                            break;
                            // return {error: 'Error'};
                        }

                        // Get results and concatenate each page of card results together
                        var cardPage = cardPageResponse.data;

                        // If < 100 cards returned, this is the last page we needed to query for
                        if (cardPage.length < 100) {
                            cardResultsExhausted = true;
                        }

                        allCardsInColumn.push(cardPage);

                        pageNum++;
                    }

                    allCardsInColumn = allCardsInColumn.flat();

                    // if (idx2 == 0) {

                    await worker.send({
                        action: "log",
                        info: {
                            level: "info",
                            message: `Scraped cards for column ${columnName} - allCardsInColumn.length, columnName, columnId: ${allCardsInColumn.length}, ${columnName}, ${projectObj.columnIdList[idx2]}`,
                            source: "worker-instance",
                            function: "scrapeGithubRepoProjects",
                        },
                    });

                    // }

                    return {
                        cardData: allCardsInColumn,
                        columnData: {
                            columnName: columnName,
                            columnId: projectObj.columnIdList[idx2],
                        },
                    };
                }
            );

            // Execute all requests
            var cardPageResults;
            try {
                cardPageResults = await Promise.allSettled(
                    allCardsInColumnRequestList
                );
            } catch (err) {
                await worker.send({
                    action: "log",
                    info: {
                        level: "error",
                        source: "worker-instance",
                        message: serializeError(err),
                        errorDescription: `Error fetching all cards from column - projectObj: ${JSON.stringify(
                            projectObj
                        )}`,
                        function: "scrapeGithubRepoProjects",
                    },
                });
                throw err;
            }

            if (idx == 0) {
                await worker.send({
                    action: "log",
                    info: {
                        level: "info",
                        message: `cardPageResults.length: ${cardPageResults.length}`,
                        source: "worker-instance",
                        function: "scrapeGithubRepoProjects",
                    },
                });
            }

            // Non-error responses
            var validCardResults = cardPageResults.filter(
                (resultObj) => resultObj.value && !resultObj.value.error
            );

            // Error responses
            var invalidCardResults = cardPageResults.filter(
                (resultObj) => resultObj.value && resultObj.value.error
            );

            if (idx == 0) {
                await worker.send({
                    action: "log",
                    info: {
                        level: "info",
                        message: `cardPageResults validCardResults.length: ${validCardResults.length}`,
                        source: "worker-instance",
                        function: "scrapeGithubRepoProjects",
                    },
                });
            }

            // promiseObj has columnData, which is a list of all columns for the project,
            // and githubProjectId which is an ObjectId of the GithubProject in the database
            var finalCardsInEachColumn = validCardResults.map((promiseObj) => {
                return promiseObj.value;
            });

            finalCardsInEachColumn = finalCardsInEachColumn.flat();

            return {
                columnsCardLists: finalCardsInEachColumn,
                githubProjectObj: projectObj,
            };
        }
    );

    // Execute all requests
    var allCardsInAllColumnsResults;
    try {
        allCardsInAllColumnsResults = await Promise.allSettled(
            columnCardRequestList
        );
    } catch (err) {
        await worker.send({
            action: "log",
            info: {
                level: "error",
                source: "worker-instance",
                message: serializeError(err),
                errorDescription: `Error fetching all cards all GithubProjects - columnCompleteGithubProjects: ${JSON.stringify(
                    columnCompleteGithubProjects
                )}`,
                function: "scrapeGithubRepoProjects",
            },
        });
        throw err;
    }

    // Non-error responses
    var validAllCardsInAllColumnsResults = allCardsInAllColumnsResults.filter(
        (resultObj) => resultObj.value && !resultObj.value.error
    );

    // Error responses
    var invalidAllCardsInAllColumnsResults = allCardsInAllColumnsResults.filter(
        (resultObj) => resultObj.value && resultObj.value.error
    );

    // validAllCardsInAllColumnsResults Structure:
    // validAllCardsInAllColumnsResults[0] = { value: { columnsCardLists: [{ cardData: allCardsInColumn, columnData: {columnName: columnName, columnId: projectObj.columnIdList[idx2]} }], githubProjectObj: projectObj } }

    var allTicketsToCreate = [];

    validAllCardsInAllColumnsResults.map((promiseObj) => {
        // promiseObj.value here is: { columnsCardLists: finalCardsInEachColumn, githubProjectObj: projectObj }

        var currentProjectCardsList = promiseObj.value;

        // Create a Ticket for each of the Cards in each of the columns of the Project
        // Iterate through list of columns
        for (i = 0; i < currentProjectCardsList.columnsCardLists.length; i++) {
            
            var currentColumnCardList = currentProjectCardsList.columnsCardLists[i].cardData;
            var currentColumnName = currentProjectCardsList.columnsCardLists[i].columnData.columnName;
            var currentColumnId = currentProjectCardsList.columnsCardLists[i].columnData.columnId;

            var currentCard;

            // Iterate through list of cards within column
            for (k = 0; k < currentColumnCardList.length; k++) {
                currentCard = currentColumnCardList[k];

                // Data needed per ticket
                /*
                    githubCardGithubProjectId: { type: ObjectId, ref: 'IntegrationBoard'},

                    githubCardNote: { type: String, required: true },

                    githubCardColumnId: { type: String, required: true },

                    githubCardCreatedAt: { type: Date, required: true },
                    githubCardUpdatedAt: { type: Date, required: true },

                */

                /*
                if (currentCard.note == null) {
                    worker.send({action: 'log', info: {level: 'info', 
                                                                message: `Card found with null note - currentCard, githubCardGithubProjectId: ${JSON.stringify(currentCard)}, ${currentProjectCardsList.githubProjectObj._id.toString()}`,
                                                                source: 'worker-instance',
                                                                function:'scrapeGithubRepoProjects'}});
                }
                */

                allTicketsToCreate.push({
                    source: "github",
                    workspace: ObjectId(workspaceId.toString()),
                    githubCardGithubProjectId: ObjectId(
                        currentProjectCardsList.githubProjectObj._id.toString()
                    ),
                    githubCardId: currentCard.id,
                    githubCardNote: currentCard.note,
                    githubCardColumnId: currentColumnId,
                    githubCardCreatedAt: currentCard.created_at,
                    githubCardUpdatedAt: currentCard.updated_at,
                    isGithubCard: true,
                });
            }
        }

        return;
    });

    allTicketsToCreate = allTicketsToCreate.flat();

    await worker.send({
        action: "log",
        info: {
            level: "info",
            message: `allTicketsToCreate.length: ${allTicketsToCreate.length}`,
            source: "worker-instance",
            function: "scrapeGithubRepoProjects",
        },
    });

    var bulkInsertResult;
    try {
        bulkInsertResult = await IntegrationTicket.insertMany(
            allTicketsToCreate
        );
    } catch (err) {
        await worker.send({
            action: "log",
            info: {
                level: "error",
                source: "worker-instance",
                message: serializeError(err),
                errorDescription: `Error bulk inserting Github Cards - allTicketsToCreate: ${JSON.stringify(
                    allTicketsToCreate
                )}`,
                function: "scrapeGithubRepoProjects",
            },
        });

        throw new Error(
            `Error bulk inserting Github Cards - allTicketsToCreate: ${JSON.stringify(
                allTicketsToCreate
            )}`
        );
    }
};

module.exports = {
    scrapeGithubRepoProjects,
};
