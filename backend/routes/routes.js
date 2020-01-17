const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

const workspace_controller = require('../controllers/WorkspaceController');
router.post('/workspaces/create', /*[urlencodedParser, jsonParser],*/ workspace_controller.createWorkspace);


const document_controller = require('../controllers/DocumentController');
router.post('/documents/create', document_controller.createDocument);
router.get('/documents/get/:id', document_controller.getDocument);
router.put('/documents/edit/:id', document_controller.editDocument);
router.delete('/documents/delete/:id', document_controller.deleteDocument);
router.post('/documents/retrieve', document_controller.retrieveDocuments);
router.put('/documents/attach_tag/:id', document_controller.attachTag);
router.put('/documents/remove_tag/:id', document_controller.removeTag);
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

const relationship_controller = require('../controllers/RelationshipController');
router.post('/relationships/create', relationship_controller.createRelationship);
router.get('/relationships/get/:id', relationship_controller.getRelationship);
router.put('/relationships/edit/:id', relationship_controller.editRelationship);
router.delete('/relationships/delete/:id', relationship_controller.deleteRelationship);
router.post('/relationships/retrieve', relationship_controller.retrieveRelationships);

const uploadFile_controller = require('../controllers/UploadFileController');
router.post('/uploadfiles/create', uploadFile_controller.createUploadFile);
router.get('/uploadfiles/get/:id', uploadFile_controller.getUploadFile);
router.put('/uploadfiles/edit/:id', uploadFile_controller.editUploadFile);
router.delete('/uploadfiles/delete/:id', uploadFile_controller.deleteUploadFile);
router.post('/uploadfiles/retrieve', uploadFile_controller.retrieveUploadFiles);

const snippet_controller = require('../controllers/SnippetController');
router.post('/snippets/create', snippet_controller.createSnippet);
router.get('/snippets/get/:id', snippet_controller.getSnippet);
router.put('/snippets/edit/:id', snippet_controller.editSnippet);
router.delete('/snippets/delete/:id', snippet_controller.deleteSnippet);
router.post('/snippets/retrieve', snippet_controller.retrieveSnippets);
router.put('/snippets/attach_folder/:id', snippet_controller.attachFolder);
router.put('/snippets/remove_folder/:id', snippet_controller.removeFolder);
router.put('/snippets/attach_document/:id', snippet_controller.attachDocument);
router.put('/snippets/remove_document/:id', snippet_controller.removeDocument);

const request_controller = require('../controllers/RequestController');
router.post('/requests/create', request_controller.createRequest);
router.get('/requests/get/:id', request_controller.getRequest);
router.put('/requests/edit/:id', request_controller.editRequest);
router.delete('/requests/delete/:id', request_controller.deleteRequest);
router.post('/requests/retrieve', request_controller.retrieveRequests);
// Export API routes
module.exports = router;