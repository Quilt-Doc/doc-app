//mongoose
const PullRequest = require("../../../models/PullRequest");
const Branch = require("../../../models/Branch");
const Commit = require("../../../models/Commit");
const GithubIssue = require("../../../models/integrations/github/GithubIssue");

const IntegrationTicket = require("../../../models/integrations/integration_objects/IntegrationTicket");

class AssociationGenerator {
    tickets = [];

    boardIds = [];

    workspaceId = null;

    contexts = [];

    coModelMapping = {
        issue: GithubIssue,
        pullRequest: PullRequest,
        commit: Commit,
        branch: Branch,
    };

    constructor(workspaceId, contexts) {
        this.contexts = contexts;

        this.workspaceId = workspaceId;

        this.boardIds = contexts.map((context) => context.board);
    }

    acquireIntegrationObjects = async () => {
        let query = IntegrationTicket.find();

        query.where("board").in(this.boardIds);

        query.select("board attachments name intervals _id");

        query.populate({ path: "board attachments intervals" });

        const tickets = await query.lean().exec();

        this.tickets = tickets;
    };
}

module.exports = AssociationGenerator;
