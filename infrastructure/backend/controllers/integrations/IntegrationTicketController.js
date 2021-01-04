const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");

var mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const logger = require("../logging/index").logger;

const { checkValid } = require("../../utils/utils");

/*
    githubCardGithubProjectId: { type: ObjectId, ref: 'GithubProject' },
    githubCardId: { type: String },
    githubCardNote: { type: String } --> description: { type: String }
    githubCardColumnId: { type: String },
    githubCardCreatedAt: { type: Date }, --> sourceCreationDate: { type: Date }
    githubCardUpdatedAt: { type: Date },
    githubCardContentUrl: { type: String },
    githubCardPullRequest: { type: ObjectId, ref: 'PullRequest' },
    githubCardIssue: { type: ObjectId, ref: 'GithubIssue' },
*/

createGithubCard = async (req, res) => {
    const {
        repositoryFullName,
        cardId,
        cardNote,
        cardColumnId,
        cardCreatedAt,
        cardUpdatedAt,
        cardContentUrl,
    } = req.body;

    const source = "github";

    if (!checkValid(repositoryFullName))
        return res.json({
            success: false,
            error: "no integrationTicket repositoryFullName provided",
        });
    if (!checkValid(cardId))
        return res.json({
            success: false,
            error: "no integrationTicket cardId provided",
        });
};

retrieveTickets = async (req, res) => {
    const { workspaceId } = req.params;

    let query = IntegrationTicket.find({ workspace: workspaceId });

    const tickets = await query.lean().exec();

    return res.json({ success: true, result: tickets });
};

module.exports = {
    retrieveTickets,
    createGithubCard,
};
