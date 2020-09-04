// TODO: Add Workspace, Repository Delete Routes and methods 
const passport = require("passport");
const CLIENT_HOME_PAGE_URL = "http://localhost:3000/workspaces";

const express = require('express');
const router = express.Router({mergeParams: true});
const paramMiddleware = require('../utils/param_middleware');

const authorizationMiddleware = require('../utils/authorization_middleware');



router.param('workspaceId', paramMiddleware.workspaceIdParam);
router.param('referenceId', paramMiddleware.referenceIdParam);
router.param('documentId', paramMiddleware.documentIdParam);
router.param('tagId', paramMiddleware.tagIdParam);
router.param('snippetId', paramMiddleware.snippetIdParam);
router.param('repositoryId', paramMiddleware.repositoryIdParam);
router.param('userId', paramMiddleware.userIdParam);


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

const referenceController = require('../controllers/ReferenceController');

router.post('/references/create', authorizationMiddleware.referenceMiddleware, referenceController.createReferences);
router.get('/references/:workspaceId/get/:referenceId', authorizationMiddleware.referenceMiddleware, referenceController.getReference);
router.put('/references/:workspaceId/edit/:referenceId', authorizationMiddleware.referenceMiddleware, referenceController.editReference);
router.delete('/references/:workspaceId/delete/:referenceId', authorizationMiddleware.referenceMiddleware, referenceController.deleteReference);
router.put('/references/:workspaceId/:referenceId/attach_tag/:tagId', authorizationMiddleware.referenceMiddleware, referenceController.attachTag);
router.put('/references/:workspaceId/:referenceId/remove_tag/:tagId', authorizationMiddleware.referenceMiddleware, referenceController.removeTag);
router.post('/references/:workspaceId/retrieve', authorizationMiddleware.referenceMiddleware, referenceController.retrieveReferences);
router.post('/references/:workspaceId/retrieve_code_references', authorizationMiddleware.referenceMiddleware, referenceController.retrieveCodeReferences);


// Validate workspace membership for calling user; all methods
const documentController = require('../controllers/DocumentController');
router.post('/documents/:workspaceId/create', authorizationMiddleware.documentMiddleware, documentController.createDocument); // DONE
router.get('/documents/:workspaceId/get/:documentId', authorizationMiddleware.documentMiddleware, documentController.getDocument); // DONE
router.get('/documents/:workspaceId/get_parent/:documentId', authorizationMiddleware.documentMiddleware, documentController.getParent); // DONE
router.put('/documents/:workspaceId/edit/:documentId', authorizationMiddleware.documentMiddleware, documentController.editDocument); //  DONE
router.delete('/documents/:workspaceId/delete/:documentId', authorizationMiddleware.documentMiddleware, documentController.deleteDocument); // DONE
router.put('/documents/:workspaceId/rename/:documentId', authorizationMiddleware.documentMiddleware, documentController.renameDocument); // DONE
router.put('/documents/:workspaceId/move/:documentId', authorizationMiddleware.documentMiddleware, documentController.moveDocument); // DONE
router.post('/documents/:workspaceId/retrieve', authorizationMiddleware.documentMiddleware, documentController.retrieveDocuments); // DONE


router.put('/documents/:workspaceId/:documentId/attach_tag/:tagId', authorizationMiddleware.documentMiddleware, documentController.attachTag); // DONE
router.put('/documents/:workspaceId/:documentId/remove_tag/:tagId', authorizationMiddleware.documentMiddleware, documentController.removeTag); // DONE

router.put('/documents/:workspaceId/:documentId/attach_reference/:referenceId', authorizationMiddleware.documentMiddleware, documentController.attachReference); // DONE
router.put('/documents/:workspaceId/:documentId/remove_reference/:referenceId', authorizationMiddleware.documentMiddleware, documentController.removeReference); // DONE


router.put('/documents/:workspaceId/:documentId/attach_snippet/:snippetId', authorizationMiddleware.documentMiddleware, documentController.attachSnippet); // DONE
router.put('/documents/:workspaceId/:documentId/remove_snippet/:snippetId', authorizationMiddleware.documentMiddleware, documentController.removeSnippet); // DONE

// These routes are not usable yet.
/*
router.put('/documents/:workspaceId/attach_uploadfile/:id', authorizationMiddleware.documentMiddleware, documentController.attachUploadFile);
router.put('/documents/:workspaceId/remove_uploadfile/:id', authorizationMiddleware.documentMiddleware, documentController.removeUploadFile);

router.put('/documents/:workspaceId/add_canwrite/:id', authorizationMiddleware.documentMiddleware, documentController.addCanWrite);
router.put('/documents/:workspaceId/remove_canwrite/:id', authorizationMiddleware.documentMiddleware, documentController.removeCanWrite);

router.put('/documents/:workspaceId/add_canread/:id', authorizationMiddleware.documentMiddleware, documentController.addCanRead);
router.put('/documents/:workspaceId/remove_canread/:id', authorizationMiddleware.documentMiddleware, documentController.removeCanRead);
*/

