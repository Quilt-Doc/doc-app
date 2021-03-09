const BoardWorkspaceContext = require("../../../models/integrations/context/BoardWorkspaceContext");

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const { checkValid } = require("../../../utils/utils");

retrieveContexts = async (req, res) => {
    console.log("RETRIEVING CONTEXTS");

    const { workspaceId } = req.params;

    if (!checkValid(workspaceId)) {
        throw new Error("WorkspaceId is not provided");
    }

    let contexts;

    try {
        let query = BoardWorkspaceContext.find({ workspace: workspaceId });

        query.where("source").nin(["github"]);

        contexts = await query.populate({ path: "board" }).lean().exec();
    } catch (err) {
        console.log("ERROR: err");
    }

    //console.log("CONTEXTS", contexts);

    return res.json({ success: true, result: contexts });
};

module.exports = {
    retrieveContexts,
};
