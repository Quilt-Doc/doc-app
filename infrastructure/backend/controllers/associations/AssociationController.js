const DirectAssociationGenerator = require("./helpers/directAssociationGenerator");
const LikelyAssociationGenerator = require("./helpers/likelyAssociationGenerator");
//code objects

const PullRequest = require("../../models/PullRequest");
const Branch = require("../../models/Branch");
const Commit = require("../../models/Commit");

const { checkValid } = require("../../utils/utils");

var mongoose = require("mongoose");
const BoardWorkspaceContext = require("../../models/integrations/context/BoardWorkspaceContext");
const { ObjectId } = mongoose.Types;

const getFileContext = async (req, res) => {
    const { workspaceId, filePath } = req.body;

    const repositoryId = req.repositoryObj._id.toString();

    if (!checkValid(workspaceId))
        return res.json({
            success: false,
            error: "no association workspaceId provided",
        });
    // if (!checkValid(repositoryId)) return res.json({success: false, error: 'no association repositoryId provided'});
    if (!checkValid(filePath))
        return res.json({
            success: false,
            error: "no association filePath provided",
        });

    // Fetch PRs
    var relatedPRs;
    try {
        relatedPRs = await PullRequest.find({
            repository: ObjectId(repositoryId),
            fileList: { $in: [filePath] },
        })
            .limit(20)
            .lean()
            .exec();
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `error finding PullRequests - repositoryId, filePath: ${repositoryId}, ${filePath}`,
            function: "getFileContext",
        });

        return res.json({
            success: false,
            error: `error finding PullRequests - repositoryId, filePath: ${repositoryId}, ${filePath}`,
            trace: err,
        });
    }

    // Fetch Commits
    var relatedCommits;
    try {
        relatedCommits = await Commit.find({
            repository: ObjectId(repositoryId),
            fileList: { $in: [filePath] },
        })
            .limit(20)
            .lean()
            .exec();
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `error finding Commits - repositoryId, filePath: ${repositoryId}, ${filePath}`,
            function: "getFileContext",
        });

        return res.json({
            success: false,
            error: `error finding Commits - repositoryId, filePath: ${repositoryId}, ${filePath}`,
            trace: err,
        });
    }

    // Generate list of distinct branch ids from PR
    var distinctBranchIds = [];

    var i = 0;
    for (i = 0; i < relatedPRs.length; i++) {
        var branchIds = relatedPRs[i].branches.map((id) => id.toString());
        distinctBranchIds.push(branchIds);
    }

    distinctBranchIds = distinctBranchIds.flat();
    distinctBranchIds = [...new Set(distinctBranchIds)];

    // Fetch all branch ids
    var relatedBranches;
    try {
        relatedBranches = await Branch.find({
            _id: { $in: distinctBranchIds.map((id) => ObjectId(id)) },
        })
            .limit(20)
            .lean()
            .exec();
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `error finding Branches - distinctBranchIds: ${JSON.stringify(
                distinctBranchIds
            )}`,
            function: "getFileContext",
        });

        return res.json({
            success: false,
            error: `error finding Branches - distinctBranchIds: ${JSON.stringify(
                distinctBranchIds
            )}`,
            trace: err,
        });
    }

    var returnObj = {};

    returnObj.pullRequests = relatedPRs;
    returnObj.commits = relatedCommits;
    returnObj.branches = relatedBranches;

    // Return

    return res.json({ success: true, result: returnObj });
};

generateAssociations = async (req, res) => {
    const { workspaceId } = req.params;

    const { contexts } = req.body;

    const directGenerator = new DirectAssociationGenerator(
        workspaceId,
        contexts
    );

    const contextIds = contexts.map((context) => context._id);

    const newContexts = await BoardWorkspaceContext.updateMany(
        { _id: { $in: contextIds } },
        { $set: { isScraped: true } }
    );

    console.log("NEW CONTEXTS", newContexts);
    /*
    const likelyGenerator = new LikelyAssociationGenerator(
        integrationId,
        integrationType
    );*/

    /*
    await Promise.all([
        // likelyGenerator.generateLikelyAssociations(),
        directGenerator.generateDirectAssociations(),
    ]);*/

    try {
        await directGenerator.generateDirectAssociations();
    } catch (e) {
        console.log("ERROR", e);

        return res.json({ success: false, error: e });
    }

    console.log("FINAL ASSOCIATIONS MADE :O", directGenerator.associations);

    return res.json({
        success: true,
        result: directGenerator.associations,
    });
};

module.exports = {
    generateAssociations,
    getFileContext,
};
