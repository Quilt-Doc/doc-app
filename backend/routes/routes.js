// TODO: Add Workspace, Repository Delete Routes and methods 
const passport = require("passport");

// KARAN TODO: Replace these with environment variables
const CLIENT_HOME_PAGE_URL = "http://localhost:3000";
const INSTALLED_URL = "http://localhost:3000/installed";

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

const referenceController = require('../controllers/ReferenceController');

router.post('/references/create', authorizationMiddleware.referenceMiddleware, referenceController.createReferences);
router.get('/references/:workspaceId/get/:referenceId', authorizationMiddleware.referenceMiddleware, referenceController.getReference);
router.put('/references/:workspaceId/edit/:referenceId', authorizationMiddleware.referenceMiddleware, referenceController.editReference);
router.delete('/references/:workspaceId/delete/:referenceId', authorizationMiddleware.referenceMiddleware, referenceController.deleteReference);
router.put('/references/:workspaceId/:referenceId/attach_tag/:tagId', authorizationMiddleware.referenceMiddleware, referenceController.attachReferenceTag);
router.put('/references/:workspaceId/:referenceId/remove_tag/:tagId', authorizationMiddleware.referenceMiddleware, referenceController.removeReferenceTag);
router.post('/references/:workspaceId/retrieve', authorizationMiddleware.referenceMiddleware, referenceController.retrieveReferences);

// Validate workspace membership for calling user; all methods
const documentController = require('../controllers/DocumentController');
router.post('/testRoute', documentController.testRoute);
router.post('/documents/:workspaceId/create', authorizationMiddleware.documentMiddleware, documentController.createDocument);
router.get('/documents/:workspaceId/get/:documentId', authorizationMiddleware.documentMiddleware, documentController.getDocument);
router.put('/documents/:workspaceId/edit/:documentId', authorizationMiddleware.documentMiddleware, documentController.editDocument);
router.delete('/documents/:workspaceId/delete/:documentId', authorizationMiddleware.documentMiddleware, documentController.deleteDocument);
router.put('/documents/:workspaceId/rename/:documentId', authorizationMiddleware.documentMiddleware, documentController.renameDocument);
router.put('/documents/:workspaceId/move/:documentId', authorizationMiddleware.documentMiddleware, documentController.moveDocument);
router.post('/documents/:workspaceId/retrieve', authorizationMiddleware.documentMiddleware, documentController.retrieveDocuments);


router.put('/documents/:workspaceId/:documentId/attach_tag/:tagId', authorizationMiddleware.documentMiddleware, documentController.attachDocumentTag);
router.put('/documents/:workspaceId/:documentId/remove_tag/:tagId', authorizationMiddleware.documentMiddleware, documentController.removeDocumentTag);

router.put('/documents/:workspaceId/:documentId/attach_reference/:referenceId', authorizationMiddleware.documentMiddleware, documentController.attachDocumentReference);
router.put('/documents/:workspaceId/:documentId/remove_reference/:referenceId', authorizationMiddleware.documentMiddleware, documentController.removeDocumentReference);


router.put('/documents/:workspaceId/:documentId/attach_snippet/:snippetId', authorizationMiddleware.documentMiddleware, documentController.attachDocumentSnippet);
router.put('/documents/:workspaceId/:documentId/remove_snippet/:snippetId', authorizationMiddleware.documentMiddleware, documentController.removeDocumentSnippet);

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
router.post('/snippets/:workspaceId/:referenceId/create', authorizationMiddleware.snippetMiddleware, snippetController.createSnippet);
router.get('/snippets/:workspaceId/get/:snippetId', authorizationMiddleware.snippetMiddleware, snippetController.getSnippet);
router.put('/snippets/:workspaceId/edit/:snippetId', authorizationMiddleware.snippetMiddleware, snippetController.editSnippet);
router.delete('/snippets/:workspaceId/delete/:snippetId', authorizationMiddleware.snippetMiddleware, snippetController.deleteSnippet);
router.post('/snippets/:workspaceId/retrieve', authorizationMiddleware.snippetMiddleware, snippetController.retrieveSnippets);


const repositoryController = require('../controllers/RepositoryController');

// Dev only

// create - dev role only
// update - dev role only

router.post('/repositories/init', authorizationMiddleware.repositoryMiddleware, repositoryController.initRepository);
router.post('/repositories/update', authorizationMiddleware.repositoryMiddleware, repositoryController.updateRepository);
router.post('/repositories/job_retrieve', authorizationMiddleware.repositoryMiddleware, repositoryController.jobRetrieveRepositories);

// User accessible


// retrieve - Scope to workspace? Add a :workspaceId, then in Controller filter returned repositories down to those in workspace

// Ignore these two routes for now, they are going to be refactored
// validate - TODO: Figure out how to handle this one, params passed in req.body?
// poll - scoped to :workspaceId, repositories being polled all in workspaceId


