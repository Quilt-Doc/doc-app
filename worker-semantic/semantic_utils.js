// Input: fullName, cloneUrl, semanticTargets, installationId 

const Token = require('../backend/models/Token');


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


// Args append: [ '../' + repoDiskPath ]

const execSemantic = async () =>  {

    var worker = require('cluster').worker;

    worker.send({receipt: process.env.receipt});

    var timestamp = Date.now().toString();
    var repoDiskPath = 'git_repos/' + timestamp +'/';
    const { exec, execFile } = require('child_process');

    var installToken = await getInstallToken(process.env.installationId);


    var cloneUrl = "https://x-access-token:" + installToken.value  + "@" + process.env.cloneUrl.replace("https://", "");

    console.log('CloneUrl: ', cloneUrl);

    const child = execFile('git', ['clone', cloneUrl, repoDiskPath], (error, stdout, stderr) => {
        if (error) {
            console.log('execSemantic error on execFile: ' + error);
            worker.process.kill(worker.process.pid)
            return;
        }

        const command = `cabal`

        let args2 = ["v2-run", "semantic", "parse"];

        var semanticTargets = JSON.parse(process.env.semanticTargets).targets;

        args2.push(...semanticTargets);
        
        args2.push("--")
        args2.push("--json-symbols")
        
        console.log("ARGS2", args2)

        args2 = args2.map(path => '../' + repoDiskPath + path);

        console.log('Args 2: ');
        console.log(args2);



        const getCallbacks = execFile(command, args2,
            {maxBuffer: (1024*1024)*50, cwd: './semantic-master/'}, (error, stdout, stderr) => {
                if (error) {
                    console.log("error during semantic parse:", error)
                    return 
                }
                console.log("STDOUT", stdout)
                let output = JSON.parse(stdout.split("Up to date")[1].trim())
                
                //console.log("OUT BEFORE", output)
                console.log(output)
                output = output.filter(o => o.nodeType === "REFERENCE" && o.syntaxType === "CALL");

                console.log('Final Output: ');
                console.log(output);
                
                //console.log(output)
                const removeContent = execFile("rm", ["-r", repoName],
                    {maxBuffer: (1024*1024)*50, cwd: './semantic/content'}, (error, stdout, stderr) => {
                        if (error) {
                            console.log("error deleting file after usage:", error)
                        }
                    console.log("callback retrieval process successfully completed")
                });
            });

    });
}

module.exports = {
    execSemantic
}