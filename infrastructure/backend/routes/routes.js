// TODO: Add Workspace, Repository Delete Routes and methods
const passport = require("passport");
var cors = require("cors");

var CLIENT_HOME_PAGE_URL = process.env.LOCALHOST_HOME_PAGE_URL;

if (process.env.IS_PRODUCTION) {
    CLIENT_HOME_PAGE_URL = process.env.PRODUCTION_HOME_PAGE_URL;
}

var INSTALLED_URL = process.env.LOCALHOST_INSTALLED_URL;
if (process.env.IS_PRODUCTION) {
    INSTALLED_URL = process.env.PRODUCTION_INSTALLED_URL;
}

var ONBOARD_URL = process.env.LOCALHOST_ONBOARD_URL;
if (process.env.IS_PRODUCTION) {
    ONBOARD_URL = process.env.PRODUCTION_ONBOARD_URL;
}

const express = require("express");
const router = express.Router({ mergeParams: true });
const paramMiddleware = require("../utils/param_middleware");

const authorizationMiddleware = require("../utils/authorization_middleware");
const permissionsMiddleware = require("../utils/permissions_middleware");

const { createUserJWTToken } = require("../utils/jwt");

router.param("workspaceId", paramMiddleware.workspaceIdParam);
router.param("referenceId", paramMiddleware.referenceIdParam);
router.param("documentId", paramMiddleware.documentIdParam);
router.param("tagId", paramMiddleware.tagIdParam);
router.param("snippetId", paramMiddleware.snippetIdParam);
router.param("repositoryId", paramMiddleware.repositoryIdParam);
router.param("userId", paramMiddleware.userIdParam);

// router.param('linkageId', paramMiddleware.linkageIdParam);

//base routes

// create - verify user is dev (this can't be called by normal user) -- DONE

// get - add :workspaceId, check if user is in workspace,
//      make handler requests scoped to the workspace -- DONE
// edit - add :workspaceId, check if user is in workspace,
//      make handler requests scoped to the workspace -- DONE
// delete - add :workspaceId, check if user is in workspace
//      make handler requests scoped to the workspace -- DONE
// attach_tag - add :workspaceId, check if user is in workspace
//      make handler requests scoped to the workspace -- DONE
// remove_tag - add :workspaceId, check if user is in workspace
//      make handler requests scoped to the workspace -- DONE
// retrieve - add :workspaceId, check if user is in workspace
//      make handler requests scoped to the workspace -- DONE
// retrieve_code_references - add :workspaceId, check if user is in workspace
//      make handler requests scoped to the workspace -- DONE

// Need to be checking that if :referenceId then :referenceId repositoryId in workspace `repositories`
// Need to be checking if :tagId then `workspace` in Tag matches :workspaceId

// Validate workspace membership for calling user; all methods
const documentController = require("../controllers/DocumentController");
router.post(
    "/documents/:workspaceId/create",
    authorizationMiddleware.documentMiddleware,
    documentController.createDocument
);
router.get(
    "/documents/:workspaceId/get/:documentId",
    authorizationMiddleware.documentMiddleware,
    documentController.getDocument
);
router.put(
    "/documents/:workspaceId/edit/:documentId",
    authorizationMiddleware.documentMiddleware,
    documentController.editDocument
);
router.delete(
    "/documents/:workspaceId/delete/:documentId",
    authorizationMiddleware.documentMiddleware,
    documentController.deleteDocument
);
router.put(
    "/documents/:workspaceId/rename/:documentId",
    authorizationMiddleware.documentMiddleware,
    documentController.renameDocument
);
router.put(
    "/documents/:workspaceId/move/:documentId",
    authorizationMiddleware.documentMiddleware,
    documentController.moveDocument
);
router.post(
    "/documents/:workspaceId/retrieve",
    authorizationMiddleware.documentMiddleware,
    documentController.retrieveDocuments
);
router.post(
    "/documents/:workspaceId/search",
    authorizationMiddleware.documentMiddleware,
    documentController.searchDocuments
);
router.post(
    "/documents/:workspaceId/get_image/:documentId",
    authorizationMiddleware.documentMiddleware,
    documentController.getDocumentImage
);
router.post(
    "/documents/:workspaceId/pusher/auth",
    documentController.authorizeDocumentPusher
);

