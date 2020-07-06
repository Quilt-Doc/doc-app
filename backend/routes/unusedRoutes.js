const express = require('express');
const router = express.Router();


//UNUSED

/*

const folder_controller = require('../controllers/FolderController');
router.post('/folders/create', folder_controller.createFolder);
router.put('/folders/edit/:id', folder_controller.editFolder);
router.get('/folders/get/:id', folder_controller.getFolder);
router.delete('/folders/delete/:id', folder_controller.deleteFolder);
router.post('/folders/retrieve/', folder_controller.retrieveFolders);
router.put('/folders/attach_snippet/:id', folder_controller.attachSnippet);
router.put('/folders/remove_snippet/:id', folder_controller.removeSnippet);
router.put('/folders/attach_upload_file/:id', folder_controller.attachUploadFile);
router.put('/folders/remove_upload_file/:id', folder_controller.removeUploadFile);
router.put('/folders/attach_tag/:id', folder_controller.attachTag);
router.put('/folders/remove_tag/:id', folder_controller.removeTag);
router.put('/folders/add_can_write/:id', folder_controller.addCanWrite);
router.put('/folders/remove_can_write/:id', folder_controller.removeCanWrite);
router.put('/folders/add_can_read/:id', folder_controller.addCanRead);
router.put('/folders/remove_can_read/:id', folder_controller.removeCanRead);

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

const request_controller = require('../controllers/RequestController');
router.post('/requests/create', request_controller.createRequest);
router.get('/requests/get/:id', request_controller.getRequest);
router.put('/requests/edit/:id', request_controller.editRequest);
router.delete('/requests/delete/:id', request_controller.deleteRequest);
router.post('/requests/retrieve', request_controller.retrieveRequests);

const tag_controller = require('../controllers/TagController');
router.post('/tags/create', tag_controller.createTag);
router.get('/tags/get/:id', tag_controller.getTag);
router.put('/tags/edit/:id', tag_controller.editTag);
router.delete('/tags/delete/:id', tag_controller.deleteTag);
router.post('/tags/retrieve', tag_controller.retrieveTags);

const comment_controller = require('../controllers/CommentController');
router.post('/comments/create', comment_controller.createComment);
router.get('/comments/get/:id', comment_controller.getComment);
router.put('/comments/edit/:id', comment_controller.editComment);
router.delete('/comments/delete/:id', comment_controller.deleteComment);
router.post('/comments/retrieve', comment_controller.retrieveComments);
*/

//DEPRECATED
/*

const repository_item_controller = require('../controllers/RepositoryItemController');
router.post('/repository/items/create', repository_item_controller.createRepositoryItem)
router.put('/repository/items/edit/:id', repository_item_controller.editRepositoryItem);
router.get('/repository/items/get/:id', repository_item_controller.getRepositoryItem);
router.post('/repository/items/retrieve', repository_item_controller.retrieveRepositoryItems);
router.delete('/repository/items/delete/:id', repository_item_controller.deleteRepositoryItem);
router.post('/repository/items/attach_document', repository_item_controller.attachDocument);
router.post('/repository/items/remove_document', repository_item_controller.removeDocument);


*/