require("dotenv").config();
const {
  renderError,
  parseBoolean,
  parseArray,
  clampValue,
  CONSTANTS,
} = require("../src/common/utils");

const renderStatsCard = require("../src/cards/stats-card");

const mongoose = require('mongoose');

const { ObjectId } = mongoose.Types;

const Document = require('../models/Document');
const Snippet = require('../models/Snippet');
const Check = require('../models/Check');


// This should be an environment variable
const password = process.env.EXTERNAL_DB_PASS
const user = process.env.EXTERNAL_DB_USER;
var dbRoute = `mongodb+srv://${user}:${password}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`

console.log(process.env.USE_EXTERNAL_DB);

if (process.env.USE_EXTERNAL_DB == 0) {
    dbRoute = 'mongodb://127.0.0.1:27017?retryWrites=true&w=majority'
}
console.log(dbRoute);

mongoose.connect(dbRoute, { useNewUrlParser: true });


let db = mongoose.connection;

db.once('open', () => console.log('connected to the database'));
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

checkValid = (item) => {
  if (item !== undefined && item !== null) {
      return true;
  }
  return false;
}

// Stats to Include: 
// Number of Total Documents
// Number of Total Snippets
// Number of Broken Documents
// Number of Broken Snippets
// Number of Unresolved Checks

module.exports = async (req, res) => {
  const {
    workspaceId,
    repositoryId
  } = req.query;

  if (!checkValid(workspaceId)) return res.json({success: false, result: "No workspaceId provided"});
  if (!checkValid(repositoryId)) return res.json({success: false, result: "No repositoryId provided"});

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
    totalDocuments = await Document.count({workspace: ObjectId(workspaceId)});
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
  var testChecks;
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
  
  
  try {

    const cacheSeconds = clampValue(
      parseInt(CONSTANTS.TWO_HOURS, 10),
      CONSTANTS.TWO_HOURS,
      CONSTANTS.ONE_DAY,
    );

    res.setHeader("Cache-Control", `public, max-age=${cacheSeconds}`);


    /*
  const {
    hide = [],
    show_icons = false,
    hide_title = false,
    hide_border = false,
    hide_rank = false,
    include_all_commits = false,
    line_height = 25,
    title_color,
    icon_color,
    text_color,
    bg_color,
    theme = "default",
    custom_title,
  } = options;
    */

    return res.send(
      renderStatsCard(stats, {
        
        // hide: parseArray(hide),
        hide: parseArray('[]'), 
        
        // show_icons: parseBoolean(show_icons),
        show_icons: parseBoolean(true),
        
        // hide_title: parseBoolean(hide_title),
        hide_title: parseBoolean(false),
        
        // hide_border: parseBoolean(hide_border),
        hide_border: parseBoolean(false),
        
        
        // hide_rank: parseBoolean(hide_rank),
        hide_rank: parseBoolean(false),

        line_height: 25,
        title_color,
        icon_color,
        text_color,
        bg_color,
        theme: "graywhite",
        custom_title: "Knowledge",
      }),
    );
  } catch (err) {
    return res.send(renderError(err.message, err.secondaryMessage));
  }
};
