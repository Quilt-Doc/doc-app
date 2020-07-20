// TODO: Add Workspace, Repository Delete Routes and methods 
const passport = require("passport");
const CLIENT_HOME_PAGE_URL = "http://localhost:3000/repository";

const express = require('express');
const router = express.Router();

//base routes

const reference_controller = require('../controllers/ReferenceController');
//DEPRECATED
router.post('/references/create', reference_controller.createReferences);
router.post('/references/get', reference_controller.getReferences);

// NEW
router.post('/references/create2', reference_controller.createReferences2);
router.get('/references/get2/:id', reference_controller.getReference);
router.put('/references/edit/:id', reference_controller.editReference);
router.delete('/references/delete/:id', reference_controller.deleteReference);
router.post('/references/retrieve',  reference_controller.retrieveReferences);
router.post('/references/get_contents', reference_controller.getContents);
router.post('/references/retrieve_code_references', reference_controller.retrieveCodeReferences);
// DEPRECATED
/*
router.post('/references/attach_document',  reference_controller.attachDocument);
router.post('/references/remove_document',  reference_controller.removeDocument);
*/

const document_controller = require('../controllers/DocumentController');
router.post('/documents/create', document_controller.createDocument);
router.get('/documents/get/:id', document_controller.getDocument);
router.get('/documents/get_parent/:id', document_controller.getParent);
router.put('/documents/edit/:id', document_controller.editDocument);
router.delete('/documents/delete/:id', document_controller.deleteDocument);
router.put('/documents/rename', document_controller.renameDocument);
router.put('/documents/move', document_controller.moveDocument);
router.post('/documents/retrieve', document_controller.retrieveDocuments);
router.put('/documents/attach_tag/:id', document_controller.attachTag);
router.put('/documents/remove_tag/:id', document_controller.removeTag);
router.put('/documents/attach_child/:id', document_controller.attachChild);
router.put('/documents/remove_child/:id', document_controller.removeChild);
router.put('/documents/attach_snippet/:id', document_controller.attachSnippet);
router.put('/documents/remove_snippet/:id', document_controller.removeSnippet);
router.put('/documents/attach_parent/:id', document_controller.attachParent);
router.put('/documents/remove_parent/:id', document_controller.removeParent);
router.put('/documents/attach_uploadfile/:id', document_controller.attachUploadFile);
router.put('/documents/remove_uploadfile/:id', document_controller.removeUploadFile);
router.put('/documents/add_canwrite/:id', document_controller.addCanWrite);
router.put('/documents/remove_canwrite/:id', document_controller.removeCanWrite);
router.put('/documents/add_canread/:id', document_controller.addCanRead);
router.put('/documents/remove_canread/:id', document_controller.removeCanRead);

const snippet_controller = require('../controllers/SnippetController');
router.post('/snippets/create', snippet_controller.createSnippet);
router.get('/snippets/get/:id', snippet_controller.getSnippet);
router.put('/snippets/edit/:id', snippet_controller.editSnippet);
router.delete('/snippets/delete/:id', snippet_controller.deleteSnippet);
router.post('/snippets/retrieve', snippet_controller.retrieveSnippets);
router.post('/snippets/refresh', snippet_controller.refreshSnippets);

const repository_controller = require('../controllers/RepositoryController');
router.post('/repositories/refresh_path', repository_controller.refreshRepositoryPath)
router.post('/repositories/refresh_path_new', repository_controller.refreshRepositoryPathNew);
router.post('/repositories/get_file', repository_controller.getRepositoryFile);
router.post('/repositories/parse_file', repository_controller.parseRepositoryFile);
router.post('/repositories/get_refs', repository_controller.getRepositoryRefs);
router.post('/repositories/create', repository_controller.createRepository);
router.post('/repositories/retrieve', repository_controller.retrieveRepositories);
router.post('/repositories/update_commit', repository_controller.updateRepositoryCommit);
router.post('/repositories/validate', repository_controller.validateRepositories);
router.post('/repositories/poll', repository_controller.pollRepositories);
router.get('/repositories/get/:id', repository_controller.getRepository);
router.delete('/repositories/delete/:id', repository_controller.deleteRepository);

const workspace_controller = require('../controllers/WorkspaceController');
router.post('/workspaces/create', workspace_controller.createWorkspace);
router.get('/workspaces/get/:id', workspace_controller.getWorkspace);
router.delete('/workspaces/delete/:id', workspace_controller.deleteWorkspace);
router.put('/workspaces/add_user/:id', workspace_controller.addUser);
router.put('/workspaces/remove_user/:id', workspace_controller.removeUser);
router.post('/workspaces/retrieve', workspace_controller.retrieveWorkspaces);

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
router.get('/auth/github/redirect', passport.authenticate("github", {
                                        successRedirect: CLIENT_HOME_PAGE_URL,
                                        failureRedirect: "/api/auth/login/failed"
                                    }));
router.post('/auth/check_installation', auth_controller.checkInstallation);
router.post('/auth/retrieve_domain_repositories', auth_controller.retrieveDomainRepositories)

const document_request_controller = require('../controllers/DocumentRequestController');
router.post('/document_requests/create', document_request_controller.createDocumentRequest);
router.put('/document_requests/edit/:id', document_request_controller.editDocumentRequest);
router.delete('/document_requests/delete/:id', document_request_controller.deleteDocumentRequest);
router.get('/document_requests/get/:id', document_request_controller.getDocumentRequest);
router.post('/document_requests/retrieve', document_request_controller.retrieveDocumentRequests);
router.post('/document_requests/add_tags', document_request_controller.addTags);
router.post('/document_requests/remove_tags', document_request_controller.removeTags);
router.post('/document_requests/add_mentions', document_request_controller.addMentions);
router.post('/document_requests/remove_mentions', document_request_controller.removeMentions);
router.post('/document_requests/add_references', document_request_controller.addReferences);
router.post('/document_requests/remove_references', document_request_controller.removeReferences);
router.post('/document_requests/add_snippets', document_request_controller.addSnippets);
router.post('/document_requests/remove_snippets', document_request_controller.removeSnippets);



const user_controller = require('../controllers/authentication/UserController');
router.post('/users/create', user_controller.createUser);
router.get('/users/get/:id', user_controller.getUser);
router.put('/users/edit/:id', user_controller.editUser);
router.put('/users/attach_workspace/:id', user_controller.attachWorkspace);
router.put('/users/remove_workspace/:id', user_controller.removeWorkspace);
router.delete('/users/delete_user/:id', user_controller.deleteUser);

//semantic routes
const semantic_controller = require('../controllers/semantic/SemanticController');
router.post('/semantic/callbacks/retrieve', semantic_controller.acquireCallbacks);

//token routes
const token_controller = require('../controllers/TokenController');
router.post('/tokens/create', token_controller.createToken);



module.exports = router;
