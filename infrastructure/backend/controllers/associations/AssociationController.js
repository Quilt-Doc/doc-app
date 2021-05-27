//utility
const _ = require("lodash");

//association helpers
const DirectAssociationGenerator = require("./helpers/directAssociationGenerator");

//sentry
const Sentry = require("@sentry/node");

//code objects
const PullRequest = require("../../models/PullRequest");
const Branch = require("../../models/Branch");
const Commit = require("../../models/Commit");

// Workspace
const Workspace = require("../../models/Workspace");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

//utils
const { checkValid } = require("../../utils/utils");

// logger
const { logger } = require("../../fs_logging");

//models
const Association = require("../../models/associations/Association");
const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");

const IntegrationBoard = require("../../models/integrations/integration_objects/IntegrationBoard");

const createGithubIssueBoard = async (req, res) => {
    const { repositoryId, workspaceId } = req.body;

    var createdBoard;
    try {
        createdBoard = await IntegrationBoard.create({
            source: "github",
            repositories: [repositoryId],
        });
    } catch (err) {
        Sentry.captureException(err);
        return res.json({ success: false, error: err, result: null });
    }

    return res.json({ success: true, result: createdBoard._id.toString() });
};

const generateAssociations = async (req, res) => {
    const { workspaceId } = req.params;

    console.log("ENTERED IN GENERATE ASSOCS", workspaceId);
    //console.log("Generating Associations");

    // boards must be provided with unique repositories
    // in format: [ { _id, repositories }]
    const { boards, boardId } = req.body;

    // console.log(`Trying to find IntegrationBoard with boardId: ${boardId}`);
    // console.log(await IntegrationBoard.findById(boardId).lean().exec());

    console.log("BOARDS", boards);

    const directGenerator = new DirectAssociationGenerator(workspaceId, boards);

    try {
        await directGenerator.generateDirectAssociations();
    } catch (e) {
        Sentry.captureException(e);

        return res.json({ success: false, error: e });
    }

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

    return res.json({
        success: true,
        result: directGenerator.associations,
    });
};

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

    logger.info(
        `Entered with workspaceId: ${workspaceId}, repositoryId: ${repositoryId} and filePath: ${filePath}`,
        { func: "getFileContext" }
    );

    if (_.isNil(workspaceId)) {
        return res.json({
            success: false,
            error: "no association workspaceId provided",
        });
    }

    if (_.isNil(filePath)) {
        return res.json({
            success: false,
            error: "no association filePath provided",
        });
    }

    let result = {
        github: {},
        trello: {},
        jira: {},
    };

    let pullRequests = [];

    // Fetch PRs
    try {
        pullRequests = await PullRequest.find({
            repository: repositoryId,
            fileList: { $in: [filePath] },
        })
            .populate("repository")
            .limit(20)
            .lean()
            .exec();

        result["github"].pullRequests = pullRequests;
    } catch (e) {
        logger.error("Failure during pull request query", {
            func: "getFileContext",
            e,
        });

        return res.json({
            success: false,
            error: `error finding PullRequests - repositoryId, filePath: ${repositoryId}, ${filePath}`,
            trace: exports,
        });
    }

    let commits = [];

    // Fetch Commits
    try {
        commits = await Commit.find({
            repository: repositoryId,
            fileList: { $in: [filePath] },
        })
            .populate("repository")
            .limit(20)
            .lean()
            .exec();

        result["github"].commits = commits;
    } catch (e) {
        logger.error("Failure during commit query", {
            func: "getFileContext",
            e,
        });

        return res.json({
            success: false,
            error: `error finding Commits - repositoryId, filePath: ${repositoryId}, ${filePath}`,
            trace: e,
        });
    }

    // Get all Code Object Ids
    let codeObjectIds = [
        ...commits.map((commit) => commit._id),
        ...pullRequests.map((pr) => pr._),
    ];

    logger.info(`${codeObjectIds.length} code objects found`, {
        obj: codeObjectIds,
        func: "getFileContext",
    });

    // Get all Associations of Code Objects
    let associations;

    try {
        associations = await Association.find({
            secondElement: { $in: codeObjectIds },
        })
            .select("firstElement workspaces")
            .lean()
            .exec();
    } catch (e) {
        logger.error("Failure during association query", {
            func: "getFileContext",
            e,
        });

        return res.json({
            success: false,
            error: `error - repositoryId, filePath: ${repositoryId}, ${filePath}`,
            trace: e,
        });
    }

    logger.info(`${associations.length} total associations were found.`, {
        obj: associations,
        func: "getFileContext",
    });

    const ticketIds = Array.from(
        new Set(
            associations.map((association) => {
                const { firstElement: ticketId } = association;

                return ticketId;
            })
        )
    );

    const ticketSources = ["trello", "github", "jira"];

    let ticketsBySource;

    try {
        ticketsBySource = await Promise.all(
            ticketSources.map((source) => {
                return IntegrationTicket.find({
                    _id: { $in: ticketIds },
                    source,
                })
                    .lean()
                    .exec();
            })
        );
    } catch (e) {
        logger.error("Failure during ticket query", {
            func: "getFileContext",
            e,
        });

        Sentry.captureException(e);

        return res.json({
            success: false,
            error: `error - repositoryId, filePath: ${repositoryId}, ${filePath}`,
            trace: e,
        });
    }

    ticketsBySource.map((tickets, i) => {
        result[ticketSources[i]].tickets = tickets;
    });

    logger.info("Successfully returning context", {
        obj: result,
        func: "getFileContext",
    });

    //IntegrationTicket.populate(tickets, {path: "author references workspace repository tags snippets"});

    return res.json({ success: true, result });
};

module.exports = {
    generateAssociations,
    getFileContext,
    createGithubIssueBoard,
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
