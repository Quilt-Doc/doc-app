const url = require('url');

const axios = require('../apis/api');
const api = axios.requestClient();

const API_URL = 'https://api.github.com';

/*repoSearch = (req, res) => {
    console.log(req.body);
    const { repo_name } = req.body;
    const response = await api.get('/repos//create', formValues );

    if (!typeof repo_name == 'undefined' && repo_name !== null) return res.json({success: false, error: 'no repo repo_name provided'});
    
    return res.json({status: 'SUCCESS'});
}*/

repoRefreshPath = (req, res) => {
    console.log(req.body);
    var { repo_name, repo_path} = req.body;
    if (!typeof repo_name == 'undefined' && repo_name !== null) return res.json({success: false, error: 'no repo repo_name provided'});
    if (typeof repo_path == 'undefined') repo_path = '';
    
    var repos_create = url.resolve(API_URL, '/repos/create');
    console.log(repos_create);
    
    var repos_contents = url.resolve(url.resolve(repos_create, repo_name), 'contents/');
    console.log(repos_contents);

    const req_url = url.resolve(repos_contents, repo_path);
    console.log(req_url)
    api.get(req_url)
    .then(function (response) {
        return res.json(response.data);
      })
      .catch(function (err) {
        return res.json({ success: false, error: err });
      });
}

module.exports = {
    repoRefreshPath
}