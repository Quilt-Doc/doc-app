const {serializeError, deserializeError} = require('serialize-error');

const { spawnSync } = require('child_process');

const tokenUtils = require('../token_utils');


const cloneInstallationRepo = async (installationId, cloneUrlRaw, cloneSingleBranch, defaultBranch, worker) => {


    // Clone the Repository
    var timestamp = Date.now().toString();
    var repoDiskPath = 'git_repos/' + timestamp +'/';

    var installToken;
    try {
        installToken = await tokenUtils.getInstallToken(installationId, worker);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    message: serializeError(err),
                                                    errorDescription: `Error fetching Install Token for installationId: ${process.env.installationId}`,
                                                    source: 'worker-instance',
                                                    function: 'cloneInstallationRepo'}});

        throw new Error(`Error fetching Install Token for installationId: ${process.env.installationId}`);
    }




    var cloneUrl = "https://x-access-token:" + installToken.value  + "@" + cloneUrlRaw.replace("https://", "");


    var optionsList = [];

    optionsList.push('clone');

    if (cloneSingleBranch) {
        optionsList.push('-b');
        optionsList.push(defaultBranch);
        optionsList.push('--single-branch');
    }

    optionsList.push(cloneUrl);
    optionsList.push(repoDiskPath);

    console.log(`cloneUrlRaw: ${cloneUrlRaw}`);
    console.log(`cloneUrl: ${cloneUrl}`);
    console.log(`repoDiskPath: ${repoDiskPath}`);
    console.log(`optionsList: ${JSON.stringify(optionsList)}`);


    try {
        // Format to only clone one specific branch
        // git clone -b opencv-2.4 --single-branch https://github.com/Itseez/opencv.git
        const gitClone = spawnSync('git', optionsList);
    }
    catch(err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    message: serializeError(err),
                                                    errorDescription: `Error Cloning Git Repository - installToken, cloneUrl, cloneSingleBranch, defaultBranch, repoDiskPath: ${installToken}, ${cloneUrl}, ${cloneSingleBranch}, ${defaultBranch}, ${repoDiskPath}`,
                                                    source: 'worker-instance',
                                                    function: `cloneInstallationRepo`}});

        throw new Error(`Error Cloning Git Repository - installToken, cloneUrl, cloneSingleBranch, defaultBranch, repoDiskPath: ${installToken}, ${cloneUrl}, ${cloneSingleBranch}, ${defaultBranch}, ${repoDiskPath}`);
    }

    return repoDiskPath;
}


const ensureRepoCloneCommit = async (repoDiskPath, headCommit, worker) => {
    // Make sure repository is at correct commit
    try {
        const ensureCommit = spawnSync('git', ['reset', '--hard', `${headCommit}`], {cwd: repoDiskPath});
    }
    catch(err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    message: serializeError(err),
                                                    errorDescription: `Error hard running 'git reset --hard' - headCommit, repoDiskPath: ${headCommit}, ${repoDiskPath}`,
                                                    source: 'worker-instance',
                                                    function: 'ensureRepoCloneCommit'}});

        throw new Error(`Error hard running 'git reset --hard' - headCommit, repoDiskPath: ${headCommit}, ${repoDiskPath}`);
    }

    // Verify that we have successfully set the Repository to the correct commit
    var getCurrentCommitResponse;
    try {
        getCurrentCommitResponse = spawnSync('git', ['log', '-1', '--pretty=%H'], {cwd: './' + repoDiskPath});
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    message: serializeError(err),
                                                    errorDescription: `Error running 'git log -1' - repoDiskPath: ${repoDiskPath}`,
                                                    source: 'worker-instance',
                                                    function: 'ensureRepoCloneCommit'}});

        throw new Error(`Error running 'git log -1' - repoDiskPath: ${repoDiskPath}`);
    }

    var currentCommitSha = getCurrentCommitResponse.stdout.toString().trim();

    if (currentCommitSha != headCommit) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    message: serializeError(err),
                                                    errorDescription: `Error cloned repository commit doesn't match headCommit - headCommit, currentCommitSha, repoDiskPath: ${headCommit}, ${currentCommitSha}, ${repoDiskPath}`,
                                                    source: 'worker-instance',
                                                    function: 'ensureRepoCloneCommit'}});

        throw new Error(`Error cloned repository commit doesn't match headCommit - headCommit, currentCommitSha, repoDiskPath: ${headCommit}, ${currentCommitSha}, ${repoDiskPath}`);
    }
}


module.exports = {
    cloneInstallationRepo,
    ensureRepoCloneCommit,
}