//mongoose
const PullRequest = require("../../../models/PullRequest");
const Branch = require("../../../models/Branch");
const Commit = require("../../../models/Commit");
const GithubIssue = require("../../../models/integrations/github/GithubIssue");

//integrations
const TrelloIntegration = require("../../../models/integrations/trello/TrelloIntegration");

class AssociationGenerator {
    tickets = [];

    integration = null;

    acceptedTypes = {
        trello: {
            integrationModel: TrelloIntegration,
            integrationField: "trelloIntegration",
        },
    };

    coModelMapping = {
        issue: GithubIssue,
        pullRequest: PullRequest,
        commit: Commit,
        branch: Branch,
    };

    constructor(integrationId, integrationType) {
        if (!(integrationType in this.acceptedTypes)) {
            throw new Error("Not Correct IntegrationType");
        }

        this.integrationId = integrationId;

        this.integrationType = integrationType;
    }

    acquireIntegrationObjects = async () => {
        const { integrationModel, integrationField } = this.acceptedTypes[
            integrationType
        ];

        // use the integrationModel and integrationField to find tickets (with only
        // attachment and _id information ) of
        // the new integration
        const integration = await integrationModel
            .find({ _id: integrationId })
            .lean()
            .exec();

        let query = IntegrationTicket.find({
            [integrationField]: integration._id,
        })
            .lean()
            .exec();

        query.select("attachments intervals _id");

        query.populate({ path: "attachments intervals" });

        const tickets = await query.lean().exec();

        this.tickets = tickets;

        this.integration = integration;
    };
}

module.exports = AssociationGenerator;
