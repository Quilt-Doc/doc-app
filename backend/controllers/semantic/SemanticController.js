var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;
const { exec, execFile } = require('child_process');


/*
acquireCallbacks = (req, res) => {
    const { filepath } = req.body;
    
    const args = [
        'clone',
        "https://github.com/cewing/fizzbuzz.git",
    ];

    const getContent = execFile("git", args, 
        {cwd: "./semantic/content"}, (error, stdout, stderr) => {
        if (error) {
            console.log('error during wget call to github: ' + error);
            return;
        } 
        let split = filepath.split("/")
        if (split.slice(-1)[0] === "") {
            split.pop()
        }
        let filename = split.slice(-1)[0]

        let fileLocation = `../content/${filename}`
        const command = `cabal`
        let args2 = ["v2-run", "semantic", "parse", fileLocation, "--", "--json-symbols"]

        const getCallbacks = execFile(command, args2,
            {maxBuffer: (1024*1024)*50, cwd: './semantic/semantic/'}, (error, stdout, stderr) => {
                if (error) {
                    console.log("error during semantic parse:", error)
                    return 
                }
                let output = JSON.parse(stdout.split("Up to date")[1].trim()).files[0].symbols
                console.log(output)
                output = output.filter(o => o.nodeType === "REFERENCE" && o.syntaxType === "CALL")
                
                //console.log(output)
                const removeContent = execFile("rm", [filename],
                    {maxBuffer: (1024*1024)*50, cwd: './semantic/content'}, (error, stdout, stderr) => {
                        if (error) {
                            console.log("error deleting file after usage:", error)
                        }
                    console.log("callback retrieval process successfully completed")
                })

                return res.json(output)
                //console.log(output.files[0].symbols)
                //console.log("PARSED CONTENT", JSON.parse(output))
            }
        )
    })
    
} 
*/

acquireCallbacks = (req, res) => {
    const { filepath } = req.body;
    
    const args = [
        filepath,
        "-P",
        "./semantic/content"
    ];

    const getContent = execFile("wget", args, (error, stdout, stderr) => {
        if (error) {
            console.log('error during wget call to github: ' + error);
            return;
        } 
        let split = filepath.split("/")
        if (split.slice(-1)[0] === "") {
            split.pop()
        }
        let filename = split.slice(-1)[0]

        let fileLocation = `../content/${filename}`
        const command = `cabal`
        let args2 = ["v2-run", "semantic", "parse", fileLocation, "--", "--json-symbols"]

        const getCallbacks = execFile(command, args2,
            {maxBuffer: (1024*1024)*50, cwd: './semantic/semantic/'}, (error, stdout, stderr) => {
                if (error) {
                    console.log("error during semantic parse:", error)
                    return 
                }
                let output = JSON.parse(stdout.split("Up to date")[1].trim()).files[0].symbols
                console.log(output)
                output = output.filter(o => o.nodeType === "REFERENCE" && o.syntaxType === "CALL")
                
                //console.log(output)
                const removeContent = execFile("rm", [filename],
                    {maxBuffer: (1024*1024)*50, cwd: './semantic/content'}, (error, stdout, stderr) => {
                        if (error) {
                            console.log("error deleting file after usage:", error)
                        }
                    console.log("callback retrieval process successfully completed")
                })

                return res.json(output)
                //console.log(output.files[0].symbols)
                //console.log("PARSED CONTENT", JSON.parse(output))
            }
        )
    })
    
}  

module.exports = {
    acquireCallbacks
}

/*

    if (getContent.stderr) {
        console.log("Error during wget call to github " + Error(getContent.stderr))
    }

    
    let split = filepath.split("/")
    if (split.slice(-1)[0] === "") {
        split.pop()
    }
    let filename = split.slice(-1)[0]

    console.log("HERE")
    const getCallbacks = spawnSync(`cd semantic && cd semantic && cabal v2-run semantic parse ../content/${filename} \
    -- --json-symbols`, {shell: true})

    console.log("GET CALLBACKS CALLED")
    if (getCallbacks.stderr) {
        console.log("Error during semantic parsing " + Error(getCallbacks.stderr))
        return
    }

    console.log("GETCALLBACKS STDOUT", getCallbacks.stdout)*/