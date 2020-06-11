var fs = require('fs'),
    xml2js = require('xml2js');
    
var path = require('path');

var DOMParser = require('xmldom').DOMParser;

const fsPromises = require('fs').promises


const COMPOUND_KINDS = ["class", "struct", "union", "interface", "protocol", "category",
"exception", "file", "namespace", "group", "page", "example", "dir", "type"];

const MEMBER_KINDS = ['define', 'property', 'event', 'variable', 'typedef', 'enum',
'enumvalue', 'function', 'signal', 'prototype', 'friend', 'dcop', 'slot'];


getRefs = (repo_link, res) => {

    var timestamp = Date.now().toString();    
    var repo_disk_path = 'git_repos/' + timestamp +'/';
    const { exec, execFile } = require('child_process');

    const child = execFile('git', ['clone', repo_link, repo_disk_path], (error, stdout, stderr) => {
        if (error) {
            return res.json({success: false, error: 'getRefs error on execFile: ' + error});
        }
        console.log('getRefs git clone successful');
        var new_env = process.env;
        new_env.DOXYGEN_FILE = repo_disk_path;
        new_env.DOXYGEN_XML_DIR = 'git_repos/' + timestamp + '_xml/';

        const child = execFile('doxygen', ['Doxyfile'], {env: new_env}, (error, stdout, stderr) => {
            if (error) {
                return res.json({success: false, error: 'parseCode error on execFile: ' + error});
            }
            console.log('getRefs doxygen successful');

            fs.readdir(new_env.DOXYGEN_XML_DIR, (err, files) => {
                console.log(files)
                var target_files = files.filter(file => path.extname(file) == '.xml'
                                            && !(file == 'index.xml'));
                console.log(target_files);
                        // Time to construct the final JSON to return
                var parser = new xml2js.Parser();
                fs.readFile(new_env.DOXYGEN_XML_DIR + 'index.xml', function(err, data) {
                    if (err) {
                        return res.json({success: false, error: 'getRefs error on readFile: ' + err});
                    }
                    parser.parseString(data, function (err, result) {
                        if (err) {
                            return res.json({success: false, error: 'getRefs error on parseString: ' + err});
                        }
                        console.log(result);
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

                        console.log(target_files);

                        func(target_files)
                            .then(res =>  {
                                // console.log('target file called');
                                // console.log(res);
                                res.forEach( function(read_file, file_num) {
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
                                            file = file.substring(file.indexOf('/')+1)
                                            file = file.substring(file.indexOf('/')+1)
                                            found_refs.push({name: name, kind: kind, file: file, location: location})
                                        }
                                    })
                                });
                                console.log('END FOUND_REFS');
                                console.log(found_refs)
                            })
                            .catch(console.log);

                        /* target_files.forEach(function(iter_file, idx) {
                            fs.readFile(new_env.DOXYGEN_XML_DIR + '/' + iter_file,
                                function(err, data) {
                                if (err) {
                                    return res.json({success: false, error: 'getRefs error on readFile: ' + err});
                                }
                                console.log(typeof data);
                                var xmlDoc = default_parser.parseFromString(data.toString(), "text/xml");
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
                                                    console.log('compound - found name')
                                                    name = x[j].childNodes[0].nodeValue;
                                                    console.log(name);
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
                                        found_refs.push({name: name, kind: kind, file: file, location: location})
                                    }
                                });
                                
                            });
                            console.log('found_refs')
                            console.log(found_refs)
                        }); */

                        // return res.json({payload: return_json})
                        
                        // console.log('Done');
                    });
                });

            });
        });
    });
}



parseCode = (file_name, res) => {
    
    if (!file_name.includes('.')) {
         return res.json({success: false, error: 'parseCode error: No file extension'});
    }

    var extension = file_name.slice(file_name.lastIndexOf('.')+1);
    console.log('Parse code got extension: ', extension);
    
    const { exec, execFile } = require('child_process');

    var new_env = process.env;
    new_env.DOXYGEN_FILE = 'doxygen_input/' + file_name;
    var xml_dir = 'doxygen_xml/' + file_name.slice(0, file_name.lastIndexOf('.'));
    new_env.DOXYGEN_XML_DIR = xml_dir;
    const child = execFile('doxygen', ['Doxyfile'], {env: new_env}, (error, stdout, stderr) => {
        if (error) {
            return res.json({success: false, error: 'parseCode error on execFile: ' + error});
        }

        // Time to construct the final JSON to return
        var parser = new xml2js.Parser();
        fs.readFile(xml_dir + '/index.xml', function(err, data) {
            if (err) {
                return res.json({success: false, error: 'parseCode error on readFile: ' + err});
            }
            parser.parseString(data, function (err, result) {
                if (err) {
                    return res.json({success: false, error: 'parseCode error on parseString: ' + err});
                }
                console.log(result);
                var return_json = {namespaces: [], functions: [], members: []};
                var compounds = result['doxygenindex']['compound'];
                compounds.forEach(function (item, index) {
                    if (index == 0) {
                        console.log('COMPOUND');
                        console.log(item);
                    }
                    item_kind = item['$']['kind'];
                    return_json.namespaces.push({name: item['name'], kind: item_kind});

                    var members = item['member'];
                    if (!(typeof members == 'undefined') && !(members == null)) {

                        members.forEach(function (elem, idx) {
                            var member_kind = elem['$']['kind'];
                            if (member_kind == 'function') {
                                return_json.functions.push({name: elem['name'], kind: member_kind});
                            }
                            else {
                                return_json.members.push({name: elem['name'], kind: member_kind});
                            }
                        });
                    }
                    
                });
                return res.json({payload: return_json})
                
                // console.log('Done');
            });
        });

        

    });
    console.log('End of parse code');
}

module.exports = {
    getRefs,
    parseCode
}