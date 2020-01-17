const express = require('express');
const router = express.Router();

const workspace_controller = require('../controllers/WorkspaceController');
router.post('/workspaces/create', workspace_controller.createWorkspace);

const document_controller = require('../controllers/DocumentController');
router.post('/documents/create', document_controller.createDocument);

// Export API routes
module.exports = router;