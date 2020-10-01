

const apis = require('../apis/api');
const api = apis.requestGithubClient();

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


const Document = require('../models/Document');
const Snippet = require('../models/Snippet');
const Check = require('../models/Check');



const logger = require('../logging/index').logger;

const DOCUMENT_MAX = 10;
const SNIPPET_MAX = 5;

const SNIPPET_CHAR_MAX = 20;



checkValid = (item) => {
    if (item !== null && item !== undefined) {
        return true
    }
    return false
}

generateCheckSummary = (brokenDocuments, brokenSnippets) => {
    if (brokenDocuments.length == 0 && brokenSnippets.length == 0) {
        return 'This push broke no documentation!';
    }
    else if (brokenDocuments.length > 0 && brokenSnippets.length == 0) {
        return `This push broke ${brokenDocuments.length} documents`;
    }
    else if (brokenDocuments.length == 0 && brokenSnippets.length > 0) {
        return `This push broke ${brokenSnippets.length} snippets`;
    }
    else if (brokenDocuments.length > 0 && brokenSnippets.length > 0) {
        return `This push broke ${brokenDocuments.length} documents and ${brokenSnippets.length} snippets`;
    }
}

generateCheckText = async (brokenDocuments, brokenSnippets) => {
    var text = '';


    // Append broken Document text
    for (i = 0; i < brokenDocuments.length; i++) {
        if (i >= DOCUMENT_MAX) break;
        var documentObj;
        try {
            documentObj = await Document.findById(brokenDocuments[i].toString(), 'title').exec();
        }
        catch (err) {
            throw new Error(`Error fetching Document: ${brokenDocuments[i]}`);
        }
        if (documentObj) text += `${documentObj.title}\n`
    }

    // Append broken Snippet text
    for (i = 0; i < brokenSnippets.length; i++) {
        if (i >= SNIPPET_MAX) break;
        var snippetObj;
        try {
            snippetObj = await Snippet.findById(brokenSnippets[i]);
        }
        catch (err) {
            throw new Error(`Error fetching Snippet: ${brokenSnippets[i]}`);
        }
        if (snippetObj) text += `${snippetObj.annotation.slice(0, SNIPPET_CHAR_MAX)}\n`
    }

    return text;

}

createCheckRunObj = async (commit, brokenDocuments, brokenSnippets, checkId) => {

    var imageObj = {    alt: 'Test alt text',
                        image_url: "https://upload.wikimedia.org/wikipedia/en/thumb/b/ba/Red_x.svg/1200px-Red_x.svg.png",
                        caption: 'Test image',
                    }
    

    var outputObj;
    try {
        outputObj = {   title: 'Quilt Docs Documentation Changes',
                    summary: generateCheckSummary(brokenDocuments, brokenSnippets),
                    text: await generateCheckText(brokenDocuments, brokenSnippets),
                    // images: [imageObj]
                }
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err, errorDescription: `Error generating check text on commit: ${commit}`, function: "generateCheckText"});
        return res.json({success: false, error: 'error Generating Check'});
    }
    var currentDateISO = (new Date()).toISOString();

    var checkObj = {
        name: 'document-coverage',
        head_sha: commit,
        details_url: 'https://www.google.com',
        external_id: checkId,
        status: 'completed',
        started_at: currentDateISO,
        conclusion: (brokenDocuments.length > 0 || brokenSnippets.length > 0) ? 'failure' : 'success',
        completed_at: currentDateISO,
        output: outputObj,
    };

    return checkObj

}



const createCheck = async (req, res) => {

    const repositoryId = req.repositoryObj._id.toString();

    const {installationId, commit, brokenDocuments, brokenSnippets} = req.body;

    if (!checkValid(installationId)) return res.json({success: false, error: 'no check installationId provided'});
    if (!checkValid(commit)) return res.json({success: false, error: 'no check commit provided'});
    if (!checkValid(brokenDocuments)) return res.json({success: false, error: 'no check brokenDocuments provided'});
    if (!checkValid(brokenSnippets)) return res.json({success: false, error: 'no check brokenSnippets provided'});

    const fullName = req.repositoryObj.fullName;

    var installationClient;
    try {
        installationClient = await apis.requestInstallationClient(installationId);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err, errorDescription: "Error fetching installationClient", function: "createCheck"});
        return res.json({success: false, error: 'error accessing installationClient'});
    }

    // Validate that there isn't already a Check on this commit



    let check = new Check({
        sha: commit,
        brokenDocuments,
        brokenSnippets,
        repository: repositoryId
    });

    check = await check.save();

    // Create initial 'in_progress' Check
    var beginObject = {
        name: 'document-coverage',
        head_sha: commit,
        details_url: 'https://www.google.com',
        external_id: check._id.toString(),
        status: 'in_progress',
    }

    var checkCreateBegin;
    try {
        checkCreateBegin = await installationClient.post(`/repos/${fullName}/check-runs`, beginObject);
        if (checkCreateBegin.status.toString() != '201') {
            await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error creating 'in_progress' Check on commit: ${commit}\n status: ${checkCreateBegin.status}`,
                                function: "createCheck"});

            return res.json({success: false, error: "error creating 'in_progress' Check"});
        }
        check.githubId = checkCreateBegin.data.id;
        check = await check.save();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err, errorDescription: `Error creating 'in_progress' Check on commit: ${commit}`, function: "createCheck"});
        return res.json({success: false, error: 'error accessing installationClient'});
    }


    var checkObj;
    try {
        checkObj = await createCheckRunObj(commit, brokenDocuments, brokenSnippets, check._id.toString());
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error creating updated check object: ${commit}`,
                            function: "createCheckRunObj"});
        return res.json({success: false, error: 'Error Creating Check Content'});
    }

    console.log('checkObj: ');
    console.log(JSON.stringify(checkObj));

    console.log('githubId: ', check.githubId);

    /*
    var checkUpdateResponse;
    try {
        checkUpdateResponse = await installationClient.patch(`/repos/${fullName}/check-runs/${check.githubId}`, checkObj);
        
        if (checkUpdateResponse.status.toString() != '200') {
            await logger.error({source: 'backend-api', message: err,
            errorDescription: `Error updating Check Run Github API call commit, status: ${commit}, ${checkUpdateResponse.status}`,
            function: "createCheckRunObj"});
        return res.json({success: false, error: `Error Updating Check Run, status: ${checkUpdateResponse.status}`});
        }
    }
    catch (err) {

        await logger.error({source: 'backend-api', message: err,
        errorDescription: `Error creating updated check object for Github API call: ${commit}`,
        function: "createCheckRunObj"});
        return res.json({success: false, error: 'Error Creating Check Content'});
    }
    */
    

    return res.json({success: true, result: check});
}

module.exports = {
    createCheck
}