// Validate workspace membership for calling user; all methods
const snippetController = require('../controllers/SnippetController');
router.post('/snippets/:workspaceId/:referenceId/create', authorizationMiddleware.snippetMiddleware, snippetController.createSnippet); // DONE
router.get('/snippets/:workspaceId/get/:snippetId', authorizationMiddleware.snippetMiddleware, snippetController.getSnippet); // DONE
router.put('/snippets/:workspaceId/edit/:snippetId', authorizationMiddleware.snippetMiddleware, snippetController.editSnippet); // DONE
router.delete('/snippets/:workspaceId/delete/:snippetId', authorizationMiddleware.snippetMiddleware, snippetController.deleteSnippet); // DONE
router.post('/snippets/:workspaceId/retrieve', authorizationMiddleware.snippetMiddleware, snippetController.retrieveSnippets); // DONE
router.post('/snippets/:workspaceId/refresh', authorizationMiddleware.snippetMiddleware, snippetController.refreshSnippets); // DONE



const repositoryController = require('../controllers/RepositoryController');

// Dev only

// create - dev role only
// update - dev role only

router.post('/repositories/create', authorizationMiddleware.repositoryMiddleware, repositoryController.createRepository); // DONE
router.post('/repositories/update/:repositoryId', authorizationMiddleware.repositoryMiddleware, repositoryController.updateRepository); // DONE

// User accessible


// retrieve - Scope to workspace? Add a :workspaceId, then in Controller filter returned repositories down to those in workspace

// Ignore these two routes for now, they are going to be refactored
// validate - TODO: Figure out how to handle this one, params passed in req.body?
// poll - scoped to :workspaceId, repositories being polled all in workspaceId


// get_file - verify user is in a workspace with this repository added
// get - verify user is in a workspace with this repository added
// delete - verify user is in a workspace with this repository added

router.post('/repositories/:workspaceId/get_file/:repositoryId', authorizationMiddleware.repositoryMiddleware, repositoryController.getRepositoryFile); // DONE
router.post('/repositories/:workspaceId/retrieve', authorizationMiddleware.repositoryMiddleware, repositoryController.retrieveRepositories); // DONE
router.post('/repositories/validate', authorizationMiddleware.repositoryMiddleware, repositoryController.validateRepositories); // DONE
router.post('/repositories/:workspaceId/poll', authorizationMiddleware.repositoryMiddleware, repositoryController.pollRepositories); // DONE
router.get('/repositories/:workspaceId/get/:repositoryId', authorizationMiddleware.repositoryMiddleware, repositoryController.getRepository); // DONE
router.delete('/repositories/:workspaceId/delete/:repositoryId', authorizationMiddleware.repositoryMiddleware, repositoryController.deleteRepository); // DONE


// create - verify user exists

// search - verify membership in workspace for calling user
// get - verify membership in workspace for calling user
// delete - verify membership in workspace for calling user
// add_user - verify membership in workspace for calling user
// remove_user - verify membership in workspace for calling user

// retrieve - verify user is a member of all workspaces returned
const workspaceController = require('../controllers/WorkspaceController');

// TODO: This route cannot be properly secured without a list of repositories that a particular user has access to.
router.post('/workspaces/create', authorizationMiddleware.workspaceMiddleware, workspaceController.createWorkspace);

router.post('/workspaces/search/:workspaceId', authorizationMiddleware.workspaceMiddleware, workspaceController.searchWorkspace);
router.get('/workspaces/get/:workspaceId', authorizationMiddleware.workspaceMiddleware, workspaceController.getWorkspace);
router.delete('/workspaces/delete/:workspaceId', authorizationMiddleware.workspaceMiddleware, workspaceController.deleteWorkspace);
router.put('/workspaces/add_user/:workspaceId', authorizationMiddleware.workspaceMiddleware, workspaceController.addUser);
router.put('/workspaces/remove_user/:workspaceId', authorizationMiddleware.workspaceMiddleware, workspaceController.removeUser);

router.post('/workspaces/retrieve', authorizationMiddleware.workspaceMiddleware, workspaceController.retrieveWorkspaces);


// All of these tag routes are handled by the same case (Yay!)

// create - verify membership in workspace for calling user
// get - verify membership in workspace for calling user, then verify tag is in workspace
// edit - verify membership in workspace for calling user, then verify tag is in workspace
// delete - verify membership in workspace for calling user, then verify tag is in workspace
// retrieve - scope query to a single workspace, verify user is a member of the workspace, nothing in middleware


