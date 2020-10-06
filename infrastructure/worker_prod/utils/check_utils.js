
const Document = require('../models/Document');
const Snippet = require('../models/Snippet');

const generateCheckSummary = (brokenDocuments, brokenSnippets) => {
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


const generateCheckText = async (brokenDocuments, brokenSnippets) => {
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

const createCheckRunObj = async (commit, brokenDocuments, brokenSnippets, checkId, worker) => {

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
        details_url: 'https://www.google.com',
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