router.post("/testRoute", documentController.testRoute);

router.put(
    "/documents/:workspaceId/:documentId/attach_tag/:tagId",
    authorizationMiddleware.documentMiddleware,
    documentController.attachDocumentTag
);
router.put(
    "/documents/:workspaceId/:documentId/remove_tag/:tagId",
    authorizationMiddleware.documentMiddleware,
    documentController.removeDocumentTag
);

router.put(
    "/documents/:workspaceId/:documentId/attach_reference/:referenceId",
    authorizationMiddleware.documentMiddleware,
    documentController.attachDocumentReference
);
router.put(
    "/documents/:workspaceId/:documentId/remove_reference/:referenceId",
    authorizationMiddleware.documentMiddleware,
    documentController.removeDocumentReference
);

router.put(
    "/documents/:workspaceId/:documentId/attach_snippet/:snippetId",
    authorizationMiddleware.documentMiddleware,
    documentController.attachDocumentSnippet
);
router.put(
    "/documents/:workspaceId/:documentId/remove_snippet/:snippetId",
    authorizationMiddleware.documentMiddleware,
    documentController.removeDocumentSnippet
);

//PUSHER
const pusherController = require("../controllers/pusher/PusherController");
router.post("/pusher/webhook", pusherController.handlePusherWebhook);
router.post("/pusher/vscode/auth", pusherController.authorizeVSCode);

// These routes are not usable yet.
/*
router.put('/documents/:workspaceId/attach_uploadfile/:id', authorizationMiddleware.documentMiddleware, documentController.attachUploadFile);
router.put('/documents/:workspaceId/remove_uploadfile/:id', authorizationMiddleware.documentMiddleware, documentController.removeUploadFile);

router.put('/documents/:workspaceId/add_canwrite/:id', authorizationMiddleware.documentMiddleware, documentController.addCanWrite);
router.put('/documents/:workspaceId/remove_canwrite/:id', authorizationMiddleware.documentMiddleware, documentController.removeCanWrite);

router.put('/documents/:workspaceId/add_canread/:id', authorizationMiddleware.documentMiddleware, documentController.addCanRead);
router.put('/documents/:workspaceId/remove_canread/:id', authorizationMiddleware.documentMiddleware, documentController.removeCanRead);
*/

const repositoryController = require("../controllers/RepositoryController");

// Dev only

// create - dev role only
// update - dev role only

router.post(
    "/repositories/init",
    // permissionsMiddleware.verifyUserIsDev,
    repositoryController.initRepository
);
router.post(
    "/repositories/update",
    authorizationMiddleware.repositoryMiddleware,
    repositoryController.updateRepository
);
router.post(
    "/repositories/job_retrieve",
    authorizationMiddleware.repositoryMiddleware,
    repositoryController.jobRetrieveRepositories
);
router.post(
    "/repositories/remove_installation",
    authorizationMiddleware.repositoryMiddleware,
    repositoryController.removeInstallation
);

router.post(
    "/repositories/search_public_repos",
    repositoryController.searchPublicGithubRepositories
);

// User accessible

// retrieve - Scope to workspace? Add a :workspaceId, then in Controller filter returned repositories down to those in workspace

// Ignore these two routes for now, they are going to be refactored
// validate - TODO: Figure out how to handle this one, params passed in req.body?
// poll - scoped to :workspaceId, repositories being polled all in workspaceId

// get_file - verify user is in a workspace with this repository added
// get - verify user is in a workspace with this repository added
// delete - verify user is in a workspace with this repository added
router.post(
    "/repositories/:userId/retrieve_creation",
    permissionsMiddleware.verifyUserIdMatchesRequester,
    repositoryController.retrieveCreationRepositories
);
router.post(
    "/repositories/:workspaceId/get_file/:repositoryId",
    authorizationMiddleware.repositoryMiddleware,
    repositoryController.getRepositoryFileSafe
);
router.post(
    "/repositories/test_retrieve",
    //  authorizationMiddleware.repositoryMiddleware,
    repositoryController.retrieveRepositoriesTest
);