const tagController = require('../controllers/TagController');
router.post('/tags/:workspaceId/create', authorizationMiddleware.tagMiddleware, tagController.createTag);
router.get('/tags/:workspaceId/get/:tagId', authorizationMiddleware.tagMiddleware, tagController.getTag);
router.put('/tags/:workspaceId/edit/:tagId', authorizationMiddleware.tagMiddleware, tagController.editTag);
router.delete('/tags/:workspaceId/delete/:tagId', authorizationMiddleware.tagMiddleware, tagController.deleteTag);
router.post('/tags/:workspaceId/retrieve', authorizationMiddleware.tagMiddleware, tagController.retrieveTags);

//auth routes
const authController = require('../controllers/authentication/AuthController');
router.get('/auth/login/success', authController.loginSuccess);
router.get('/auth/login/failed', authController.loginFailed);
router.get('/auth/logout', authController.logout);
router.get('/auth/github', passport.authenticate("github"));
router.get('/auth/github2', function(req, res, next) { 
    console.log("REQUEST", req.headers);
});
router.get('/auth/github/redirect', passport.authenticate("github"), function(req, res){
                                            console.log('Request Host: ', req.get('host'));
                                            if (req.query.state === "installing") {
                                                res.redirect(`http://localhost:3000/installed`);
                                            } else {
                                                res.redirect(CLIENT_HOME_PAGE_URL);
                                            }
                                        });
router.post('/auth/check_installation', authController.checkInstallation);
router.post('/auth/retrieve_domain_repositories', authController.retrieveDomainRepositories)
router.get('/auth/start_jira_auth', authController.startJiraAuthRequest);


// Not currently enabled
/*
const document_request_controller = require('../controllers/DocumentRequestController');
router.post('/document_requests/create', document_request_controller.createDocumentRequest);
router.put('/document_requests/edit/:id', document_request_controller.editDocumentRequest);
router.delete('/document_requests/delete/:id', document_request_controller.deleteDocumentRequest);
router.get('/document_requests/get/:id', document_request_controller.getDocumentRequest);
router.post('/document_requests/retrieve', document_request_controller.retrieveDocumentRequests);
router.put('/document_requests/attach_tag/:id', document_request_controller.attachTag);
router.put('/document_requests/remove_tag/:id', document_request_controller.removeTag);
router.post('/document_requests/add_mentions', document_request_controller.addMentions);
router.post('/document_requests/remove_mentions', document_request_controller.removeMentions);
router.post('/document_requests/add_references', document_request_controller.addReferences);
router.post('/document_requests/remove_references', document_request_controller.removeReferences);
router.post('/document_requests/add_snippets', document_request_controller.addSnippets);
router.post('/document_requests/remove_snippets', document_request_controller.removeSnippets);
*/

// get - userId must match user to fetch
// edit - user must match the user to edit
// attach_workspace - user must be a member in the memberUsers field of Workspace
// remove_workspace - user must be a member in the memberUsers field of Workspace
// delete_user - user must match the user to delete

// We can use one switch case, with a conditional for if :userId is a param, or :workspaceId is a param
// If :userId, verify that JWT userId matches :userId
// If :workspaceId, verify that user is in memberUsers of Workspace

const userController = require('../controllers/authentication/UserController');

router.get('/users/get/:userId', authorizationMiddleware.userMiddleware, userController.getUser);
router.put('/users/edit/:userId', authorizationMiddleware.userMiddleware, userController.editUser);
router.put('/users/attach_workspace/:workspaceId', authorizationMiddleware.userMiddleware, userController.attachWorkspace);
router.put('/users/remove_workspace/:workspaceId', authorizationMiddleware.userMiddleware, userController.removeWorkspace);
router.delete('/users/delete_user/:workspaceId', authorizationMiddleware.userMiddleware, userController.deleteUser);

//token routes
// must be a dev JWT
const tokenController = require('../controllers/TokenController');
router.post('/tokens/create', authorizationMiddleware.tokenMiddleware, tokenController.createToken);


// Reporting routes

/*
module.exports = { retrieveBrokenDocuments,
                   retrieveActivityFeedItems: ActivityFeedItemController.retrieveActivityFeedItems,
                   retrieveUserStats: UserStatsController.retrieveUserStats,
*/
const reportingController = require('../controllers/reporting/ReportingController');
router.post('/reporting/:workspaceId/retrieve_broken_documents', authorizationMiddleware.reportingMiddleware, reportingController.retrieveBrokenDocuments);
router.post('/reporting/:workspaceId/retrieve_activity_feed_items', authorizationMiddleware.reportingMiddleware, reportingController.retrieveActivityFeedItems);
router.post('/reporting/:workspaceId/retrieve_user_stats', authorizationMiddleware.reportingMiddleware, reportingController.retrieveUserStats);


module.exports = router;

