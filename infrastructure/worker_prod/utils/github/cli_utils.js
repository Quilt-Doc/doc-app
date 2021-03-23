const {serializeError, deserializeError} = require('serialize-error');

const { spawnSync } = require('child_process');

const tokenUtils = require('../token_utils');

const Sentry = require("@sentry/node");


const cloneInstallationRepo = async (installationId, cloneUrlRaw, cloneSingleBranch, defaultBranch, timestamp=Date.now().toString()) => {


    // Clone the Repository
    // var timestamp = Date.now().toString();
    var repoDiskPath = 'git_repos/' + timestamp +'/';

    var installToken;
    try {
        installToken = await tokenUtils.getInstallToken(installationId);
    }
    catch (err) {

        Sentry.setContext("cloneInstallationRepo", {
            message: `Failed to get installToken`,
            installationId: installationId,
        });

        Sentry.captureException(err);
        
        console.log(err);

        throw err;
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
        Sentry.setContext("cloneInstallationRepo", {
            message: `Failed to clone git Repository`,
            cloneUrl: cloneUrl,
            optionsList: JSON.stringify(optionsList),
        });

        Sentry.captureException(err);
        
        console.log(err);

        throw err;
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