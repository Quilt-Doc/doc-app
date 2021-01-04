const GithubProject = require("../../models/integrations/github/GithubProject");

var mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const logger = require("../logging/index").logger;

const { checkValid } = require("../../utils/utils");

/*
    repositoryId: { type: ObjectId, ref: 'Repository', required: true },
    projectId: { type: String, required: true },
    number: { type: Number, required: true },

    columns: [{ type: String, required: true }],
    columnIdList: [{type: Number, required: true}],

    name: { type: String, required: true },
    body: { type: String, required: true },
    state:  { type: String, enum: ['open', 'closed', 'all'], required: true},
*/

createGithubProject = async (req, res) => {
    const {
        repositoryFullName,
        projectId,
        projectNumber,
        projectColumnsUrl,
        projectName,
        projectBody,
        projectState,
        installationId,
    } = req.body;

    const source = "github";

    if (!checkValid(repositoryFullName))
        return res.json({
            success: false,
            error: "no integrationBoard repositoryFullName provided",
        });
    if (!checkValid(projectId))
        return res.json({
            success: false,
            error: "no integrationBoard projectId provided",
        });
};
