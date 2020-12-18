

const apis = require('../apis/api');
const api = apis.requestGithubClient();

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


const Branch = require('../models/Branch');
const Repository = require('../models/Repository');

const logger = require('../logging/index').logger;


checkValid = (item) => {
    if (item !== null && item !== undefined) {
        return true
    }
    return false
}

/*
    {   ref: branchName,
        masterBranch: defaultBranchName,
        installationId: installationId,
        fullName: repositoryFullName
    };
*/

createBranch = async (req, res) => {

    const { ref, masterBranch, installationId, fullName, githubUserId } = req.body;


    if (!checkValid(ref)) return res.json({success: false, error: "createBranch Error: ref not provided"});
    if (!checkValid(masterBranch)) return res.json({success: false, error: "createBranch Error: masterBranch not provided"});
    if (!checkValid(installationId)) return res.json({success: false, error: "createBranch Error: installationId not provided"});
    if (!checkValid(fullName)) return res.json({success: false, error: "createBranch Error: fullName not provided"});
    if (!checkValid(githubUserId)) return res.json({success: false, error: "createBranch Error: githubUserId not provided"});

    // Find matching Repository Model Object

    var branchRepository;
    try {
        branchRepository = await Repository.findOne({fullName: fullName, installationId: installationId}).lean().exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error finding Repository for Branch - fullName, installationId: ${fullName}, ${installationId}`,
                                function: 'createBranch'});
        return res.json({success: false, error: `Error finding Repository for Branch - fullName, installationId: ${fullName}, ${installationId}`, trace: err});
    }


    var branch = new Branch(
        {
            ref: ref,
            masterBranch: masterBranch,
            installationId: installationId,
            repository: ObjectId(branchRepository.toString()),
            githubUserId: githubUserId,
        },
    );

    try {
        branch = await branch.save();
    } catch (err) {
        await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error saving branch - ref, repositoryId: ${ref}, ${branchRepository.toString()}`,
                                function: 'createBranch'});
        return res.json({success: false, error: `Error saving branch - ref, repositoryId: ${ref}, ${branchRepository.toString()}`, trace: err});
    }

    await logger.info({source: 'backend-api',
                        message: `Successfully created branch - ref, repositoryId: ${ref}, ${branchRepository.toString()}`,
                        function: 'createBranch'});

    return res.json({success: true, result: branch});
}



module.exports = {
    createBranch,
}