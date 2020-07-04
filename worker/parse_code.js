var fs = require('fs'),
    xml2js = require('xml2js');
    
var path = require('path');

var DOMParser = require('xmldom').DOMParser;

const fsPromises = require('fs').promises
const apis = require('./apis/api');
const api = apis.requestClient();


const Reference = require('./models/Reference');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const url = require('url');

const tokenUtils = require('./utils/token_utils');

var request = require("request");



const apiURL = 'https://api.github.com';

const repoBaseURL = 'https://github.com/'

const fsPath = require('fs-path');


const COMPOUND_KINDS = ["class", "struct", "union", "interface", "protocol", "category",
"exception", "file", "namespace", "group", "page", "example", "dir", "type"];

const MEMBER_KINDS = ['define', 'property', 'event', 'variable', 'typedef', 'enum',
'enumvalue', 'function', 'signal', 'prototype', 'friend', 'dcop', 'slot'];


getRefs = () => {

    var worker = require('cluster').worker;

    worker.send({receipt: process.env.receipt})

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
                    parser.parseString(data, function (err, result) {
                        if (err) {
                            console.log('getRefs error on parseString: ' + err);
                            worker.process.kill(worker.process.pid)
                            return;
                        }
                        // console.log(result);
                        console.log('getRefs parseString successful');

                        var compounds = result['doxygenindex']['compound'];
                        var target_refs = []
                        compounds.forEach(function (item, index) {
                            target_refs.push(item);
                            var members = item['member'];
                            if (!(typeof members == 'undefined') && !(members == null)) {

                                members.forEach(function (elem, idx) {
                                    target_refs.push(elem);
                                });
                            }

                        });

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

                        func(target_files)
                            .then(results =>  {
                                // console.log('target file called');
                                // console.log(res);
                                results.forEach( function(read_file, file_num) {
                                    var xmlDoc = default_parser.parseFromString(read_file.toString(), "text/xml");
                                    var compound_defs = xmlDoc.getElementsByTagName("compounddef");


                                    target_refs.forEach(function (i, k) {
                                        var found_element = xmlDoc.getElementById(i['$']['refid']);
                                        var location = ''
                                        var file = ''
                                        var name = ''
                                        var kind = ''

                                        if (found_element) {
                                            kind = found_element.getAttribute('kind');
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
                                            file = file.substring(file.indexOf('/')+1);
                                            file = file.substring(file.indexOf('/')+1);

                                            found_refs.push({name: name, kind: kind, path: file, location: location, repository: repositoryId})
                                        }
                                    })
                                });
                                console.log('END FOUND_REFS');
                                // console.log(found_refs);
                                
                                createReferences(found_refs, worker);
                            })
                            //.catch(console.log);
                            .catch((error) => {
                                console.error('Error: ', error);
                                worker.process.kill(worker.process.pid);
                                return;
                            });
                    });
                });

            });
        });
    });
}



createReferences = (refList, worker) => {


    if (!typeof refList == 'undefined' && refList !== null) {
        console.log('Error: no refList provided');
        return;//  res.json({success: false, error: 'no reference refList provided'});
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

        let reference = new Reference({
            name: name,
            path: path,
            repository: ObjectId(repositoryId)

        });

        if (lineNum) reference.lineNum = lineNum;
        if (kind) reference.kind = kind;
        if (file) reference.file = file;

        return reference;
    })

    console.log('REF OBJ LIST');
    // console.log(refObjList);
    Reference.create( refObjList, (err, reference) => {
        if (err) {
            console.log('Error: ', err);
        }
        console.log('Created references');
        worker.process.kill(worker.process.pid);
        return;
    });
}


module.exports = {
    getRefs
}