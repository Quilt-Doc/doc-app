const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

var urlencodedParser = bodyParser.urlencoded({extended: false});
var jsonParser = bodyParser.json();

const workspace_controller = require('../controllers/WorkspaceController');
router.post('/workspaces/create', /*[urlencodedParser, jsonParser],*/ workspace_controller.createWorkspace);

const document_controller = require('../controllers/DocumentController');
router.post('/documents/create', urlencodedParser, document_controller.createDocument);

// Export API routes
module.exports = router;