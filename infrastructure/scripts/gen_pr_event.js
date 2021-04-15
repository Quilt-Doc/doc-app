
const Repository = require('./models/Repository');

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

require("dotenv").config();

const apis = require("./apis/api");

const fs = require('fs');

const password = process.env.EXTERNAL_DB_PASS;
const user = process.env.EXTERNAL_DB_USER;
var dbRoute = `mongodb+srv://${user}:${password}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

mongoose.connect(dbRoute, { useNewUrlParser: true });

// Expected Format:
/*
{
    body: {
        action: "opened",
        installation: {
            id: XXXXXXX,
        },
        repository: {
            full_name: "kgodara-testing/brodal-queue"
        },
        pull_request: {
            id,
            number,

            title,
            body,
            number,

            created_at,
            updated_at,
            closed_at,
    
            html_url,
            issue_url,
            state,
            locked,
            title,
            body,
            labels,
            created_at,
            updated_at,
            closed_at,
            merged_at,
            merge_commit_sha,
    
            head: {
                ref: "XXXX",
                label: "XXXX",
                sha: "XXXXX"
            },

            base: {
                ref: "XXXX",
                label: "XXXX",
                sha: "XXXXX"
            },

            draft,
            merged,
            comments,
            review_comments,
            commits,
            additions,
            deletions,
            changed_files,
        }
    }
}
*/

const getRepositoryObj = async (repositoryId) => {
    var repositoryObj;
    try {
        repositoryObj = await Repository.findById(repositoryId).lean().exec();
    }
    catch (err) {
        console.log(err);
        throw err;
    }
    return repositoryObj;
}

const getPullRequestGithub = async (installationId, repositoryFullName, prNumber) => {

    var installationClient = await apis.requestInstallationClient(installationId);
    

    var prResponse;

    try {
        prResponse = await installationClient.get(`/repos/${repositoryFullName}/pulls/${prNumber}`);
    }
    catch (err) {
        console.log(err);
        throw err;
    }

    prResponse = prResponse.data;

    return prResponse;
}

const createPREvent = async (options) => {
    if (!options.repoId) {
        console.log("createPREvent Error: no repositoryId provided.");
        return;
    }
    if (!options.prNumber) {
        console.log("createPREvent Error: no prNumber provided.");
        return;
    }
    if (!options.jsonOutputPath) {
        console.log("createPREvent Error: no jsonOutputPath provided.");
        return;
    }

    var prEvent = {
        action: "opened",
    }

    var repository = await getRepositoryObj(options.repoId);

    if (repository.public) {
        console.log(`createPREvent Error: Repository ${options.repoId} is a public repository`);
        return;
    }

    prEvent.installation = {
        id: repository.installationId
    };

    prEvent.repository = {
        full_name: repository.fullName
    };

    console.log("prEvent: ");
    console.log(prEvent);

    // Fetch PR Object

    var prObject = await getPullRequestGithub(repository.installationId, repository.fullName, options.prNumber);

    // console.log("PR Object: ");
    // console.log(prObject);

    prEvent.pull_request = {
        id: prObject.id,
        number: prObject.number,

        number: prObject.number,

        created_at: prObject.created_at,
        updated_at: prObject.updated_at,
        closed_at: prObject.closed_at,

        html_url: prObject.html_url,
        issue_url: prObject.issue_url,
        state: prObject.state,
        locked: prObject.locked,
        title: prObject.title,
        body: prObject.body,
        labels: prObject.labels,
        merged_at: prObject.merged_at,
        merge_commit_sha: prObject.merge_commit_sha,

        head: {
            ref: prObject.head.ref,
            label: prObject.head.label,
            sha: prObject.head.sha
        },

        base: {
            ref: prObject.base.ref,
            label: prObject.base.label,
            sha: prObject.base.sha
        },

        draft: prObject.draft,
        merged: prObject.merged,
        comments: prObject.comments,
        review_comments: prObject.review_comments,
        commits: prObject.commits,
        additions: prObject.additions,
        deletions: prObject.deletions,
        changed_files: prObject.changed_files,
    }

    console.log("prEvent: ");
    console.log(prEvent);


    let data = JSON.stringify(prEvent);
    fs.writeFileSync(options.jsonOutputPath, data);

}


const optionDefinitions = [
    { name: "repoId", alias: "r", type: String, defaultOption: false },
    { name: "prNumber", alias: "p", type: Number },
    { name: "jsonOutputPath", alias: "o", type: String }
];

// E.g.:
// node gen_pr_event.js -r 604133292355880fd17ff5b6 -p 1 -o output.json

const commandLineArgs = require("command-line-args");
const options = commandLineArgs(optionDefinitions);

createPREvent(options);