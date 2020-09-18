var fs = require('fs'),
    xml2js = require('xml2js');
    
var path = require('path');

var DOMParser = require('xmldom').DOMParser;

const fsPromises = require('fs').promises
<<<<<<< HEAD:worker/parse_code.js
const apis = require('./apis/api');
const api = apis.requestGithubClient();
=======
>>>>>>> 2b188f80be04dab998def19e7e4dd5cf9f3479b4:worker/parse_doxygen.js


const Reference = require('./models/Reference');
const Repository = require('./models/Repository');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const url = require('url');

const tokenUtils = require('./utils/token_utils');

var request = require("request");


const fsPath = require('fs-path');

const constants = require('./constants/index');


const getParseableTree = async () => {

    var treeReferences = await Reference.find({repository: ObjectId(process.env.repositoryId), kind: 'file'}).catch(err => console.log('Error getting tree references: ', err));
    var parseLevelLookup = {};
    var i;
    for (i = 0; i < treeReferences.length; i++) {
	var treeReference = treeReferences[i];
	var newObj = {};
	var semanticParsed = false;
	if (treeReference.parseProvider) {
	    if (treeReference.parseProvider == 'semantic') {
		semanticParsed = true;
	   }
	}
	parseLevelLookup[treeReference.path] =  semanticParsed;
    }
    console.log('parseLevelLookup: ');
    // console.log(parseLevelLookup);
    return parseLevelLookup
}

const updateJobStatus = async (status) => {

    return await Repository.updateOne({_id: ObjectId(process.env.repositoryId)}, {$set: {doxygenJobStatus: status}});

}

const killJob = async (worker, status, msg, err) => {
    
    return await updateJobStatus(status)
	.then(result => {
	    if (msg) console.log(msg);
            if (err) console.log(err);
	    worker.process.kill(worker.process.pid);
	})
	.catch(result => {
	    console.log('Doxygen: error updating job status');
	    if (msg) console.log(msg);
            if (err) console.log(err);
	    worker.process.kill(worker.process.pid);
	});
}



