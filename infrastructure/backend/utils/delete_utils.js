
/*
deleteWorkspace = async (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();

    var deletedWorkspace;
    const session = await db.startSession();

    let output = {};

    await logger.info({
        source: "backend-api",
        message: `Attempting to delete Workspace ${workspaceId} - userId: ${req.tokenPayload.userId}`,
        function: "deleteWorkspace",
    });
    try {
        await session.withTransaction(async () => {
            // Delete All Documents
            var deleteDocumentResponse;
            try {
                deleteDocumentResponse = await Document.deleteMany(
                    { workspace: ObjectId(workspaceId) },
                    { session }
                ).exec();
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: Document deleteMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: Document deleteMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: Document deleteMany query failed - workspaceId: ${workspaceId}`
                );
            }

            // Delete All Snippets
            var deleteSnippetResponse;
            try {
                deleteSnippetResponse = await Snippet.deleteMany(
                    { workspace: ObjectId(workspaceId) },
                    { session }
                ).exec();
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: Snippet deleteMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: Snippet deleteMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: Snippet deleteMany query failed - workspaceId: ${workspaceId}`
                );
            }

            // Delete All Tags
            var deleteTagResponse;
            try {
                deleteTagResponse = await Tag.deleteMany(
                    { workspace: ObjectId(workspaceId) },
                    { session }
                ).exec();
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: Tag deleteMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: Tag deleteMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: Tag deleteMany query failed - workspaceId: ${workspaceId}`
                );
            }

            // Delete All WorkspaceInvites
            var deleteWorkspaceInviteResponse;
            try {
                deleteWorkspaceInviteResponse = await WorkspaceInvite.deleteMany(
                    { workspace: ObjectId(workspaceId) },
                    { session }
                ).exec();
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: WorkspaceInvite deleteMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: WorkspaceInvite deleteMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: WorkspaceInvite deleteMany query failed - workspaceId: ${workspaceId}`
                );
            }

            // Delete All UserStats
            var deleteUserStatsResponse;
            try {
                deleteUserStatsResponse = await UserStats.deleteMany(
                    { workspace: ObjectId(workspaceId) },
                    { session }
                ).exec();
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: UserStats deleteMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: UserStats deleteMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: UserStats deleteMany query failed - workspaceId: ${workspaceId}`
                );
            }

            // Delete All ActivityFeedItem
            var deleteActivityFeedItemResponse;
            try {
                deleteActivityFeedItemResponse = await ActivityFeedItem.deleteMany(
                    { workspace: ObjectId(workspaceId) },
                    { session }
                ).exec();
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: ActivityFeedItem deleteMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: ActivityFeedItem deleteMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: ActivityFeedItem deleteMany query failed - workspaceId: ${workspaceId}`
                );
            }

            // Remove Workspace from User.workspaces for every user in the workspace
            var removeWorkspaceResponse;
            var usersInWorkspace;
            try {
                usersInWorkspace = await User.find({
                    workspaces: { $in: [ObjectId(workspaceId)] },
                })
                    .select("_id")
                    .lean()
                    .exec();
                usersInWorkspace = usersInWorkspace.map((userObj) =>
                    userObj._id.toString()
                );

                removeWorkspaceResponse = await User.updateMany(
                    { workspaces: { $in: [ObjectId(workspaceId)] } },
                    { $pull: { workspaces: { $in: [ObjectId(workspaceId)] } } },
                    { session }
                ).exec();
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: User remove Workspace updateMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: User remove Workspace updateMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: User remove Workspace updateMany query failed - workspaceId: ${workspaceId}`
                );
            }

            // Create 'removed_workspace Notifications'
            var notificationData = usersInWorkspace.map((id) => {
                return {
                    type: "removed_workspace",
                    user: id.toString(),
                    workspace: workspaceId,
                };
            });

            // Create 'removed_workspace' Notifications
            try {
                await NotificationController.createRemovedNotifications(
                    notificationData
                );
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: createdRemovedNotifications failed - workspaceId, usersInWorkspace: ${workspaceId}, ${JSON.stringify(
                        usersInWorkspace
                    )}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: createdRemovedNotifications failed - workspaceId, usersInWorkspace: ${workspaceId}, ${JSON.stringify(
                        usersInWorkspace
                    )}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: createdRemovedNotifications failed - workspaceId, usersInWorkspace: ${workspaceId}, ${JSON.stringify(
                        usersInWorkspace
                    )}`
                );
            }

            // Delete Workspace
            try {
                deletedWorkspace = await Workspace.findByIdAndRemove(
                    workspaceId,
                    { session }
                )
                    .select("_id repositories")
                    .lean()
                    .exec();
            } catch (err) {
                console.log(err);
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: workspace findByIdAndRemove query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: workspace findByIdAndRemove query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: workspace findByIdAndRemove query failed - workspaceId: ${workspaceId}`
                );
            }

            // INTEGRATION DELETION SECTION START --------------------------------------------------------

            var workspaceRepositories = deletedWorkspace.repositories;

            // Commit -- delete all Commits that have 'repository' ids from repos on workspace
            var deleteCommitsResponse;
            try {
                deleteCommitsResponse = await Commit.deleteMany(
                    {
                        repository: {
                            $in: workspaceRepositories.map((id) =>
                                ObjectId(id.toString())
                            ),
                        },
                    },
                    { session }
                ).exec();
            } catch (err) {
                console.log(err);
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteCommits error: Commits deleteMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteCommits error: Commits deleteMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteCommits error: Commits deleteMany query failed - workspaceId: ${workspaceId}`
                );
            }

            // PullRequest -- delete all PullRequests that have 'repository' ids from repos on workspace
            var deletePullRequestsResponse;
            try {
                deletePullRequestsResponse = await PullRequest.deleteMany(
                    {
                        repository: {
                            $in: workspaceRepositories.map((id) =>
                                ObjectId(id.toString())
                            ),
                        },
                    },
                    { session }
                ).exec();
            } catch (err) {
                console.log(err);
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deletePullRequests error: PullRequests deleteMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deletePullRequests error: PullRequests deleteMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deletePullRequests error: PullRequests deleteMany query failed - workspaceId: ${workspaceId}`
                );
            }

            // Branch -- delete all Branches that have 'repository' ids from repos on workspace
            var deleteBranchesResponse;
            try {
                deleteBranchesResponse = await Branch.deleteMany(
                    {
                        repository: {
                            $in: workspaceRepositories.map((id) =>
                                ObjectId(id.toString())
                            ),
                        },
                    },
                    { session }
                ).exec();
            } catch (err) {
                console.log(err);
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteBranches error: Branch deleteMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteBranches error: Branch deleteMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteBranches error: Branch deleteMany query failed - workspaceId: ${workspaceId}`
                );
            }

            // IntegrationBoards(source = "github") -- delete all github projects from Repositories on the Workspace
            // Delete All github projects
            var deleteGithubProjectsResponse;
            try {
                deleteGithubProjectsResponse = await IntegrationBoard.deleteMany(
                    {
                        repositoryId: {
                            $in: workspaceRepositories.map((id) =>
                                ObjectId(id.toString())
                            ),
                        },
                    },
                    { session }
                ).exec();
            } catch (err) {
                console.log(err);
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteGithubProjects error: IntegrationBoards deleteMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteGithubProjects error: IntegrationBoards deleteMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteGithubProjects error: IntegrationBoards deleteMany query failed - workspaceId: ${workspaceId}`
                );
            }


            // IntegrationTicket -- delete all Github Issues from Repositories on the Workspace
            // Delete All IntegrationTickets(github issues)
            var deleteGithubIssuesResponse;
            try {
                deleteGithubIssuesResponse = await IntegrationTicket.deleteMany(
                    {
                        source: "github",
                        repositoryId: {
                            $in: workspaceRepositories.map((id) =>
                                ObjectId(id.toString())
                            ),
                        },
                    },
                    { session }
                ).exec();
            } catch (err) {
                console.log(err);
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteGithubIssues error: IntegrationTicket deleteMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteGithubIssues error: IntegrationTicket deleteMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteGithubIssues error: IntegrationTicket deleteMany query failed - workspaceId: ${workspaceId}`
                );
            }

            // JiraSite -- has a workspaceId attached
            // Delete All JiraSites
            var deletedJiraSites;

            var jiraSitesToDelete;

            try {
                jiraSitesToDelete = await JiraSite.find(
                    { workspace: ObjectId(workspaceId.toString()) },
                    "_id",
                    { session }
                )
                    .lean()
                    .exec();
            } catch (err) {
                console.log(err);
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: JiraSites find query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: JiraSites find query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: JiraSites find query failed - workspaceId: ${workspaceId}`
                );
            }

            try {
                // deletedWorkspace = await Workspace.findByIdAndRemove(workspaceId, { session }).select('_id repositories').lean().exec();
                deletedJiraSites = await JiraSite.deleteMany(
                    {
                        _id: {
                            $in: jiraSitesToDelete.map((jiraSiteObj) =>
                                ObjectId(jiraSiteObj._id.toString())
                            ),
                        },
                    },
                    { session }
                ).exec();
            } catch (err) {
                console.log(err);
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteJiraSites error: JiraSites deleteMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteJiraSites error: JiraSites deleteMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteJiraSites error: JiraSites deleteMany query failed - workspaceId: ${workspaceId}`
                );
            }

            // IntegrationBoard -- Use the Ids of all the JiraSites found to be deleted in the prior step
            // Delete All IntegrationBoards from Jira (jira projects)
            var deleteJiraProjectsResponse;
            try {
                deleteJiraProjectsResponse = await IntegrationBoard.deleteMany(
                    {
                        source: "jira",
                        jiraSiteId: {
                            $in: jiraSitesToDelete.map((jiraSiteObj) =>
                                ObjectId(jiraSiteObj._id.toString())
                            ),
                        },
                    },
                    { session }
                ).exec();
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteJiraProjects error: IntegrationBoard(source = "jira") deleteMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteJiraProjects error: IntegrationBoard(source = "jira") deleteMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteJiraProjects error: IntegrationBoard(source = "jira") deleteMany query failed - workspaceId: ${workspaceId}`
                );
            }

            // IntegrationTicket -- has a workspaceId attached
            // Delete All IntegrationTickets
            var deleteTicketResponse;
            try {
                deleteTicketResponse = await IntegrationTicket.deleteMany(
                    { workspace: ObjectId(workspaceId) },
                    { session }
                ).exec();
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteTicket error: IntegrationTicket deleteMany query failed - workspaceId: ${workspaceId}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteTicket error: IntegrationTicket deleteMany query failed - workspaceId: ${workspaceId}`,
                    trace: err,
                };
                throw new Error(
                    `deleteTicket error: IntegrationTicket deleteMany query failed - workspaceId: ${workspaceId}`
                );
            }

            // INTEGRATION DELETION SECTION END --------------------------------------------------------

            // Set all Repositories in deletedWorkspace.repositories back to 'initRepository state'
            // scanned: false,
            // currentlyScanning: false

            console.log("DELETED WORKPSACE: ");
            console.log(deletedWorkspace);

            var initRepositories = deletedWorkspace.repositories.map(
                (repositoryObj) => ObjectId(repositoryObj._id.toString())
            );
            var repositoryInitResponse;
            try {
                repositoryInitResponse = await Repository.updateMany(
                    { _id: { $in: initRepositories } },
                    { $set: { scanned: false, currentlyScanning: false } },
                    { session }
                ).exec();
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: Repository updateMany query failed - workspaceId, initRepositories: ${workspaceId}, ${JSON.stringify(
                        initRepositories
                    )}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: Repository updateMany query failed - workspaceId, initRepositories: ${workspaceId}, ${JSON.stringify(
                        initRepositories
                    )}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: Repository updateMany query failed - workspaceId, initRepositories: ${workspaceId}, ${JSON.stringify(
                        initRepositories
                    )}`
                );
            }

            // Delete all References matched by - { repository: { $in: initRepositories.map(id => ObjectId(id.toString())) }, root: false }
            var deleteReferenceResponse;
            try {
                deleteReferenceResponse = await Reference.deleteMany(
                    { repository: { $in: initRepositories }, root: false },
                    { session }
                );
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    error: err,
                    errorDescription: `deleteWorkspace error: Reference deleteMany query failed - workspaceId, initRepositories: ${workspaceId}, ${JSON.stringify(
                        initRepositories
                    )}`,
                    function: "deleteWorkspace",
                });

                output = {
                    success: false,
                    error: `deleteWorkspace error: Reference deleteMany query failed - workspaceId, initRepositories: ${workspaceId}, ${JSON.stringify(
                        initRepositories
                    )}`,
                    trace: err,
                };
                throw new Error(
                    `deleteWorkspace error: Reference deleteMany query failed - workspaceId, initRepositories: ${workspaceId}, ${JSON.stringify(
                        initRepositories
                    )}`
                );
            }

            await logger.info({
                source: "backend-api",
                message: `Successfully deleted Workspace ${workspaceId} - userId, repositoryIds: ${
                    req.tokenPayload.userId
                }, ${JSON.stringify(initRepositories)}`,
                function: "deleteWorkspace",
            });

            output = { success: true, result: deletedWorkspace };
            return;
        });
    } catch (err) {
        session.endSession();
        return res.json(output);
    }

    session.endSession();

    return res.json(output);

    // return res.json({success: true, result: deletedWorkspace});
};

*/

