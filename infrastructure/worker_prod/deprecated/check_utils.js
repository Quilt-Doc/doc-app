
const checkConstants = require('../constants/index').checks;

const Document = require('../models/Document');
const Snippet = require('../models/Snippet');

generateCheckSummary = (brokenDocuments, brokenSnippets) => {

    var documentWord = (brokenDocuments.length > 0 && brokenDocuments.length < 2) ? 'document' : 'documents'
    var snippetWord = (brokenSnippets.length > 0 && brokenSnippets.length < 2) ? 'snippet' : 'snippets'


    if (brokenDocuments.length == 0 && brokenSnippets.length == 0) {
        return 'This push broke no documentats or snippets!';
    }
    else if (brokenDocuments.length > 0 && brokenSnippets.length == 0) {
        return `This push broke ${brokenDocuments.length} ${documentWord}`;
    }
    else if (brokenDocuments.length == 0 && brokenSnippets.length > 0) {
        return `This push broke ${brokenSnippets.length} ${snippetWord}`;
    }
    else if (brokenDocuments.length > 0 && brokenSnippets.length > 0) {
        return `This push broke ${brokenDocuments.length} ${documentWord} and ${brokenSnippets.length} ${snippetWord}`;
    }
}



// TODO: Make documents link to themselves
generateCheckText = async (brokenDocuments, brokenSnippets) => {
    var text = '';


    // Append broken Document text
    for (i = 0; i < brokenDocuments.length; i++) {
        if (i >= checkConstants.CHECK_DOCUMENT_MAX_NUM) break;
        var documentObj;
        try {
            documentObj = await Document.findById(brokenDocuments[i].toString(), 'title workspace').exec();
        }
        catch (err) {
            throw new Error(`Error fetching Document: ${brokenDocuments[i]}`);
        }
        if (documentObj) text += `![Invalid Document Icon](${process.env.PRODUCTION_API_URL}/assets/invalid_document) [${documentObj.title}](${process.env.PRODUCTION_HOME_PAGE_URL})\n`
    }

    // Append broken Snippet text
    for (i = 0; i < brokenSnippets.length; i++) {
        if (i >= checkConstants.CHECK_SNIPPET_MAX_NUM) break;
        var snippetObj;
        try {
            snippetObj = await Snippet.findById(brokenSnippets[i]);
        }
        catch (err) {
            throw new Error(`Error fetching Snippet: ${brokenSnippets[i]}`);
        }
        if (snippetObj) text += `![Invalid Document Icon](${process.env.PRODUCTION_API_URL}/assets/invalid_snippet) [${snippetObj.annotation.slice(0, checkConstants.CHECK_SNIPPET_CHAR_MAX)}](${process.env.PRODUCTION_HOME_PAGE_URL})\n`
    }

    return text;

}

const createCheckRunObj = async (commit, brokenDocuments, brokenSnippets, checkId, worker) => {


    var outputObj;
    try {
        outputObj = {   title: 'Quilt Knowledge Changes',
                    summary: generateCheckSummary(brokenDocuments, brokenSnippets),
                    text: await generateCheckText(brokenDocuments, brokenSnippets),
                    // images: [imageObj]
                }
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance',
                                                    message: err,
                                                    errorDescription: `Error generating check text on commit, brokenDocuments, brokenSnippets: ${commit}, ${JSON.stringify(brokenDocuments)}, ${JSON.stringify(brokenSnippets)}`,
                                                    function: "generateCheckText"}});
        throw new Error(`Error generating check text on commit, brokenDocuments, brokenSnippets: ${commit}, ${JSON.stringify(brokenDocuments)}, ${JSON.stringify(brokenSnippets)}`);
    }

    var currentDateISO = (new Date()).toISOString();

    var checkObj = {
        name: 'document-coverage',
        head_sha: commit,
        details_url: `${process.env.PRODUCTION_HOME_PAGE_URL}`,
        external_id: checkId,
        status: 'completed',
        started_at: currentDateISO,
        conclusion: (brokenDocuments.length > 0 || brokenSnippets.length > 0) ? 'failure' : 'success',
        completed_at: currentDateISO,
        output: outputObj,
    };

    return checkObj;
}


module.exports = {
    createCheckRunObj
}