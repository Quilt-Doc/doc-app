const url = require('url');

var request = require("request");

const axios = require('../apis/api');
const parse_utils = require('../utils/parse_code');

const api = axios.requestClient();

const API_URL = 'https://api.github.com';

const REPO_BASE_URL = 'https://github.com/'

const fs = require('fs');
const fsPath = require('fs-path');

const Codebase = require('../models/Codebase');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

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
    console.log('FINAL REQ URL: ', req_url);

    api.get(req_url)
    .then(function (response) {
        return res.json(response.data);
      })
      .catch(function (err) {
        return res.json({ success: false, error: err });
      });
}

repoRefreshPathNew = (req, res) => {
    console.log(req.body);
    var {repo_path} = req.body;
    if (!typeof repo_path == 'undefined' && repo_path !== null) return res.json({success: false, error: 'no repo repo_path provided'});
    
    if (repo_path[repo_path.length - 1] !== '/') {
        repo_path = repo_path + '/';
    }
    
    var second_name_first = repo_path.substring(repo_path.indexOf('/')+1);
    var second_name = second_name_first.substring(0, second_name_first.indexOf('/')+1);

    var repo_name = repo_path.substring(0, repo_path.indexOf('/')+1) + second_name;
    //repo_name = repo_path.substring(0,repo_path.indexOf('/')+1) + 

    repo_path = repo_path.substring(repo_path.indexOf(repo_name)+repo_name.length);


    var repos_create = url.resolve(API_URL, '/repos/create');
    console.log(repos_create);
    
    var repos_contents = url.resolve(url.resolve(repos_create, repo_name), 'contents/');
    console.log(repos_contents);

    const req_url = url.resolve(repos_contents, repo_path);
    console.log('FINAL REQ URL: ', req_url);

    api.get(req_url)
    .then(function (response) {
        return res.json(response.data);
      })
      .catch(function (err) {
        return res.json({ success: false, error: err });
      });
}


repoGetFile = (req, res) => {
    var { download_link} = req.body;
    if (typeof download_link == 'undefined' || download_link == null) return res.json({success: false, error: 'no repo download_link provided'});
    // if (typeof repo_name == 'undefined' || repo_name == null) return res.json({success: false, error: 'no repo repo_name provided'});
    
    console.log('download_link: ', download_link);
    // request.get(download_link).pipe(res);
    
    request.get(download_link, function(err, res_2, body) {


        var repo_path = download_link.substring(download_link.indexOf('.com/')+5);
        var owner = repo_path.substring(0, repo_path.indexOf('/'));
        var repo_name_temp = repo_path.substring(repo_path.indexOf(owner)+owner.length+1);
        var repo_name = repo_name_temp.substring(0, repo_name_temp.indexOf('/'));

        // Here we are trying to remove the '/master/' section
        var branch_and_path = repo_path.substring(repo_path.indexOf(repo_name)+repo_name.length+1);
        var file_path_in_repo = branch_and_path.substring(branch_and_path.indexOf('/')+1)

        console.log('repo_path: ', repo_path);
        console.log('owner: ', owner);
        console.log('repo_name: ', repo_name);
        console.log('branch_and_path: ', branch_and_path);
        console.log('file_path_in_repo: ', file_path_in_repo);

        var commit_url = url.resolve(API_URL, 'repos/');
        commit_url = url.resolve(commit_url, owner + '/');
        commit_url = url.resolve(commit_url, repo_name + '/');
        commit_url = url.resolve(commit_url, 'commits');

        var file_contents = body;

        api.get(commit_url, {
            params: {
              path: file_path_in_repo
            }
          })
          .then(function (response) {
            var latest_commit_sha = response.data[0]['sha'];
            console.log(response);
            return res.json({latest_file_commit: latest_commit_sha, file_contents: file_contents});
          })
          .catch(function (error) {
            return res.json({success: false, error: err});
          });


        //commit_url = url.resolve(commit_url, repo_link);
        //commit_url = url.resolve(commit_url, 'commits');
        // return res.json({data: body});
    });
}

repoParseFile = (req, res) => {
    
    //console.log(process.env);
    if (!(parseInt(process.env.CALL_DOXYGEN, 10))) {
        return res.json({success: false, error: 'doxygen disabled on this backend'});
    }

    var { file_contents, file_name } = req.body;
    console.log('repoParseFile received content: ', req.body);
    if (typeof file_contents == 'undefined' || file_contents == null) return res.json({success: false, error: 'no repo file_contents provided'});
    if (typeof file_name == 'undefined' || file_name == null) return res.json({success: false, error: 'no repo file_name provided'});

    file_name = Date.now() + '_' + file_name;

    fsPath.writeFile('doxygen_input/' + file_name, file_contents, function (err) {
        if (err) return console.log(err);
        console.log('File written to: ', file_name);
        var dir = './doxygen_xml';

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        parse_utils.parseCode(file_name, res);

    });

}


repoGetRefs = (req, res) => {
    
    //console.log(process.env);
    if (!(parseInt(process.env.CALL_DOXYGEN, 10))) {
        return res.json({success: false, error: 'doxygen disabled on this backend'});
    }

    var { repo_link } = req.body;
    console.log('repoGetRefs received content: ', req.body);
    if (typeof repo_link == 'undefined' || repo_link == null) return res.json({success: false, error: 'no repo repo_link provided'});

    var final_repo_link = url.resolve(REPO_BASE_URL, repo_link);
    parse_utils.getRefs(repo_link, final_repo_link, res);
}

repoUpdateCommit = (req, res) => {
    console.log(req.body);
    var { repo_id, repo_link } = req.body;
    if (!typeof repo_id == 'undefined' && repo_id !== null) return res.json({success: false, error: 'no repo repo_id provided'});
    if (!typeof repo_link == 'undefined' && repo_link !== null) return res.json({success: false, error: 'no repo repo_link provided'});

    repo_link = repo_link.substring(repo_link.indexOf('.com/')+ 5);

    var commit_url = url.resolve(API_URL, 'repos/');
    commit_url = url.resolve(commit_url, repo_link);
    commit_url = url.resolve(commit_url, 'commits');

    console.log('FINAL REQ URL: ', commit_url);

    api.get(commit_url)
    .then(function (response) {
        console.log('repoUpdateCommit response: ');
        console.log(response.data);
        var latest_sha = response.data[0]['sha'];
        console.log('latest_sha: ', latest_sha);
        
        Codebase.findById(repo_id, (err, codebase) => {
            // console.log('last_processed_commit.length: ', )
            if (codebase.last_processed_commit.length == 0) {
                let update = {};
                update.last_processed_commit = latest_sha;
                Codebase.findByIdAndUpdate(repo_id, { $set: update }, { new: true }, (err, updated_codebase) => {
                    if (err) return res.json({ success: false, error: err });
                    updated_codebase.populate('creator', (err, updated_codebase) => {
                        if (err) return res.json(err);
                        return res.json(updated_codebase);
                    });
                });
            }
            else {
                return res.json({ success: true, msg: 'Already found commit: ' +  codebase.last_processed_commit});
            }
        }).catch(function (err) {
            return res.json({ success: false, error: err});
        });
      })
      .catch(function (err) {
        return res.json({ success: false, error: err });
      });

}

module.exports = {
    repoRefreshPath, repoGetFile, repoParseFile, repoRefreshPathNew, repoGetRefs, repoUpdateCommit
}