// TODO: Add Workspace, Repository Delete Routes and methods 
const passport = require("passport");
const CLIENT_HOME_PAGE_URL = "http://localhost:3000";

const express = require('express');
const router = express.Router({mergeParams: true});
const paramMiddleware = require('../utils/param_middleware');

const authorizationMiddleware = require('../utils/authorization_middleware');

const { createUserJWTToken } = require('../utils/jwt');



router.param('workspaceId', paramMiddleware.workspaceIdParam);
router.param('referenceId', paramMiddleware.referenceIdParam);
router.param('documentId', paramMiddleware.documentIdParam);
router.param('tagId', paramMiddleware.tagIdParam);
router.param('snippetId', paramMiddleware.snippetIdParam);
router.param('repositoryId', paramMiddleware.repositoryIdParam);
router.param('userId', paramMiddleware.userIdParam);
router.param('linkageId', paramMiddleware.linkageIdParam);

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

const reference_controller = require('../controllers/ReferenceController');

router.post('/references/create', authorizationMiddleware.referenceMiddleware, reference_controller.createReferences);
router.get('/references/:workspaceId/get/:referenceId', authorizationMiddleware.referenceMiddleware, reference_controller.getReference);
router.put('/references/:workspaceId/edit/:referenceId', authorizationMiddleware.referenceMiddleware, reference_controller.editReference);
router.delete('/references/:workspaceId/delete/:referenceId', authorizationMiddleware.referenceMiddleware, reference_controller.deleteReference);
router.put('/references/:workspaceId/:referenceId/attach_tag/:tagId', authorizationMiddleware.referenceMiddleware, reference_controller.attachReferenceTag);
router.put('/references/:workspaceId/:referenceId/remove_tag/:tagId', authorizationMiddleware.referenceMiddleware, reference_controller.removeReferenceTag);
router.post('/references/:workspaceId/retrieve', authorizationMiddleware.referenceMiddleware, reference_controller.retrieveReferences);

// Validate workspace membership for calling user; all methods
const document_controller = require('../controllers/DocumentController');
router.post('/documents/:workspaceId/create', authorizationMiddleware.documentMiddleware, document_controller.createDocument);
router.get('/documents/:workspaceId/get/:documentId', authorizationMiddleware.documentMiddleware, document_controller.getDocument);
router.put('/documents/:workspaceId/edit/:documentId', authorizationMiddleware.documentMiddleware, document_controller.editDocument);
router.delete('/documents/:workspaceId/delete/:documentId', authorizationMiddleware.documentMiddleware, document_controller.deleteDocument);
router.put('/documents/:workspaceId/rename/:documentId', authorizationMiddleware.documentMiddleware, document_controller.renameDocument);
router.put('/documents/:workspaceId/move/:documentId', authorizationMiddleware.documentMiddleware, document_controller.moveDocument);
router.post('/documents/:workspaceId/retrieve', authorizationMiddleware.documentMiddleware, document_controller.retrieveDocuments);


router.put('/documents/:workspaceId/:documentId/attach_tag/:tagId', authorizationMiddleware.documentMiddleware, document_controller.attachDocumentTag);
router.put('/documents/:workspaceId/:documentId/remove_tag/:tagId', authorizationMiddleware.documentMiddleware, document_controller.removeDocumentTag);

router.put('/documents/:workspaceId/:documentId/attach_reference/:referenceId', authorizationMiddleware.documentMiddleware, document_controller.attachDocumentReference);
router.put('/documents/:workspaceId/:documentId/remove_reference/:referenceId', authorizationMiddleware.documentMiddleware, document_controller.removeDocumentReference);


router.put('/documents/:workspaceId/:documentId/attach_snippet/:snippetId', authorizationMiddleware.documentMiddleware, document_controller.attachDocumentSnippet);
router.put('/documents/:workspaceId/:documentId/remove_snippet/:snippetId', authorizationMiddleware.documentMiddleware, document_controller.removeDocumentSnippet);

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
router.post('/snippets/:workspaceId/:referenceId/create', authorizationMiddleware.snippetMiddleware, snippet_controller.createSnippet);
router.get('/snippets/:workspaceId/get/:snippetId', authorizationMiddleware.snippetMiddleware, snippet_controller.getSnippet);
router.put('/snippets/:workspaceId/edit/:snippetId', authorizationMiddleware.snippetMiddleware, snippet_controller.editSnippet);
router.delete('/snippets/:workspaceId/delete/:snippetId', authorizationMiddleware.snippetMiddleware, snippet_controller.deleteSnippet);
router.post('/snippets/:workspaceId/retrieve', authorizationMiddleware.snippetMiddleware, snippet_controller.retrieveSnippets);
router.post('/snippets/:workspaceId/refresh', authorizationMiddleware.snippetMiddleware, snippet_controller.refreshSnippets);