router.post(
    "/repositories/:workspaceId/retrieve",
    authorizationMiddleware.repositoryMiddleware,
    repositoryController.retrieveRepositories
);

router.get(
    "/repositories/:workspaceId/get/:repositoryId",
    authorizationMiddleware.repositoryMiddleware,
    repositoryController.getRepository
);
router.delete(
    "/repositories/:workspaceId/delete/:repositoryId",
    authorizationMiddleware.repositoryMiddleware,
    repositoryController.deleteRepository
);

// create - verify user exists

// search - verify membership in workspace for calling user
// get - verify membership in workspace for calling user
// delete - verify membership in workspace for calling user
// add_user - verify membership in workspace for calling user
// remove_user - verify membership in workspace for calling user

// retrieve - verify user is a member of all workspaces returned
const workspaceController = require("../controllers/WorkspaceController");

// TODO: This route cannot be properly secured without a list of repositories that a particular user has access to.
router.post(
    "/workspaces/create",
    authorizationMiddleware.workspaceMiddleware,
    workspaceController.createWorkspace
);
router.post(
    "/workspaces/search/:workspaceId",
    authorizationMiddleware.workspaceMiddleware,
    workspaceController.searchWorkspace
);
router.get(
    "/workspaces/get/:workspaceId",
    permissionsMiddleware.verifyUserInWorkspace,
    workspaceController.getWorkspace
);
router.delete(
    "/workspaces/delete/:workspaceId",
    permissionsMiddleware.verifyUserInWorkspace,
    workspaceController.deleteWorkspace
);
router.put(
    "/workspaces/:workspaceId/remove_user/:userId",
    authorizationMiddleware.workspaceMiddleware,
    workspaceController.removeWorkspaceUser
);

router.put(
    "/workspaces/edit/:workspaceId",
    permissionsMiddleware.verifyUserInWorkspace,
    workspaceController.editWorkspace
);

router.post(
    "/workspaces/retrieve",
    authorizationMiddleware.workspaceMiddleware,
    workspaceController.retrieveWorkspaces
);

// DEPRECATED
// router.put('/workspaces/:workspaceId/add_user/:userId', authorizationMiddleware.workspaceMiddleware, workspaceController.addWorkspaceUser);

// All of these tag routes are handled by the same case (Yay!)

// create - verify membership in workspace for calling user
// get - verify membership in workspace for calling user, then verify tag is in workspace
// edit - verify membership in workspace for calling user, then verify tag is in workspace
// delete - verify membership in workspace for calling user, then verify tag is in workspace
// retrieve - scope query to a single workspace, verify user is a member of the workspace, nothing in middleware

const tagController = require("../controllers/TagController");
router.post(
    "/tags/:workspaceId/create",
    authorizationMiddleware.tagMiddleware,
    tagController.createTag
);
router.get(
    "/tags/:workspaceId/get/:tagId",
    authorizationMiddleware.tagMiddleware,
    tagController.getTag
);
router.put(
    "/tags/:workspaceId/edit/:tagId",
    authorizationMiddleware.tagMiddleware,
    tagController.editTag
);
router.delete(
    "/tags/:workspaceId/delete/:tagId",
    authorizationMiddleware.tagMiddleware,
    tagController.deleteTag
);
router.post(
    "/tags/:workspaceId/retrieve",
    authorizationMiddleware.tagMiddleware,
    tagController.retrieveTags
);

//auth routes
const authController = require("../controllers/authentication/AuthController");
router.get("/auth/login/success", authController.loginSuccess);
router.get("/auth/login/failed", authController.loginFailed);
router.get("/auth/logout", authController.logout);

