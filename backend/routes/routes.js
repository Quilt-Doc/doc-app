// TODO: Add Workspace, Repository Delete Routes and methods 

const express = require('express');
const router = express.Router();

const reference_controller = require('../controllers/ReferenceController');
router.post('/references/create', reference_controller.createReferences);
router.post('/references/get', reference_controller.getReferences);


const workspace_controller = require('../controllers/WorkspaceController');
router.post('/workspaces/create', workspace_controller.createWorkspace);
router.get('/workspaces/get/:id', workspace_controller.getWorkspace);
router.delete('/workspaces/delete/:id', workspace_controller.deleteWorkspace);
router.put('/workspaces/add_user/:id', workspace_controller.addUser);
router.put('/workspaces/remove_user/:id', workspace_controller.removeUser);

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

const user_controller = require('../controllers/UserController');
router.post('/users/create', user_controller.createUser);
router.get('/users/get/:id', user_controller.getUser);
router.put('/users/edit/:id', user_controller.editUser);
router.put('/users/attach_workspace/:id', user_controller.attachWorkspace);
router.put('/users/remove_workspace/:id', user_controller.removeWorkspace);
router.delete('/users/delete_user/:id', user_controller.deleteUser);


// Export API routes

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

const repository_controller = require('../controllers/RepositoryController');
router.post('/repositories/refresh_path', repository_controller.refreshRepositoryPath)
router.post('/repositories/refresh_path_new', repository_controller.refreshRepositoryPathNew);
router.post('/repositories/get_file', repository_controller.getRepositoryFile);
router.post('/repositories/parse_file', repository_controller.parseRepositoryFile);
router.post('/repositories/get_refs', repository_controller.getRepositoryRefs);
router.post('/repositories/create', repository_controller.createRepository);
router.post('/repositories/retrieve', repository_controller.retrieveRepositories);
router.get('/repositories/get/:id', repository_controller.getRepository);
router.delete('/repositories/delete/:id', repository_controller.deleteRepository);


module.exports = router;