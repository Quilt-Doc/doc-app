// Input: fullName, cloneUrl, semanticTargets, installationId 

const tokenUtils = require('./utils/token_utils');

const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

const fs = require ('fs');

const api = require('./apis/api').requestBackendClient();
const spawn = require('await-spawn')
const Reference = require('./models/Reference');
const Repository = require('./models/Repository');

const jobs = require('./apis/jobs');


const JOB_GET_REFS = 1;
const JOB_UPDATE_SNIPPETS = 2;
const JOB_SEMANTIC = 3;

const getInstallToken = async (installationId) => {
    return await Token.findOne({ installationId })
    .then( token => {
        return token;
    })
    .catch(err => {
        console.log('Error fetching installation access token');
        console.log(err);
        return {};
    });
}

const getRepositoryObject = async () => {

    console.log('getRepositoryObject installationId: ', process.env.installationId);
    console.log('getRepositoryObject fullName: ', process.env.fullName);
    const getRepositoryResponse = await api.post('/repositories/retrieve', {
      installationId: process.env.installationId,
      fullName: process.env.fullName
    });
    console.log('getRepositoryResponse: ');
    console.log(getRepositoryResponse.data);
    var repoId = getRepositoryResponse.data[0]._id;
    var cloneUrl = getRepositoryResponse.data[0].cloneUrl;
    return [repoId, cloneUrl];
    // var repoCommit = getRepositoryResponse.data.last_processed_commit;
    // return [repoId, repoCommit];
};

const updateJobStatus = async (status) => {

    return await Repository.updateOne({installationId: process.env.installationId, fullName: process.env.fullName}, {$set: {semanticJobStatus: status}});

}

const escapeShell = (cmd) => {
        return '"'+cmd.replace('"', '\\"')+'"';//.replace(/(["\s'$`\\])/g,'\\$1')+'"';
}

// Args append: [ '../' + repoDiskPath ]