getRefs = async () => {

    var worker = require('cluster').worker;

    worker.send({receipt: process.env.receipt})

    await updateJobStatus(constants.jobs.JOB_STATUS_RUNNING);

    var parseLevelLookup = await getParseableTree();

    var repositoryId = process.env.repositoryId;
    var installToken = await tokenUtils.getInstallToken(process.env.installationId);

    var cloneUrl = "https://x-access-token:" + installToken.value  + "@" + process.env.cloneUrl.replace("https://", "");


    var timestamp = Date.now().toString();    
    var repoDiskPath = 'git_repos/' + timestamp +'/';
    const { exec, execFile } = require('child_process');

    const child = execFile('git', ['clone', cloneUrl, repoDiskPath], (error, stdout, stderr) => {
        if (error) {
            console.log('getRefs error on execFile: ' + error);
            worker.process.kill(worker.process.pid)
            return;
        }
        console.log('getRefs git clone successful');
        var new_env = process.env;
        new_env.DOXYGEN_FILE = repoDiskPath;
        new_env.DOXYGEN_XML_DIR = 'git_repos/' + timestamp + '_xml/';

        const child = execFile('doxygen', ['Doxyfile'], {env: new_env, maxBuffer: (1024*1024)*50}, (error, stdout, stderr) => {
            if (error) {
                console.log('getRefs error on execFile: ' + error);
                worker.process.kill(worker.process.pid)
                return;
            }
            console.log('getRefs doxygen successful');

            fs.readdir(new_env.DOXYGEN_XML_DIR, (err, files) => {
                // console.log(files)
                var target_files = files.filter(file => path.extname(file) == '.xml'
                                            && !(file == 'index.xml'));
                // console.log(target_files);
                        // Time to construct the final JSON to return
                var parser = new xml2js.Parser();
                fs.readFile(new_env.DOXYGEN_XML_DIR + 'index.xml', function(err, data) {
                    if (err) {
                        console.log('getRefs error on readFile: ' + err);
                        worker.process.kill(worker.process.pid);
                        return;
                    }
                    parser.parseString(data, async function (err, result) {
                        if (err) {
                            console.log('getRefs error on parseString: ' + err);
                            worker.process.kill(worker.process.pid)
                            return;
                        }
                        // console.log(result);
                        console.log('getRefs parseString successful');
			
			            var compounds = [];
                        var compounds = compounds.concat(result['doxygenindex']['compound']);
                        var target_refs = []
			            if (compounds.length > 0) {
                            compounds.forEach(function (item, index) {
                                target_refs.push(item);
                                // ERROR
			                    if (!item) {
				                    return;
			                    }
			                    if (!item.hasOwnProperty("member")) {
				                    return;
			                    }
			                    var members = item['member'];
                                if (!(typeof members == 'undefined') && !(members == null)) {
                                    members.forEach(function (elem, idx) {
                                        target_refs.push(elem);
                                    });
                                }
                            });
			            }

                        // Didn't find references, kill process, update job status
                        else {
                            await killJob(worker, constants.jobs.JOB_STATUS_FINISHED, 'No references found');
                        }
			

                        default_parser = new DOMParser();
                        var found_refs = [];

                        // console.log('target_refs')
                        // console.log(target_refs[0]);
                        const func = filenames => {
                            return Promise.all(
                                filenames.map(f => fsPromises.readFile(new_env.DOXYGEN_XML_DIR + '/' + f))
                            )
                        }

                        // console.log(target_files);

                        func(target_files).then(async (results) =>  {
                            // console.log('target file called');
                            // console.log(res);
                            results.forEach( async function(read_file, fileNum) {
                                var xmlDoc = default_parser.parseFromString(read_file.toString(), "text/xml");
                                var compound_defs = xmlDoc.getElementsByTagName("compounddef");
                                
                                target_refs.forEach(function (i, k) {
                                    var found_element = xmlDoc.getElementById(i['$']['refid']);
                                    var location = ''
                                    var file = ''
                                    var name = ''
                                    var kind = ''
                
                                    if (found_element ) {
                                        kind = found_element.getAttribute('kind');
                                        if (kind == 'file' || kind == 'dir') {
                                            console.log('skipping doxygen file/dir');
                                        }
                                        else {
                                            if (found_element.tagName === 'compounddef') {
                                                x = found_element.childNodes;
                                                // console.log('found compounddef');
                                                for (j = 0; j < x.length; j++) {
                                                    if (x[j].tagName === 'location') {
                                                        // console.log('compound - found location');
                                                        location = x[j].getAttribute('line');
                                                        file = x[j].getAttribute('file');
                                                    }
                                                    else if (x[j].tagName === 'compoundname') {
                                                        // console.log('compound - found name')
                                                        name = x[j].childNodes[0].nodeValue;
                                                        // console.log(name);
                                                    }
                                                }
                                            }
                                            else if (found_element.tagName === 'memberdef') {
                                                x = found_element.childNodes;
                                                for (j = 0; j < x.length; j++) {
                                                    if (x[j].tagName === 'location') {
                                                        location = x[j].getAttribute('line');
                                                        file = x[j].getAttribute('file');
                                                    }
                                                    else if (x[j].tagName === 'name') {
                                                        name = x[j].childNodes[0].nodeValue;
                                                    }
                                                }
                                            }
                                            // console.log('name, kind, file, location');
                                            // console.log(name, ' - ', kind, ' - ', file, ' - ', location);

                                            // Remove our local directories where we placed git repo contents
                                            file = file.substring(file.indexOf('git_repos'));
                        
                                            file = file.substring(file.indexOf('/')+1);
                                            file = file.substring(file.indexOf('/')+1);
                                            // console.log('Lookup Key: ', file);
                                            // if not a function or class for a semanticParsed file
                                            if (!(parseLevelLookup[file] && (kind == 'function' || kind == 'class'))) {
                                                found_refs.push({name: name, kind: kind, path: file, lineNum: location, repositoryId})
                                            }
                                            else {
                                                console.log('Skipping ref');
                                            }
                                        }
                                    }
                                });
                            });
                            console.log('END FOUND_REFS');
                            // console.log(found_refs);
                            await createReferences(found_refs, worker);
                        })
                        //.catch(console.log);
                        .catch(async (error) => {
                            await killJob(worker, constants.jobs.JOB_STATUS_ERROR, 'Error parsing references', error);
                            return;
                        });
                    });
                });
            });
        });
    });
}



createReferences = async (refList, worker) => {


    if (!typeof refList == 'undefined' && refList !== null) {
        await killJob(worker, constants.jobs.JOB_STATUS_ERROR, 'no refList provided');
    }
    console.log('refList');
    // console.log(refList);
    var refObjList = refList.map(ref => {
        var {name, kind, path, lineNum, path, repositoryId} = ref;
        if (!typeof name == 'undefined' && name !== null) {
            console.log('no `name` in refList provided');
            worker.process.kill(worker.process.pid);
            return;
        }
        if (!typeof path == 'undefined' && path !== null) {
            console.log('no `path` in refList provided');
            worker.process.kill(worker.process.pid);
            return;
        }

        if (!typeof repositoryId == 'undefined' && path !== null) {
            console.log('no `repositoryId` in refList provided');
            worker.process.kill(worker.process.pid);
            return;
        }

	repositoryId = ObjectId(repositoryId.toString());

        let reference = new Reference({
            name: name,
            path: path,
            repository: repositoryId
        });

        if (lineNum) reference.lineNum = lineNum;
        if (kind) reference.kind = kind;
	reference.parseProvider = 'doxygen';
	if (kind  != 'page') {
        	return reference;
	}
    })
    refObList = refObjList.filter(noPages => noPages);
    console.log('REF OBJ LIST');
    // console.log(refObjList);
    await Reference.insertMany( refObjList )
		.then(async (reference) => {
        	    console.log('Created references');
	            await killJob(worker, constants.jobs.JOB_STATUS_FINISHED); 
                   return;
    		})
    		.catch(async (err) => {
		    await killJob(worker, constants.jobs.JOB_STATUS_ERROR, 'Error creating Reference', err);
    		});
}


module.exports = {
    getRefs
}
