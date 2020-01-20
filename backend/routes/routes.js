const express = require('express');
const router = express.Router();


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

const folder_controller = require('../controllers/FolderController');

router.post('/folders/create', folder_controller.createFolder);
router.put('/folders/edit/:id', folder_controller.editFolder);
router.get('/folders/get/:id', folder_controller.getFolder);
router.put('/folders/delete/:id', folder_controller.deleteFolder);
router.get('/folders/retrieve/', folder_controller.retrieveFolders);
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


const codebase_controller = require('../controllers/CodebaseController');
router.post('/codebases/create', codebase_controller.createCodebase);
router.get('/codebases/get/:id', codebase_controller.getCodebase);



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
router.put('/users/delete_user/:id', user_controller.deleteUser);

const tag_controller = require('../controllers/TagController');
router.post('/tag/create', tag_controller.createTag);
router.get('/tag/get/:id', tag_controller.getTag);
router.put('/tag/edit/:id', tag_controller.editTag);
router.put('/tag/delete/:id', tag_controller.deleteTag);



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
module.exports = router;