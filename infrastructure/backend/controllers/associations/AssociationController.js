const DirectAssociationGenerator = require("./helpers/directAssociationGenerator");
const LikelyAssociationGenerator = require("./helpers/likelyAssociationGenerator");
//code objects

const PullRequest = require("../../models/PullRequest");
const Branch = require("../../models/Branch");
const Commit = require("../../models/Commit");

const { checkValid } = require("../../utils/utils");

var mongoose = require("mongoose");
const BoardWorkspaceContext = require("../../models/integrations/context/BoardWorkspaceContext");
const Association = require("../../models/associations/Association");
const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");
const { ObjectId } = mongoose.Types;

/*
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
};*/

const getFileContext = async (req, res) => {
    const { workspaceId, repositoryId } = req.params;

    const { filePath } = req.body;

    if (!checkValid(workspaceId))
        return res.json({
            success: false,
            error: "no association workspaceId provided",
        });

    if (!checkValid(filePath))
        return res.json({
            success: false,
            error: "no association filePath provided",
        });

    let result = {
        github: {
            //actionType: "POPULATE_GITHUB",
        },
        trello: {
            //actionType: "POPULATE_TRELLO",
        },
    };

    // Fetch PRs
    try {
        let query = PullRequest.find();

        query.where("repository").equals(repositoryId);

        //query.where("fileList").in([filePath]);

        result["github"].pullRequests = await query.limit(20).lean().exec();
    } catch (err) {
        return res.json({
            success: false,
            error: `error finding PullRequests - repositoryId, filePath: ${repositoryId}, ${filePath}`,
            trace: err,
        });
    }

    // Fetch Commits
    try {
        let query = Commit.find();

        query.where("repository").equals(repositoryId);

        //query.where("fileList").in([filePath]);

        result["github"].commits = await query.limit(20).lean().exec();
    } catch (err) {
        return res.json({
            success: false,
            error: `error finding Commits - repositoryId, filePath: ${repositoryId}, ${filePath}`,
            trace: err,
        });
    }

    console.log("RESULT", result);

    let sources;

    try {
        const contexts = await BoardWorkspaceContext.find({
            workspace: workspaceId,
        })
            .select("source")
            .lean()
            .exec();

        console.log("CONTEXTS", contexts);

        sources = Array.from(
            new Set(contexts.map((context) => context.source))
        );
    } catch (e) {
        return res.json({
            success: false,
            error: `error - repositoryId, filePath: ${repositoryId}, ${filePath}`,
            trace: e,
        });
    }

    console.log("HERE");

    let codeObjectIds = [];

    Object.keys(result["github"]).map((modelType) => {
        codeObjectIds = [
            ...codeObjectIds,
            ...result["github"][modelType].map((codeObject) => codeObject._id),
        ];
    });

    console.log("CODE OBJECT IDS", codeObjectIds);

    let associations;

    try {
        let query = Association.find();

        query.where("secondElement").in(codeObjectIds);

        query.where("workspaces").in([workspaceId]);

        query.select("firstElement workspaces");

        associations = await query.lean().exec();
    } catch (e) {
        return res.json({
            success: false,
            error: `error - repositoryId, filePath: ${repositoryId}, ${filePath}`,
            trace: e,
        });
    }

    console.log("ASSOCIATIONS LENGTH", associations.length);

    const ticketIds = Array.from(
        new Set(
            associations.map((association) => {
                console.log("ASSOCIATION", association);

                const { firstElement: ticketId } = association;

                return ticketId;
            })
        )
    );

    let tickets;

    try {
        tickets = await IntegrationTicket.find({ _id: { $in: ticketIds } })
            .lean()
            .exec();
    } catch (e) {
        return res.json({
            success: false,
            error: `error - repositoryId, filePath: ${repositoryId}, ${filePath}`,
            trace: e,
        });
    }

    result["trello"].tickets = tickets;

    console.log("RESULT", result);
    //IntegrationTicket.populate(tickets, {path: "author references workspace repository tags snippets"});

    return res.json({ success: true, result });
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

/*
 let associations;

    try {
        associations = await Promise.all(associationQueries);
    } catch (e) {
        return res.json({
            success: false,
            error: `error - repositoryId, filePath: ${repositoryId}, ${filePath}`,
            trace: e,
        });
    }

    const codeObjModelTypes = new Set("PullRequest", "Commit");

    sources.map((source, i) => {
        const sourceAssociations = associations[i];

        sourceAssociations.map((association) => {
            const { firstElement, firstElementModelType, secondElement, secondElementModelType } = association;

            if (
                firstElement.source === source &&
                !codeObjModelTypes.has(firstElementModelType)
            )
                return firstElement;

            if (
                secondElement.source === source &&
                !codeObjModelTypes.has(secondElementModelType)
            )
                return secondElement;

            return null
        }).filter(element => element != null);
    }
    // Return*/
