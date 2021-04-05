//lodash
const _ = require("lodash");

//models
const PullRequest = require("../../../models/PullRequest");
const Branch = require("../../../models/Branch");
const Commit = require("../../../models/Commit");
const IntegrationTicket = require("../../../models/integrations/integration_objects/IntegrationTicket");

class AssociationGenerator {
    tickets = [];

    boards = {};

    workspaceId = null;

    codeObjectModelMapping = {
        issue: IntegrationTicket,
        pullRequest: PullRequest,
        commit: Commit,
        branch: Branch,
    };

    constructor(workspaceId, boards) {
        this.boards = _.mapKeys(boards, "_id");

        this.workspaceId = workspaceId;
    }

    acquireIntegrationObjects = async () => {
        let query = IntegrationTicket.find();

        const boardIds = Object.keys(this.boards);

        query.where("board").in(boardIds);

        query.select("board attachments name intervals _id");

        query.populate({ path: "board attachments intervals" });

        const tickets = await query.lean().exec();

        this.tickets = tickets;
    };
}

module.exports = AssociationGenerator;
