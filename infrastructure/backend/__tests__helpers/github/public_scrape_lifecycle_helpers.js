// models
const Repository = require("../../models/Repository");

// logger
const { logger } = require("../../fs_logging");

// models
const Commit = require("../../../models/Commit");
const PullRequest = require("../../../models/PullRequest");
const Branch = require("../../../models/Branch");
const IntegrationTicket = require("../../../models/integrations/integration_objects/IntegrationTicket");

const acquireCounts = async (fullName) => {
    const repositories = await Repository.find({
        fullName: fullName,
    });

    const repository = repositories[0];

    const commits = await Commit.find({
        repository: repository._id,
    });

    const pullRequests = await PullRequest.find({
        repository: repository._id,
    });

    const tickets = await IntegrationTicket.find({
        repositoryId: repository._id,
        source: "github",
    });

    const branches = await Branch.find({
        repository: repository._id,
    });

    logger.info(
        `Acquired ${commits.length} commits, ${pullRequests.length} prs, ${branches.length} branches, ${tickets.length} tickets for repository ${fullName}`,
        {
            func: "acquireCounts",
            /*
            obj: {
                repositories,
                commits,
                pullRequests,
                tickets,
                branches,
            },
            */
        }
    );

    return {
        repositories: repositories.length,
        commits: commits.length,
        pullRequests: pullRequests.length,
        tickets: tickets.length,
        branches: branches.length,
    };
};

module.exports = {
    acquireCounts,
};