// router.get('/auth/github', passport.authenticate("github"));
router.get("/auth/github", function (req, res, next) {
    const { email, ide_token } = req.query;
    let options = { session: false };

    var state = {};

    if (process.env.IS_PRODUCTION) {
        state.source = "production";
    } else {
        state.source = "localhost";
    }

    if (email) {
        state.email = email;
    } else if (ide_token) {
        console.log("\nAuthorization IDE Token", ide_token);

        state.ideToken = ide_token;
    }

    state = Buffer.from(JSON.stringify(state)).toString("base64");

    options = { ...options, scope: [], state };

    passport.authenticate("github", options, function (err, user, info) {
        console.log("Passport Auth callback");
        if (err) {
            return next(err);
        }

        // TODO: Change this to appropriate route
        if (!user) {
            console.log("!user == true");
            return res.redirect("/login");
        }

        // var jwtToken = createUserJWTToken(user._id, user.role);

        // res.cookie('user-jwt', jwtToken, { httpOnly: true });
        console.log("About to redirect");
        // return res.redirect('https://localhost:3001/api/auth/github/redirect');
    })(req, res, next);
});

/*
router.get('/auth/github/fork', (req, res) => {

    const { state } = req.query;

    console.log(`STATE: ${JSON.stringify(state)}`);
    console.log(`BUFFER: ${Buffer.from(state, 'base64').toString()}`);

    const { email, source } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    if (source == 'localhost') {
        return res.redirect('http://localhost:3001/api/auth/github/redirect');
    }
    else {
        return res.redirect('https://api.getquilt.app/api/auth/github/redirect');
    }
});
*/

router.get("/auth/encrypt_ide_token", authController.encryptIDEToken);

router.get(
    "/auth/github/redirect",
    passport.authenticate("github", { session: false }),
    (req, res) => {
        // console.log('Request Host: ', req.get('host'));
        // if (err) { return res.json({success: false, error: err}) }
        // TODO: Change this to appropriate route
        if (!req.user) {
            console.log("req.user != true");
            return res.redirect("/login");
        }

        // IDE AUTH
        const { state } = req.query;

        try {
            const { ideToken } = JSON.parse(
                Buffer.from(state, "base64").toString()
            );

            if (ideToken) {
                authController.authorizeIDEClient(ideToken, req.user);

                return res.redirect("/login");
            }
        } catch (err) {
            console.log("NOT AUTHENTICATING THROUGH IDE", err);
        }

        // IDE AUTH END

        var jwtToken = createUserJWTToken(req.user._id, req.user.role);

        res.cookie("user-jwt", jwtToken, { httpOnly: true });

        if (state === "installing") {
            return res.redirect(INSTALLED_URL);
        }

        if (req.query.state != "installing") {
            if (!req.user.onboarded) {
                console.log(
                    `${JSON.stringify(
                        JSON.parse(Buffer.from(state, "base64").toString())
                    )}`
                );

                const { email, source } = JSON.parse(
                    Buffer.from(state, "base64").toString()
                );

                try {
                    if (typeof email === "string") {
                        return res.redirect(`${ONBOARD_URL}?email=${email}`);
                    }
                } catch (err) {
                    console.log(err);
                }

                return res.redirect(ONBOARD_URL);
            }

            return res.redirect(CLIENT_HOME_PAGE_URL);
        }
    }
);

router.post(
    "/auth/check_installation",
    authorizationMiddleware.authMiddleware,
    authController.checkInstallation
);
// router.post('/auth/retrieve_domain_repositories', authorizationMiddleware.authMiddleware, authController.retrieveDomainRepositories);

const reportingController = require("../controllers/reporting/ReportingController");
router.post(
    "/reporting/:workspaceId/retrieve_broken_documents",
    authorizationMiddleware.reportingMiddleware,
    reportingController.retrieveBrokenDocuments
);
router.post(
    "/reporting/:workspaceId/retrieve_activity_feed_items",
    authorizationMiddleware.reportingMiddleware,
    reportingController.retrieveActivityFeedItems
);
router.post(
    "/reporting/:workspaceId/retrieve_user_stats",
    authorizationMiddleware.reportingMiddleware,
    reportingController.retrieveUserStats
);

const userController = require("../controllers/authentication/UserController");

router.get(
    "/users/get/:userId",
    permissionsMiddleware.verifyUserIdMatchesRequester,
    userController.getUser
);
router.put(
    "/users/edit/:userId",
    permissionsMiddleware.verifyUserIdMatchesRequester,
    userController.editUser
);
router.put(
    "/users/attach_workspace/:workspaceId",
    authorizationMiddleware.userMiddleware,
    userController.attachUserWorkspace
);
router.put(
    "/users/remove_workspace/:workspaceId",
    authorizationMiddleware.userMiddleware,
    userController.removeUserWorkspace
);
router.delete(
    "/users/delete_user/:workspaceId",
    authorizationMiddleware.userMiddleware,
    userController.deleteUser
);

