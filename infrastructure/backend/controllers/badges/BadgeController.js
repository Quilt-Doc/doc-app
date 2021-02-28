var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const Document = require('../../models/Document');
const Snippet = require('../../models/Snippet');
const Check = require('../../models/Check');

const logger = require('../../logging/index').logger;

const {
    renderError,
    clampValue,
} = require("./common/utils");

const renderStatsCard = require("./cards/stats-card");


const { checkValid } = require('../../utils/utils');



getBadge = async (req, res) => {
    const {
        workspaceId,
        repositoryId
    } = req.query;

    if (!checkValid(workspaceId)) return res.json({success: false, result: "No badge workspaceId provided"});
    if (!checkValid(repositoryId)) return res.json({success: false, result: "No badge repositoryId provided"});

    try {
        var temp = ObjectId(workspaceId);
    }
    catch (err) {
        console.log(err);
        return res.json({success: false, result: "Invalid workspaceId"});
    }

    try {
        var temp = ObjectId(repositoryId);
    }
    catch (err) {
        return res.json({success: false, result: "Invalid repositoryId"});
    }

    var totalDocuments;
    var brokenDocuments;
    try {
        totalDocuments = await Document.count({workspace: ObjectId(workspaceId), root: false});
        brokenDocuments = await Document.count({workspace: ObjectId(workspaceId), status: 'invalid'});
    }
    catch (err) {
        return res.json({success: false, result: "Failed to get Document info"});
    }

    var totalSnippets;
    var brokenSnippets;
    try {
        totalSnippets = await Snippet.count({workspace: ObjectId(workspaceId), repository: ObjectId(repositoryId)});
        brokenSnippets = await Snippet.count({workspace: ObjectId(workspaceId), repository: ObjectId(repositoryId), status: 'INVALID'});
    }
    catch (err) {
        return res.json({success: false, result: "Failed to get Snippet info"});
    }

    var unresolvedChecks;
    // Get all Checks that have either one invalid Document or one invalid Snippet
    try {
        unresolvedChecks = await Check.count({
            "$expr": {
                // "repository": ObjectId(repositoryId)
                "$or": [
                    { "$gte": [{"$size": "$brokenDocuments"}, 1 ]},
                    { "$gte": [{ "$size": "$brokenSnippets" }, 1 ]}
                ]
            },
            "repository": ObjectId(repositoryId),
        }).exec();
    }

    catch (err) {
        console.log(err)
        return res.json({success: false, result: "Failed to get Unresolved Checks"});
    }


    var username = 'anuraghazra';
    var title_color = '34d8eb';
    var icon_color = '34b4eb';
    var text_color = '065c03';
    var bg_color = '020c52';

    res.setHeader("Content-Type", "image/svg+xml");


    var stats = {
        name: "",
        totalDocuments,
        brokenDocuments,
        totalSnippets,
        brokenSnippets,
        unresolvedChecks,
        rank: { level: "C", score: 0 },
    };

    await logger.info({source: "backend-api",
                        message: `Creating Badge - workspaceId, repositoryId, stats: ${workspaceId}, ${repositoryId}, ${JSON.stringify(stats)}`,
                        function: "getBadge"});


    const CONSTANTS = {
        TWO_MINUTES: 120,
        THIRTY_MINUTES: 1800,
        TWO_HOURS: 7200,
        FOUR_HOURS: 14400,
        ONE_DAY: 86400,
    };

    try {

        const cacheSeconds = CONSTANTS.TWO_MINUTES;

        // HelmetJS Caching Headers
        /*
        Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
        Pragma: no-cache
        Expires: 0
        Surrogate-Control: no-store
        */

        res.setHeader("Cache-Control", `public, max-age=${cacheSeconds}`);

        return res.send(
            renderStatsCard(stats, {
                hide: [], 
                show_icons: true,
                hide_title: false,
                hide_border: false,
                hide_rank: true,
                line_height: 25,
                theme: "graywhite",
                custom_title: "Knowledge",
            }),
        );
    }
    catch (err) {
        return res.send(renderError(err.message, err.secondaryMessage));
    }
};


module.exports = {
    getBadge
};