const repository_controller = require('../controllers/RepositoryController');

// Dev only

// create - dev role only
// update - dev role only

router.post('/repositories/init', authorizationMiddleware.repositoryMiddleware, repository_controller.initRepository);
router.post('/repositories/update', authorizationMiddleware.repositoryMiddleware, repository_controller.updateRepository);
router.post('/repositories/job_retrieve', authorizationMiddleware.repositoryMiddleware, repository_controller.jobRetrieveRepositories);

// User accessible


// retrieve - Scope to workspace? Add a :workspaceId, then in Controller filter returned repositories down to those in workspace

// Ignore these two routes for now, they are going to be refactored
// validate - TODO: Figure out how to handle this one, params passed in req.body?
// poll - scoped to :workspaceId, repositories being polled all in workspaceId


// get_file - verify user is in a workspace with this repository added
// get - verify user is in a workspace with this repository added
// delete - verify user is in a workspace with this repository added
router.post('/repositories/retrieve', authorizationMiddleware.repositoryMiddleware, repository_controller.retrieveCreationRepositories );
router.post('/repositories/:workspaceId/get_file/:repositoryId', authorizationMiddleware.repositoryMiddleware, repository_controller.getRepositoryFile);
router.post('/repositories/:workspaceId/retrieve', authorizationMiddleware.repositoryMiddleware, repository_controller.retrieveRepositories);
router.post('/repositories/validate', authorizationMiddleware.repositoryMiddleware, repository_controller.validateRepositories);
router.post('/repositories/:workspaceId/poll', authorizationMiddleware.repositoryMiddleware, repository_controller.pollRepositories);
router.get('/repositories/:workspaceId/get/:repositoryId', authorizationMiddleware.repositoryMiddleware, repository_controller.getRepository);
router.delete('/repositories/:workspaceId/delete/:repositoryId', authorizationMiddleware.repositoryMiddleware, repository_controller.deleteRepository);


// create - verify user exists

// search - verify membership in workspace for calling user
// get - verify membership in workspace for calling user
// delete - verify membership in workspace for calling user
// add_user - verify membership in workspace for calling user
// remove_user - verify membership in workspace for calling user

// retrieve - verify user is a member of all workspaces returned
const workspace_controller = require('../controllers/WorkspaceController');

// TODO: This route cannot be properly secured without a list of repositories that a particular user has access to.
router.post('/workspaces/create', authorizationMiddleware.workspaceMiddleware, workspace_controller.createWorkspace);
router.post('/workspaces/search/:workspaceId', authorizationMiddleware.workspaceMiddleware, workspace_controller.searchWorkspace);
router.get('/workspaces/get/:workspaceId', authorizationMiddleware.workspaceMiddleware, workspace_controller.getWorkspace);
router.delete('/workspaces/delete/:workspaceId', authorizationMiddleware.workspaceMiddleware, workspace_controller.deleteWorkspace);
router.put('/workspaces/:workspaceId/add_user/:userId', authorizationMiddleware.workspaceMiddleware, workspace_controller.addWorkspaceUser);
router.put('/workspaces/:workspaceId/remove_user/:userId', authorizationMiddleware.workspaceMiddleware, workspace_controller.removeWorkspaceUser);

router.post('/workspaces/retrieve', authorizationMiddleware.workspaceMiddleware, workspace_controller.retrieveWorkspaces);


// All of these tag routes are handled by the same case (Yay!)

// create - verify membership in workspace for calling user
// get - verify membership in workspace for calling user, then verify tag is in workspace
// edit - verify membership in workspace for calling user, then verify tag is in workspace
// delete - verify membership in workspace for calling user, then verify tag is in workspace
// retrieve - scope query to a single workspace, verify user is a member of the workspace, nothing in middleware


const tag_controller = require('../controllers/TagController');
router.post('/tags/:workspaceId/create', authorizationMiddleware.tagMiddleware, tag_controller.createTag);
router.get('/tags/:workspaceId/get/:tagId', authorizationMiddleware.tagMiddleware, tag_controller.getTag);
router.put('/tags/:workspaceId/edit/:tagId', authorizationMiddleware.tagMiddleware, tag_controller.editTag);
router.delete('/tags/:workspaceId/delete/:tagId', authorizationMiddleware.tagMiddleware, tag_controller.deleteTag);
router.post('/tags/:workspaceId/retrieve', authorizationMiddleware.tagMiddleware, tag_controller.retrieveTags);

//auth routes
const auth_controller = require('../controllers/authentication/AuthController');
router.get('/auth/login/success', auth_controller.loginSuccess);
router.get('/auth/login/failed', auth_controller.loginFailed);
router.get('/auth/logout', auth_controller.logout);


