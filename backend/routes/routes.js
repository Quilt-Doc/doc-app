const express = require('express');
const router = express.Router();

const document_controller = require('../controllers/DocumentController')
router.post('/documents/create', document_controller.createDocumet);


const workspace_controller = require('../controllers/WorkspaceController');
router.post('/workspace/create', workspace_controller.createWorkspace);

// Export API routes
module.exports = router;
