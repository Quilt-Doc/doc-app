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


const reference_controller = require('../controllers/ReferenceController');

router.post('/references/create', authorizationMiddleware.referenceMiddleware, reference_controller.createReferences);
router.get('/references/:workspaceId/get/:referenceId', authorizationMiddleware.referenceMiddleware, reference_controller.getReference);
router.put('/references/:workspaceId/edit/:referenceId', authorizationMiddleware.referenceMiddleware, reference_controller.editReference);
router.delete('/references/:workspaceId/delete/:referenceId', authorizationMiddleware.referenceMiddleware, reference_controller.deleteReference);
router.put('/references/:workspaceId/attach_tag/:tagId', authorizationMiddleware.referenceMiddleware, reference_controller.attachTag);
router.put('/references/:workspaceId/remove_tag/:tagId', authorizationMiddleware.referenceMiddleware, reference_controller.removeTag);
router.post('/references/:workspaceId/retrieve', authorizationMiddleware.referenceMiddleware, reference_controller.retrieveReferences);
router.post('/references/:workspaceId/retrieve_code_references', authorizationMiddleware.referenceMiddleware, reference_controller.retrieveCodeReferences);


// Validate workspace membership for calling user; all methods
const document_controller = require('../controllers/DocumentController');
router.post('/documents/:workspaceId/create', authorizationMiddleware.documentMiddleware, document_controller.createDocument); // DONE
router.get('/documents/:workspaceId/get/:documentId', authorizationMiddleware.documentMiddleware, document_controller.getDocument); // DONE
router.get('/documents/:workspaceId/get_parent/:documentId', authorizationMiddleware.documentMiddleware, document_controller.getParent); // DONE
router.put('/documents/:workspaceId/edit/:documentId', authorizationMiddleware.documentMiddleware, document_controller.editDocument); //  DONE
router.delete('/documents/:workspaceId/delete/:documentId', authorizationMiddleware.documentMiddleware, document_controller.deleteDocument); // DONE
router.put('/documents/:workspaceId/rename/:documentId', authorizationMiddleware.documentMiddleware, document_controller.renameDocument); // DONE
router.put('/documents/:workspaceId/move/:documentId', authorizationMiddleware.documentMiddleware, document_controller.moveDocument); // DONE
router.post('/documents/:workspaceId/retrieve', authorizationMiddleware.documentMiddleware, document_controller.retrieveDocuments); // DONE


router.put('/documents/:workspaceId/:documentId/attach_tag/:tagId', authorizationMiddleware.documentMiddleware, document_controller.attachTag); // DONE
router.put('/documents/:workspaceId/:documentId/remove_tag/:tagId', authorizationMiddleware.documentMiddleware, document_controller.removeTag); // DONE

router.put('/documents/:workspaceId/:documentId/attach_reference/:referenceId', authorizationMiddleware.documentMiddleware, document_controller.attachReference); // DONE
router.put('/documents/:workspaceId/:documentId/remove_reference/:referenceId', authorizationMiddleware.documentMiddleware, document_controller.removeReference); // DONE


router.put('/documents/:workspaceId/:documentId/attach_snippet/:snippetId', authorizationMiddleware.documentMiddleware, document_controller.attachSnippet); // DONE
router.put('/documents/:workspaceId/:documentId/remove_snippet/:snippetId', authorizationMiddleware.documentMiddleware, document_controller.removeSnippet); // DONE

// These routes are not usable yet.
/*
router.put('/documents/:workspaceId/attach_uploadfile/:id', authorizationMiddleware.documentMiddleware, document_controller.attachUploadFile);
router.put('/documents/:workspaceId/remove_uploadfile/:id', authorizationMiddleware.documentMiddleware, document_controller.removeUploadFile);

router.put('/documents/:workspaceId/add_canwrite/:id', authorizationMiddleware.documentMiddleware, document_controller.addCanWrite);
router.put('/documents/:workspaceId/remove_canwrite/:id', authorizationMiddleware.documentMiddleware, document_controller.removeCanWrite);

router.put('/documents/:workspaceId/add_canread/:id', authorizationMiddleware.documentMiddleware, document_controller.addCanRead);
router.put('/documents/:workspaceId/remove_canread/:id', authorizationMiddleware.documentMiddleware, document_controller.removeCanRead);
*/

// Validate workspace membership for calling user; all methods
const snippet_controller = require('../controllers/SnippetController');
router.post('/snippets/:workspaceId/:referenceId/create', authorizationMiddleware.snippetMiddleware, snippet_controller.createSnippet); // DONE
router.get('/snippets/:workspaceId/get/:snippetId', authorizationMiddleware.snippetMiddleware, snippet_controller.getSnippet); // DONE
router.put('/snippets/:workspaceId/edit/:snippetId', authorizationMiddleware.snippetMiddleware, snippet_controller.editSnippet); // DONE
router.delete('/snippets/:workspaceId/delete/:snippetId', authorizationMiddleware.snippetMiddleware, snippet_controller.deleteSnippet); // DONE
router.post('/snippets/:workspaceId/retrieve', authorizationMiddleware.snippetMiddleware, snippet_controller.retrieveSnippets); // DONE
router.post('/snippets/:workspaceId/refresh', authorizationMiddleware.snippetMiddleware, snippet_controller.refreshSnippets); // DONE