//token routes
// must be a dev JWT
const tokenController = require("../controllers/TokenController");
router.post(
    "/tokens/create",
    authorizationMiddleware.tokenMiddleware,
    tokenController.createToken
);
router.post(
    "/tokens/delete",
    authorizationMiddleware.tokenMiddleware,
    tokenController.deleteInstallationToken
);

const checkController = require("../controllers/CheckController");
router.post(
    "/checks/:repositoryId/create",
    authorizationMiddleware.checkMiddleware,
    checkController.createCheck
);
router.post(
    "/checks/:workspaceId/:repositoryId/retrieve",
    authorizationMiddleware.checkMiddleware,
    checkController.retrieveChecks
);

const emailVerifyController = require("../controllers/authentication/EmailVerifyController");
router.get("/verify/:verifyEmailHash", emailVerifyController.verifyEmail);
router.post("/verify/add_contact", emailVerifyController.addContact);

const workspaceInviteController = require("../controllers/authentication/WorkspaceInviteController");

router.post(
    "/invites/:workspaceId",
    permissionsMiddleware.verifyUserInWorkspace,
    workspaceInviteController.sendInvite
);

router.post(
    "/invites/:workspaceId/retrieve",
    permissionsMiddleware.verifyUserInWorkspace,
    workspaceInviteController.retrieveInvites
);

const assetController = require("../controllers/AssetController");
router.get("/assets/invalid_document", assetController.getInvalidDocumentIcon);
router.get("/assets/invalid_snippet", assetController.getInvalidSnippetIcon);
router.get("/assets/invalid_check", assetController.getInvalidCheckIcon);
router.get("/assets/document", assetController.getDocumentIcon);
router.get("/assets/snippet", assetController.getSnippetIcon);

const notificationController = require("../controllers/reporting/NotificationController");
router.post(
    "/notifications/:workspaceId/:userId/retrieve",
    authorizationMiddleware.notificationMiddleware,
    notificationController.retrieveNotifications
);
router.post(
    "/notifications/:workspaceId/:userId/set_hidden",
    authorizationMiddleware.notificationMiddleware,
    notificationController.setNotificationsHidden
);
router.get(
    "/notifications/:workspaceId/:userId/pending",
    authorizationMiddleware.notificationMiddleware,
    notificationController.getPendingCount
);
router.post(
    "/notifications/:workspaceId/:userId/hide_all",
    authorizationMiddleware.notificationMiddleware,
    notificationController.hideAllNotifications
);

const badgeController = require("../controllers/badges/BadgeController");
router.get("/badges/status/", badgeController.getBadge);

const multer = require("multer");

// configuring the DiscStorage engine.
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, //1 * 1024 * 1024 = 1MB

    /*
                        // other settings here then:
                        onFileSizeLimit: function (file) {
                            // but res (response) object is not existing here
                            console.log('File Size Limit');
                            file.error = {
                                message: "Upload failed, file size limit is 5 MB",
                                status:  -6// MARankings.Enums.Status.FILE_TOO_LARGE
                                // status: -6
                            };
                        },

                        onFileUploadComplete: function (file, req, res) {
                            if (file.error){
                                console.log('FILE ERROR Detected');
                                res.send(file.error);
                                res.end();
                            }
                        }
                        */
});

const upload_method = upload.single("attachment");

const fileUploadController = require("../controllers/FileUploadController");

router.post("/uploads/create_attachment", function (req, res) {
    upload_method(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.json({
                success: false,
                error: err.message,
                alert: err.message,
            });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.json({
                success: false,
                error: err.message,
                alert: err.message,
            });
        }

        // Everything went fine.
        fileUploadController.postFile(req, res);
    });
});

router.get("/uploads/:targetName/:download", fileUploadController.getFile);

