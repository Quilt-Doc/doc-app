
const {serializeError, deserializeError} = require('serialize-error');

const Commit = require('../../models/Commit');

const { spawnSync } = require('child_process');


const fetchAllRepoCommitsCLI = async (installationId, repositoryId, repoDiskPath, worker) => {

    console.log(`fetchAllRepoCommitsCLI - repoDiskPath: ${repoDiskPath}`);
    var gitShowResponse;
    try {
        // var repoDiskPath = 'git_repos/' + timestamp +'/';
        // ../ = git_repos/*
        // ../../ = worker_prod/*
        gitShowResponse = spawnSync('../../test.sh', [], {cwd: repoDiskPath});
    }
    catch(err) {
            await worker.send({action: 'log',
                                info: {level: 'error',
                                        message: serializeError(err),
                                        errorDescription: `Error running 'git show' - repoDiskPath: ${repoDiskPath}`,
                                        source: 'worker-instance',
                                        function: 'fetchAllRepoCommitsCLI'}});

            transactionAborted = true;
            transactionError.message = `Error running 'git show' - repoDiskPath: ${repoDiskPath}`;

            throw new Error(`Error running 'git show' - repoDiskPath: ${repoDiskPath}`);
    }

    var lines = gitShowResponse.stdout.toString().trim().split("\n"); // stdout.split("\n");
    lines = lines.map(e => e.trim());

    console.log(`lines.length: ${lines.length}`);
    // console.log(`lines.slice(0,50): `);
    // console.log(lines.slice(0,50));

    var commitObjects = [];

    var i = 0;

    /*
        END
        65de4b4fcca408398e25447f63ed6bb0db732ad8
        2021-01-01 14:19:23 -0500
        87dda2676ef6786857f0851f9bb5b3bc19fb5fbd
        Karan Godara
        Karan Godara
        kxg3442@rit.edu
        test minor mod
        57f9b1d7dafc701a8798cdc9167b1ccd087a5e55
        HEAD -> code_bulk_scrape

        test.sh
        END
    */
    var currentLine;
    var currentCommitObj = {};
    var currentFileList = [];

    var reachedCommitObjStart = true;

    for( i = 0; i < lines.length; i++) {
        currentLine = lines[i];

        // Skip whitespace
        if (currentLine.length < 1) {
            continue;
        }

        if (currentLine == 'END') {
            reachedCommitObjStart = true;
            if (i == 0) {
                continue;
            }
            currentCommitObj.repository = repositoryId;
            currentCommitObj.installationId = installationId;
            
            currentCommitObj.fileList = currentFileList;
            currentFileList = [];


            commitObjects.push(currentCommitObj);

            currentCommitObj = {};
        }
        else {

            // Scrape body of commit
            // There are 9 lines in the main body
            /*
                # commit hash
                # committer date 
                # tree hash
                # author name
                # committer name
                # committer email
                # ref name given on the command line by which the commit was reached
                # parent hashes
                # ref names without the " (", ")" wrapping.
            */
            if (reachedCommitObjStart) {
                var k = 0;
                while (k < 9) {
                    currentLine = lines[i];
                    switch (k) {
                        case 0:
                            currentCommitObj.sha = currentLine;
                        case 1:
                            currentCommitObj.committerDate = currentLine;
                        case 2:
                            currentCommitObj.treeHash = currentLine;
                        case 3:
                            currentCommitObj.authorName = currentLine;
                        case 4:
                            currentCommitObj.committerName = currentLine;
                        case 5:
                            currentCommitObj.committerEmail = currentLine;
                        case 6:
                            currentCommitObj.commitMessage = currentLine;
                        case 7:
                            break;
                        case 8:
                            reachedCommitObjStart = false;
                            break;
                        default:
                            break;
                    }

                    k++;
                    i++;
                }
            }
            // These are file paths
            else {
                currentFileList.push(currentLine);
            }
        }
    }

    return commitObjects;
}

const insertAllCommitsFromCLI = async (foundCommitsList, installationId, repositoryId, worker) => {
    

    foundCommitsList = foundCommitsList.map(commitObj => {
        return Object.assign({}, commitObj, { sourceId: commitObj.sha, sourceCreationDate: commitObj.committerDate});
    });
    
    var bulkInsertResult;
    try {
        bulkInsertResult = await Commit.insertMany(foundCommitsList);
    }
    catch (err) {

        await worker.send({action: 'log', info: {level: 'error',
                                                    source: 'worker-instance',
                                                    message: serializeError(err),
                                                    errorDescription: `Error bulk inserting Commits - foundCommitsList.length: ${foundCommitsList.length}`,
                                                    function: 'insertAllCommitsFromCLI'}});

        throw new Error(`Error bulk inserting Commits - foundCommitsList.length: ${foundCommitsList.length}`);
    }

    return foundCommitsList;
}


module.exports = {
    fetchAllRepoCommitsCLI,
    insertAllCommitsFromCLI,
}