// create - dev role only
// update_commit - dev role only
// update - dev role only

// get_file - verify user is in a workspace with this repository added
// retrieve - This should be scoped to the workspace. verify user is in a workspace with all these repositories added
// validate - 
// poll - scoped to :workspaceId, repositories being polled all in workspaceId
// get - verify user is in a workspace with this repository added
// delete - verify user is in a workspace with this repository added
const repository_controller = require('../controllers/RepositoryController');

// Dev only
router.post('/repositories/create', repository_controller.createRepository);
router.post('/repositories/update_commit', repository_controller.updateRepositoryCommit);
router.post('/repositories/update', repository_controller.updateRepository);

// User accessible
router.post('/repositories/get_file', repository_controller.getRepositoryFile);
router.post('/repositories/retrieve', repository_controller.retrieveRepositories);
router.post('/repositories/validate', repository_controller.validateRepositories);
router.post('/repositories/poll', repository_controller.pollRepositories);
router.get('/repositories/get/:id', repository_controller.getRepository);
router.delete('/repositories/delete/:id', repository_controller.deleteRepository);


// create - verify user exists
// search - verify membership in workspace for calling user
// get - verify membership in workspace for calling user
// delete - verify membership in workspace for calling user
// add_user - verify membership in workspace for calling user
// remove_user - verify membership in workspace for calling user
// retrieve - verify user is a member of all workspaces returned
const workspace_controller = require('../controllers/WorkspaceController');
router.post('/workspaces/create', workspace_controller.createWorkspace);
router.post('/workspaces/search', workspace_controller.searchWorkspace);
router.get('/workspaces/get/:id', workspace_controller.getWorkspace);
router.delete('/workspaces/delete/:id', workspace_controller.deleteWorkspace);
router.put('/workspaces/add_user/:id', workspace_controller.addUser);
router.put('/workspaces/remove_user/:id', workspace_controller.removeUser);
router.post('/workspaces/retrieve', workspace_controller.retrieveWorkspaces);


// create - verify membership in workspace for calling user
// get - this needs to be scoped to the workspace
// edit - this needs to be scoped to the workspace
// delete - this needs to be scoped to the workspace
// retrieve - this needs to be scoped to the workspace
const tag_controller = require('../controllers/TagController');
router.post('/tags/create', tag_controller.createTag);
router.get('/tags/get/:id', tag_controller.getTag);
router.put('/tags/edit/:id', tag_controller.editTag);
router.delete('/tags/delete/:id', tag_controller.deleteTag);
router.post('/tags/retrieve', tag_controller.retrieveTags);

//auth routes
const auth_controller = require('../controllers/authentication/AuthController');
router.get('/auth/login/success', auth_controller.loginSuccess);
router.get('/auth/login/failed', auth_controller.loginFailed);
router.get('/auth/logout', auth_controller.logout);
router.get('/auth/github', passport.authenticate("github"));
router.get('/auth/github2', function(req, res, next) { 
    console.log("REQUEST", req.headers);
});
router.get('/auth/github/redirect', passport.authenticate("github"), function(req, res){
                                            console.log('Request Host: ', req.get('host'));
                                            if (req.query.state === "installing") {
                                                res.redirect(`${CLIENT_HOME_PAGE_URL}?create=true`);
                                            } else {
                                                res.redirect(CLIENT_HOME_PAGE_URL);
                                            }
                                        });
router.post('/auth/check_installation', auth_controller.checkInstallation);
router.post('/auth/retrieve_domain_repositories', auth_controller.retrieveDomainRepositories)
router.get('/auth/start_jira_auth', auth_controller.startJiraAuthRequest);


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

// create - Not sure for this one
// get - userId must match user to fetch
// edit - user must match the user to edit
// attach_workspace - user must be a member in the memberUsers field of Workspace
// remove_workspace - user must be a member in the memberUsers field of Workspace
// delete_user - user must match the user to delete
const user_controller = require('../controllers/authentication/UserController');
router.post('/users/create', user_controller.createUser);
router.get('/users/get/:id', user_controller.getUser);
router.put('/users/edit/:id', user_controller.editUser);
router.put('/users/attach_workspace/:id', user_controller.attachWorkspace);
router.put('/users/remove_workspace/:id', user_controller.removeWorkspace);
router.delete('/users/delete_user/:id', user_controller.deleteUser);

//token routes
// must be a dev JWT
const token_controller = require('../controllers/TokenController');
router.post('/tokens/create', token_controller.createToken);



module.exports = router;