/*
app.post('/profile', function (req, res) {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
      } else if (err) {
        // An unknown error occurred when uploading.
      }
  
      // Everything went fine.
    })
  })
*/
//ASSOCIATION ROUTES ("TEST");
const associationController = require("../controllers/associations/AssociationController");

router.post(
    "/associations/:workspaceId/:repositoryId/get_file_context",
    permissionsMiddleware.verifyUserAndRepositoryInWorkspace,
    associationController.getFileContext
);

router.post(
    "/associations/:workspaceId/generate_associations",
    associationController.generateAssociations
);

router.post(
    "/associations/create_board",
    associationController.createGithubIssueBoard
);

//GOOGLE INTEGRATION ROUTES

const googleController = require("../controllers/integrations/google/GoogleController");

router.get("/integrations/connect/google", googleController.beginGoogleConnect);

router.get(
    "/integrations/connect/google/callback",
    googleController.handleGoogleConnectCallback
);

router.get(
    "/integrations/:workspaceId/:userId/google/get_external_drives",
    googleController.getExternalGoogleDrives
);

//TRELLO INTEGRATION ROUTES
const trelloController = require("../controllers/integrations/trello/TrelloController");

router.get("/integrations/connect/trello", trelloController.beginTrelloConnect);

router.get(
    "/integrations/connect/trello/callback",
    trelloController.handleTrelloConnectCallback
);

router.get(
    "/integrations/:workspaceId/:userId/trello/get_external_boards",
    trelloController.getExternalTrelloBoards
);

router.delete(
    "/integrations/:workspaceId/:userId/trello/remove_integration/:boardId",
    trelloController.removeTrelloIntegration
);

router.post(
    "/integrations/:workspaceId/:userId/trello/trigger_scrape",
    trelloController.triggerTrelloScrape
);

router.post(
    "/integrations/:boardId/:userId/trello/handle_webhook",
    trelloController.handleTrelloWebhook
);

router.head(
    "/integrations/:boardId/:userId/trello/handle_webhook",
    trelloController.affirmTrelloWebhook
);

// GithubIssue Routes
const githubIssueIntegrationController = require("../controllers/integrations/github/GithubIssueController");

const jiraController = require("../controllers/integrations/jira/JiraController");

router.get(
    "/integrations/connect/:userId/:workspaceId/jira",
    jiraController.beginJiraConnect
);

router.get(
    "/integrations/connect/jira/callback",
    jiraController.handleJiraCallback
);

router.get(
    "/integrations/:workspaceId/jira/get_external_boards",
    jiraController.getExternalJiraProjects
);

router.post(
    "/integrations/:workspaceId/jira/trigger_scrape",
    jiraController.triggerJiraScrape
);

router.post(
    "/integrations/:workspaceId/jira/create_personal_token",
    jiraController.createPersonalToken
);

const branchController = require("../controllers/BranchController");

router.post(
    "/branch/create",
    authorizationMiddleware.branchMiddleware,
    branchController.createBranch
);

router.post("/example_route", (req, res) => {
    console.log("BODY", req.body);

    const { integrationId, integrationType } = req.body;

    let tickets = [
        {
            likelyPullRequests: [],
            likelyIssues: [],
            likelyCommits: [],
            likelyBranches: [],
        },
    ];

    return res.json({ success: true, result: tickets });
});

//CONTEXT ROUTES
/*
const contextController = require("../controllers/integrations/context/BoardWorkspaceContextController");
router.post(
    "/contexts/:workspaceId/retrieve",
    contextController.retrieveContexts
);
*/

const contextController = require("../controllers/contexts/ContextController");
router.post(
    "/contexts/:repositoryId/get_blames",
    contextController.getBlamesForFile
);

const blameController = require("../controllers/blame/BlameController");
router.post(
    "/blames/:workspaceId/:repositoryId/retrieve",
    permissionsMiddleware.verifyUserAndRepositoryInWorkspace,
    blameController.retrieveBlame
);

const pullRequestController = require("../controllers/PullRequestController");
router.post(
    "/pull_requests/create",
    permissionsMiddleware.verifyUserIsDev,
    pullRequestController.createPullRequest
);

module.exports = router;
