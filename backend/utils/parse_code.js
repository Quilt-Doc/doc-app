var fs = require('fs'),
    xml2js = require('xml2js');

const COMPOUND_KINDS = ["class", "struct", "union", "interface", "protocol", "category",
"exception", "file", "namespace", "group", "page", "example", "dir", "type"];

const MEMBER_KINDS = ['define', 'property', 'event', 'variable', 'typedef', 'enum',
'enumvalue', 'function', 'signal', 'prototype', 'friend', 'dcop', 'slot'];


getRefs = (repo_link, res) => {

    var timestamp = Date.now().toString();    
    var repo_disk_path = 'git_repos/' + timestamp +'/';

    const child = execFile('git', ['clone', repo_link, repo_disk_path], (error, stdout, stderr) => {
        if (error) {
            return res.json({success: false, error: 'getRefs error on execFile: ' + error});
        }
        var new_env = process.env;
        new_env.DOXYGEN_FILE = repo_disk_path;
        var xml_dir = 'doxygen_xml/' + file_name.slice(0, file_name.lastIndexOf('.'));
        new_env.DOXYGEN_XML_DIR = 'git_repos/' + timestamp + '_xml/';

        const child = execFile('doxygen', ['Doxyfile'], {env: new_env}, (error, stdout, stderr) => {
            if (error) {
                return res.json({success: false, error: 'parseCode error on execFile: ' + error});
            }
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