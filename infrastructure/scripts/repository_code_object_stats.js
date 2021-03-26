
const Repository = require('./models/Repository');

const Commit = require('./models/Commit');
const Branch = require('./models/Branch');
const PullRequest = require('./models/PullRequest');

const InsertHunk = require('./models/InsertHunk');

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

require("dotenv").config();

const password = process.env.EXTERNAL_DB_PASS;
const user = process.env.EXTERNAL_DB_USER;
var dbRoute = `mongodb+srv://${user}:${password}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

mongoose.connect(dbRoute, { useNewUrlParser: true });

const fetchRepositoryStats = async (repositoryId) => {

    var commitNum = await Commit.countDocuments({ repository: repositoryId });
    console.log(`Commits: ${commitNum}`);

    var branchNum = await Branch.countDocuments({ repository: repositoryId });
    console.log(`Branches: ${branchNum}`);

    var prNum = await PullRequest.countDocuments({ repository: repositoryId });
    console.log(`PullRequests: ${prNum}`);

    var insertHunkNum = await InsertHunk.countDocuments({ repository: repositoryId });
    console.log(`InsertHunks: ${insertHunkNum}`);

}

const optionDefinitions = [
    { name: "repositoryId", alias: "r", type: String, },
];

const commandLineArgs = require("command-line-args");
const options = commandLineArgs(optionDefinitions);

if (options.repositoryId) {
    fetchRepositoryStats(options.repositoryId);
}

else {
    console.log("repositoryId not provided, exiting");
}