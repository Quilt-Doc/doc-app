const express = require('express');
const router = express.Router();

const workspace_controller = require('../controllers/Workspace_Controller');
router.post('/workspace/create', workspace_controller.createWorkspace);

// Export API routes
module.exports = router;