// router.get('/auth/github', passport.authenticate("github"));
router.get('/auth/github', function(req, res, next) {
    passport.authenticate('github', {session: false}, function(err, user, info) {
      if (err) { return next(err); }
      // TODO: Change this to appropriate route
      if (!user) { console.log('!user == true'); return res.redirect('/login'); }

      var jwtToken = createUserJWTToken(user._id, user.role);

      res.cookie('user-jwt', jwtToken, { httpOnly: true });
      
      return res.redirect('/api/auth/github/redirect');
    })(req, res, next);
});


/*
app.get('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/users/' + user.username);
    });
  })(req, res, next);
});
*/


router.get('/auth/github/redirect', passport.authenticate("github", {session: false}), (req, res) => {
    // console.log('Request Host: ', req.get('host'));
    // if (err) { return res.json({success: false, error: err}) }
    // TODO: Change this to appropriate route
    //console.log('REQ: ', req);
    //console.log('RES: ', res);
    
    if (!req.user) { console.log('!req.user == true'); return res.redirect('/login'); }

    var jwtToken = createUserJWTToken(req.user._id, req.user.role);

    res.cookie('user-jwt', jwtToken, { httpOnly: true });
    
    if (req.query.state === "installing") {
        res.redirect(`http://localhost:3000/installed`);
    } else {
        res.redirect(CLIENT_HOME_PAGE_URL);
    }
});


/*
router.get('/auth/github/redirect', passport.authenticate("github"), function(req, res){
                                            console.log('Request Host: ', req.get('host'));
                                            if (req.query.state === "installing") {
                                                res.redirect(`http://localhost:3000/installed`);
                                            } else {
                                                res.redirect(CLIENT_HOME_PAGE_URL);
                                            }
                                        });
*/
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

// get - userId must match user to fetch
// edit - user must match the user to edit
// attach_workspace - user must be a member in the memberUsers field of Workspace
// remove_workspace - user must be a member in the memberUsers field of Workspace
// delete_user - user must match the user to delete

// We can use one switch case, with a conditional for if :userId is a param, or :workspaceId is a param
// If :userId, verify that JWT userId matches :userId
// If :workspaceId, verify that user is in memberUsers of Workspace

const user_controller = require('../controllers/authentication/UserController');

router.get('/users/get/:userId', authorizationMiddleware.userMiddleware, user_controller.getUser);
router.put('/users/edit/:userId', authorizationMiddleware.userMiddleware, user_controller.editUser);
router.put('/users/attach_workspace/:workspaceId', authorizationMiddleware.userMiddleware, user_controller.attachUserWorkspace);
router.put('/users/remove_workspace/:workspaceId', authorizationMiddleware.userMiddleware, user_controller.removeUserWorkspace);
router.delete('/users/delete_user/:workspaceId', authorizationMiddleware.userMiddleware, user_controller.deleteUser);

//token routes
// must be a dev JWT
const token_controller = require('../controllers/TokenController');
router.post('/tokens/create', authorizationMiddleware.tokenMiddleware, token_controller.createToken);


const check_controller = require('../controllers/CheckController');
router.post('/checks/:repositoryId/create', authorizationMiddleware.checkMiddleware, check_controller.createCheck);

const pull_request_controller = require('../controllers/PullRequestController');
router.post('/pull_requests/:repositoryId/create', authorizationMiddleware.pullRequestMiddleware, pull_request_controller.createPullRequest);


//linkage routes
const linkage_controller = require('../controllers/LinkageController');
router.post('/linkages/:workspaceId/create', authorizationMiddleware.linkageMiddleware, linkage_controller.createLinkage);
router.get('/linkages/:workspaceId/get/:linkageId', authorizationMiddleware.linkageMiddleware, linkage_controller.getLinkage);
router.put('/linkages/:workspaceId/edit/:linkageId', authorizationMiddleware.linkageMiddleware, linkage_controller.editLinkage);
router.delete('/linkages/:workspaceId/delete/:linkageId', authorizationMiddleware.linkageMiddleware, linkage_controller.deleteLinkage);
router.post('/linkages/:workspaceId/retrieve', authorizationMiddleware.linkageMiddleware, linkage_controller.retrieveLinkages);
router.put('/linkages/:workspaceId/:linkageId/attach_reference/:referenceId', authorizationMiddleware.linkageMiddleware, linkage_controller.attachLinkageReference);
router.put('/linkages/:workspaceId/:linkageId/remove_reference/:referenceId', authorizationMiddleware.linkageMiddleware, linkage_controller.removeLinkageReference);
router.put('/linkages/:workspaceId/:linkageId/attach_tag/:tagId', authorizationMiddleware.linkageMiddleware, linkage_controller.attachLinkageTag);
router.put('/linkages/:workspaceId/:linkageId/remove_tag/:tagId', authorizationMiddleware.linkageMiddleware, linkage_controller.removeLinkageTag);

module.exports = router;

