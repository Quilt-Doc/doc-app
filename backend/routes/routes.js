const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

const workspace_controller = require('../controllers/WorkspaceController');
router.post('/workspaces/create', workspace_controller.createWorkspace);
router.get('/workspaces/get/:id', workspace_controller.getWorkspace);
router.put('/workspaces/add_project/:id', workspace_controller.addProject);
router.put('/workspaces/remove_project/:id', workspace_controller.removeProject);
router.put('/workspaces/add_user/:id', workspace_controller.addUser);
router.put('/workspaces/remove_user/:id', workspace_controller.removeUser);

const project_controller = require('../controllers/ProjectController');
router.post('/projects/create', project_controller.createProject);
router.get('/projects/get/:id', project_controller.getProject);
router.put('/projects/edit/:id', project_controller.editProject);
router.put('/projects/delete/:id', project_controller.deleteProject);
router.put('/projects/import_codebase/:id', project_controller.importCodebase);
router.put('/projects/remove_codebase/:id', project_controller.removeCodebase);


const codebase_controller = require('../controllers/CodebaseController');
router.post('/codebases/create', codebase_controller.createCodebase);
router.get('/codebases/get/:id', codebase_controller.getCodebase);


const document_controller = require('../controllers/DocumentController');
router.post('/documents/create', document_controller.createDocument);

// Export API routes
module.exports = router;