// get_file - verify user is in a workspace with this repository added
// get - verify user is in a workspace with this repository added
// delete - verify user is in a workspace with this repository added
router.post('/repositories/retrieve', authorizationMiddleware.repositoryMiddleware, repositoryController.retrieveCreationRepositories );
router.post('/repositories/:workspaceId/get_file/:repositoryId', authorizationMiddleware.repositoryMiddleware, repositoryController.getRepositoryFile);
router.post('/repositories/:workspaceId/retrieve', authorizationMiddleware.repositoryMiddleware, repositoryController.retrieveRepositories);
router.get('/repositories/:workspaceId/get/:repositoryId', authorizationMiddleware.repositoryMiddleware, repositoryController.getRepository);
router.delete('/repositories/:workspaceId/delete/:repositoryId', authorizationMiddleware.repositoryMiddleware, repositoryController.deleteRepository);

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
router.put('/workspaces/:workspaceId/add_user/:userId', authorizationMiddleware.workspaceMiddleware, workspaceController.addWorkspaceUser);
router.put('/workspaces/:workspaceId/remove_user/:userId', authorizationMiddleware.workspaceMiddleware, workspaceController.removeWorkspaceUser);

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

router.get('/auth/github/redirect', passport.authenticate("github", {session: false}), (req, res) => {
    // console.log('Request Host: ', req.get('host'));
    // if (err) { return res.json({success: false, error: err}) }
    // TODO: Change this to appropriate route
    
    if (!req.user) { console.log('req.user != true'); return res.redirect('/login'); }

    var jwtToken = createUserJWTToken(req.user._id, req.user.role);

    res.cookie('user-jwt', jwtToken, { httpOnly: true });
    
    if (req.query.state === "installing") {
        res.redirect(INSTALLED_URL);
    } else {
        res.redirect(CLIENT_HOME_PAGE_URL);
    }
});

router.post('/auth/check_installation', authorizationMiddleware.authMiddleware, authController.checkInstallation);
router.post('/auth/retrieve_domain_repositories', authorizationMiddleware.authMiddleware, authController.retrieveDomainRepositories);



const reportingController = require('../controllers/reporting/ReportingController');
router.post('/reporting/:workspaceId/retrieve_broken_documents', authorizationMiddleware.reportingMiddleware, reportingController.retrieveBrokenDocuments);
router.post('/reporting/:workspaceId/retrieve_activity_feed_items', authorizationMiddleware.reportingMiddleware, reportingController.retrieveActivityFeedItems);
router.post('/reporting/:workspaceId/retrieve_user_stats', authorizationMiddleware.reportingMiddleware, reportingController.retrieveUserStats);


const userController = require('../controllers/authentication/UserController');

router.get('/users/get/:userId', authorizationMiddleware.userMiddleware, userController.getUser);
router.put('/users/edit/:userId', authorizationMiddleware.userMiddleware, userController.editUser);
router.put('/users/attach_workspace/:workspaceId', authorizationMiddleware.userMiddleware, userController.attachUserWorkspace);
router.put('/users/remove_workspace/:workspaceId', authorizationMiddleware.userMiddleware, userController.removeUserWorkspace);
router.delete('/users/delete_user/:workspaceId', authorizationMiddleware.userMiddleware, userController.deleteUser);

//token routes
// must be a dev JWT
const tokenController = require('../controllers/TokenController');
router.post('/tokens/create', authorizationMiddleware.tokenMiddleware, tokenController.createToken);
router.post('/tokens/delete', authorizationMiddleware.tokenMiddleware, tokenController.deleteInstallationToken);

const checkController = require('../controllers/CheckController');
router.post('/checks/:repositoryId/create', authorizationMiddleware.checkMiddleware, checkController.createCheck);

/*
    const pullRequestController = require('../controllers/unused/PullRequestController');
    router.post('/pull_requests/:repositoryId/create', authorizationMiddleware.pullRequestMiddleware, pullRequestController.createPullRequest);


    //linkage routes
    const linkageController = require('../controllers/LinkageController');
    router.post('/linkages/:workspaceId/create', authorizationMiddleware.linkageMiddleware, linkageController.createLinkage);
    router.get('/linkages/:workspaceId/get/:linkageId', authorizationMiddleware.linkageMiddleware, linkageController.getLinkage);
    router.put('/linkages/:workspaceId/edit/:linkageId', authorizationMiddleware.linkageMiddleware, linkageController.editLinkage);
    router.delete('/linkages/:workspaceId/delete/:linkageId', authorizationMiddleware.linkageMiddleware, linkageController.deleteLinkage);
    router.post('/linkages/:workspaceId/retrieve', authorizationMiddleware.linkageMiddleware, linkageController.retrieveLinkages);
    router.put('/linkages/:workspaceId/:linkageId/attach_reference/:referenceId', authorizationMiddleware.linkageMiddleware, linkageController.attachLinkageReference);
    router.put('/linkages/:workspaceId/:linkageId/remove_reference/:referenceId', authorizationMiddleware.linkageMiddleware, linkageController.removeLinkageReference);
    router.put('/linkages/:workspaceId/:linkageId/attach_tag/:tagId', authorizationMiddleware.linkageMiddleware, linkageController.attachLinkageTag);
    router.put('/linkages/:workspaceId/:linkageId/remove_tag/:tagId', authorizationMiddleware.linkageMiddleware, linkageController.removeLinkageTag);
*/

module.exports = router;

