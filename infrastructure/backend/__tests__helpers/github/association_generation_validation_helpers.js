require("dotenv").config();

// models
const IntegrationTicket = require("../../../models/integrations/integration_objects/IntegrationTicket");
const Association = require("../../../models/associations/Association");
const PullRequest = require("../../../models/PullRequest");
const Commit = require("../../../models/Commit");
const Branch = require("../../../models/Branch");

// util helpers
const { logger } = require("../../fs_logging");

const validateTicketBoards = async (isPublic = false) => {
    const repositories = JSON.parse(process.env.TEST_REPOSITORIES);

    const repoTickets = await Promise.all(
        repositories.map((repo) =>
            IntegrationTicket.find({
                repository: repo._id,
            }).populate("attachments")
        )
    );

    repoTickets.map((tickets, i) => {
        const { fullName } = repositories[i];

        let boardId;

        tickets.map((ticket) => {
            const { board: ticketBoardId } = ticket;

            expect(ticketBoardId).toBeDefined();

            expect(ticketBoardId).not.toBeNull();

            if (!boardId) {
                boardId = ticketBoardId.toString();
            } else {
                expect(boardId).toEqual(ticketBoardId.toString());
            }
        });

        if (isPublic) {
            let currentResults = JSON.parse(process.env.CURRENT_RESULTS);

            let testResults = JSON.parse(process.env.TEST_RESULTS);

            testResults[fullName]["validateTicketBoards"] = currentResults[fullName][
                "validateTicketBoards"
            ] = true;

            process.env.CURRENT_RESULTS = JSON.stringify(currentResults);

            process.env.TEST_RESULTS = JSON.stringify(testResults);
        }
    });

    process.env.TEST_REPO_TICKETS = JSON.stringify(repoTickets);
};

const validateIntegrationAttachments = async (isPublic = false) => {
    const repositories = JSON.parse(process.env.TEST_REPOSITORIES);

    const repoTickets = JSON.parse(process.env.TEST_REPO_TICKETS);

    const acceptedModels = new Set(["branch", "issue", "pullRequest", "commit"]);

    repoTickets.map((tickets, i) => {
        const { fullName } = repositories[i];

        tickets.map((ticket) => {
            const { attachments } = ticket;

            attachments.map((attachment) => {
                const { modelType, sourceId, repository } = attachment;

                expect(modelType).toBeDefined();

                expect(modelType).not.toBeNull();

                expect(sourceId).not.toBeNull();

                expect(repository).toBeDefined();

                expect(repository).not.toBeNull();

                expect(acceptedModels.has(modelType)).toEqual(true);
            });
        });

        if (isPublic) {
            let currentResults = JSON.parse(process.env.CURRENT_RESULTS);

            let testResults = JSON.parse(process.env.TEST_RESULTS);

            testResults[fullName]["validateAttachments"] = currentResults[fullName][
                "validateAttachments"
            ] = true;

            process.env.CURRENT_RESULTS = JSON.stringify(currentResults);

            process.env.TEST_RESULTS = JSON.stringify(testResults);
        }
    });
};

const validateAssociations = async (isPublic = false) => {
    const repoTickets = JSON.parse(process.env.TEST_REPO_TICKETS);

    const repositories = JSON.parse(process.env.TEST_REPOSITORIES);

    const repoAssociations = await Promise.all(
        repositories.map((repo) =>
            Association.find({
                repository: repo._id,
            })
        )
    );

    logger.info(`${repoAssociations.length} associations were found.`, {
        obj: repoAssociations,
        func: "validateAssociations",
    });

    let modelTypeMap = {
        pullRequest: PullRequest,
        commit: Commit,
        issue: IntegrationTicket,
        branch: Branch,
    };

    for (let i = 0; i < repoTickets.length; i++) {
        const { fullName } = repositories[i];

        let tickets = repoTickets[i];

        let associations = repoAssociations[i];

        let total = 0;

        for (let j = 0; j < tickets.length; j++) {
            const ticket = tickets[j];

            let seen = new Set();

            let { attachments } = ticket;

            attachments = attachments.filter((item) => {
                const { modelType, sourceId, repository } = item;

                const key = `${modelType}-${sourceId}-${repository.toString()}`;

                if (seen.has(key)) {
                    return false;
                } else {
                    seen.add(key);

                    return true;
                }
            });

            for (let k = 0; k < attachments.length; k++) {
                const { modelType, sourceId, repository } = attachments[k];

                const codeObject = await modelTypeMap[modelType].findOne({
                    sourceId,
                    repository,
                });

                const association = await Association.findOne({
                    repository,
                    firstElement: ticket._id,
                    secondElement: codeObject._id,
                });

                expect(association).toBeDefined();

                expect(association).not.toBeNull();
            }

            total += attachments.length;
        }

        if (isPublic) {
            let currentResults = JSON.parse(process.env.CURRENT_RESULTS);

            let testResults = JSON.parse(process.env.TEST_RESULTS);

            testResults[fullName]["validateAssociationsContent"] = currentResults[
                fullName
            ]["validateAssociationsContent"] = true;

            process.env.CURRENT_RESULTS = JSON.stringify(currentResults);

            process.env.TEST_RESULTS = JSON.stringify(testResults);
        }

        expect(total).toEqual(associations.length);

        if (isPublic) {
            let currentResults = JSON.parse(process.env.CURRENT_RESULTS);

            let testResults = JSON.parse(process.env.TEST_RESULTS);

            testResults[fullName]["validateAssociationsLength"] = currentResults[
                fullName
            ]["validateAssociationsLength"] = true;

            process.env.CURRENT_RESULTS = JSON.stringify(currentResults);

            process.env.TEST_RESULTS = JSON.stringify(testResults);
        }
    }
};

module.exports = {
    validateTicketBoards,
    validateIntegrationAttachments,
    validateAssociations,
};
