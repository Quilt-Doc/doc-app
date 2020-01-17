const express = require('express');
const router = express.Router();

const workspace_controller = require('../controllers/WorkspaceController');
router.post('/workspaces/create', workspace_controller.createWorkspace);

// Export API routes
module.exports = router;