const execSemantic = async () =>  {

    var worker = require('cluster').worker;

    worker.send({receipt: process.env.receipt});

    var repoInfo = await getRepositoryObject();
    var repoId = repoInfo[0];
    var cloneUrl = repoInfo[1];

    var timestamp = Date.now().toString();
    var repoDiskPath = 'git_repos/' + timestamp +'/';
    const { exec, execFile, execFileSync, spawnSync, spawn} = require('child_process');

    var installToken = await tokenUtils.getInstallToken(process.env.installationId);

    var cloneUrl = "https://x-access-token:" + installToken.value  + "@" + process.env.cloneUrl.replace("https://", "");

    console.log('CloneUrl: ', cloneUrl);

    const child = execFile('git', ['clone', cloneUrl, repoDiskPath], async (error, stdout, stderr) => {
        if (error) {
            console.log('execSemantic error on execFile: ' + error);
            worker.process.kill(worker.process.pid)
            return;
        }

        const command = `cabal`

        let args2 = ["v2-run", "semantic", "parse"];

        var semanticTargets = JSON.parse(process.env.semanticTargets).targets;

        args2.push(...semanticTargets);


        args2 = args2.map((path, idx) => {
	        if (idx < 3) {
                return path
	        }
	        return escapeShell('../doc-app/worker/' + repoDiskPath + path);
	    });

	args2.push("--")
        args2.push("--json-symbols")
	// args2.push(">");
	// args2.push("../doc-app/worker/" + repoDiskPath + "raw_output.txt");

        console.log('Args 2: ');
        console.log(args2.filter(arg => arg.indexOf('Bucket') > 0));
	
	var parsedFiles = [];
	var unparsedFiles = [];
	
	const fd = fs.openSync(repoDiskPath + "raw_output.txt", 'w');

	const writeStream = fs.createWriteStream(/*"../doc-app/worker/" + */repoDiskPath + "raw_output.txt");
	const child =  spawn(command, args2, {cwd: '../../semantic-master/', maxBuffer: (1024 * 1024 * 50), shell: true});
	child.stdout.on('data', function (data) {
 	   // console.log('stdout: ' + data);
	    writeStream.write(data);
	});
	child.stderr.on('data', function(data) {
	   console.log('stderr: ', data.toString());
	});
	// child.stdout.pipe(writeStream);
	
	console.log('Just ran semantic');
	child.on('exit', async (code) => {
	
	// console.log(child.stdout.toString());
	var stdout = fs.readFileSync(repoDiskPath + "raw_output.txt").toString();
	
	console.log('Split array length');
	console.log(stdout.split("\n").length);	
	var toFile = {splitArray: stdout.split("\n")};
	var toFileResult = fs.writeFileSync('log.txt', JSON.stringify(toFile));
                let output = JSON.parse(stdout.split("\n")[1].trim())
                
                //console.log("OUT BEFORE", output)
                // console.log(output)
               
		var fileSymbols = output.files;
		var finalReferenceList = [];

                var i;
                for (i = 0; i < fileSymbols.length; i++) {

                    var currentFile = fileSymbols[i];
                    
                    var currentFilePath = currentFile.path.substr(currentFile.path.indexOf(timestamp)+timestamp.length+1);
                    console.log('currentFilePath: ');
                    console.log(currentFilePath);
		    
                    // If this file could be parsed
                    if (currentFile.hasOwnProperty('symbols')) {
                        parsedFiles.push(currentFilePath);
                        var symbolList = currentFile.symbols;
			console.log('symbolList: ');
			// console.log(symbolList);*

                        var definitionList = symbolList.filter(symbol => symbol.nodeType == "DEFINITION");
                        var callbackList = symbolList.filter(symbol => symbol.nodeType == "REFERENCE" && symbol.syntaxType == "CALL");
			console.log('definitionList, callbackList: ');
			// console.log(definitionList);
			// console.log(callbackList);
                        /*
			kind: String,
                        path: String,
                        lineNum: Number,
                        repository: {type: ObjectId, ref: 'Repository'},
                        created: {type: Date, default: Date.now }
			*/

                        var referenceObjList = definitionList.concat(callbackList);
                        referenceObjList = referenceObjList.map((symbolObj, idx) => {
                            var referenceObj = {};
                            if (symbolObj.docs) {
                                if (symbolObj.docs.docstring) {
                                    referenceObj.description = symbolObj.docs.docstring;
                                }
                            }
                            referenceObj.name = symbolObj.symbol;
                            referenceObj.kind = symbolObj.kind;
                            referenceObj.position = JSON.stringify(symbolObj.span);
                            referenceObj.parseProvider = 'semantic';
                            return referenceObj;
                        });
			finalReferenceList = finalReferenceList.concat(referenceObjList);


                    }

                    else {
                        unparsedFiles.push(currentFilePath);
                    }
                }


                console.log('parsedFiles: ');
                console.log(parsedFiles);

                console.log('unparsedFiles: ');
                console.log(unparsedFiles);

                console.log('finalReferenceList.length: ');
                console.log(finalReferenceList.length);

		console.log('repoId: ', repoId);

		// update tree references with the files semantic has parsed
                const bulkOps = parsedFiles.map(filePath => ({
                    updateOne: {
                        filter: { repository: ObjectId(repoId), kind: 'file', path: filePath },
                        // Where field is the field you want to update
                        update: { $set: { parseProvider: 'semantic' } },
                        upsert: false
                        }
                    }));
                    // where Model is the name of your model
                if (bulkOps.length > 0) {
                    console.log('Semantic: Bulk updating parsed files');
                    Reference.collection
                        .bulkWrite(bulkOps)
                        .then(results => console.log(results))
                        .catch(err => {
                            console.log('Error refreshing tokens: ', err);
                            console.log({success: false, error: err});
                        });
                }
                
                if (finalReferenceList.length > 0) {
                    const insertedIds = await Reference.insertMany(finalReferenceList);

                    console.log('inserted Ids: ');
                    console.log(insertedIds);
                                    /*.select('kind name')
                                    .exec(function(err, refList) {
                                        console.log('Semantic successfully inserted found references');
                                        console.log('insertMany refList[0]: ');
                                        console.log(refList[0]);

                                        var finalDefinitionList = refList.filter(referenceObj => referenceObj.kind != 'Call');
                                        var finalCallList = refList.filter(referenceObj => referenceObj.kind == 'Call');
                                        // Set up initial reference links 
                                        finalCallList = finalCallList.map(callObj => {
                                                callObj.definitionReferences = [];
                                        });

                                        var finalLinkedCallsList = [];
                        
                                        for(i = 0; i < finalDefinitionList.length; i++) {
                                            var currentDefObj = finalDefinitionList[i];
                                            var relatedCalls = finalCallList.filter(callObj => callObj.name == currentDefObj.name);
                                            relatedCalls = relatedCalls.map(callObj => {
                                                callObj.definitionReferences.push(currentDefObj._id.toString());
                                                return callObj;
                                            });
                                            finalLinkedCallsList = finalLinkedCallsList.concat(relatedCalls);
                                        }
                                        const bulkLinkOps = finalLinkedCallsList.map( linkedCall => ({
                                            updateOne: {
                                                filter: { _id: ObjectId(linkedCall._id)},
                                                // Where field is the field you want to update
                                                update: { $set: { definitionReferences: linkedCall.definitionReferences } },
                                                // don't create a new obj if ours doesn't exist
                                                upsert: false
                                                }
                                            })
                                        );
                                        Reference.collection
                                            .bulkWrite(bulkLinkOps)
                                            .then(results => console.log(results))
                                            .catch(err => {
                                                console.log('Error refreshing tokens: ', err);
                                                console.log({success: false, error: err});
                                            });
                                    });*/
                }

                else {
                    console.log('Semantic: Not inserting any new references');
                }
		        // insert new references
                /*Reference.insertMany(finalReferenceList, (errInsertItems, semanticReferences) => {
                    if (errInsertItems) {
			            console.log('Error inserting references:');
			            console.log(errInsertItems);
			            return;
                    }
                    
                    Reference.
			        console.log('Semantic successfully inserted found references');
                	return
                });*/


        

                //DOXYGEN
                // SQS Message Section Start
                var runDoxygenData = {
                    'installationId': process.env.installationId.toString(),
                    'cloneUrl': process.env.cloneUrl,
		    'repositoryId': repoId,
                    'jobType': JOB_GET_REFS.toString()
                }

                console.log('RUN DOXYGEN DATA: ');
                console.log(runDoxygenData);

                jobs.dispatchDoxygenJob(runDoxygenData);

                updateJobStatus('FINISHED');
                
                //console.log(output)
                /*const removeContent = execFile("rm", ["-r", repoName],
                    {maxBuffer: (1024*1024)*50, cwd: './semantic/content'}, (error, stdout, stderr) => {
                        if (error) {
                            console.log("error deleting file after usage:", error)
                        }
                    console.log("callback retrieval process successfully completed")
                });*/
	});

    });
}

module.exports = {
    execSemantic
}
