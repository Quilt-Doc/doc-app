
const {serializeError, deserializeError} = require('serialize-error');


const fetchAllRepoBranchesAPI = async (installationClient, installationId, fullName, worker) => {

    // Get list of all branches
    // GET /repos/{owner}/{repo}/branches
    // per_page	integer	query - Results per page (max 100)
    // page	integer	query - Page number of the results to fetch.

    var perPage = 100;
    var pageNum = 0;

    var branchListResponse;

    // Default value of 10
    var lastPageNum = 10;

    var foundBranchList = [];

    var searchString;


    while (pageNum < lastPageNum) {
        try {
            branchListResponse = await installationClient.get(`/repos/${fullName}/branches?per_page=${perPage}&page=${pageNum}`);
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error',
                                                        message: serializeError(err),
                                                        errorDescription: `Github API List Branches failed - installationId, fullName: ${installationId}, ${fullName}`,
                                                        source: 'worker-instance',
                                                        function: 'fetchAllRepoBranchesAPI'}});

            reachedBranchListEnd = true;
            break;

            // throw new Error(`Github API List Branches failed - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`);
        }

        // We've gotten all results
        if (!branchListResponse.headers.link) {
            pageNum = lastPageNum;
        }

        else {
            var link = LinkHeader.parse(branchListResponse.headers.link);

            await worker.send({action: 'log', info: {
                level: 'info',
                message: `branchListResponse.headers.link: ${JSON.stringify(link)}`,
                source: 'worker-instance',
                function: 'fetchAllRepoBranchesAPI',
            }});
    
    
            var i;
            for (i = 0; i < link.refs.length; i++) {
                if (link.refs[i].rel == 'last') {
                    searchString = parseUrl(link.refs[i].uri).search;
    
                    lastPageNum = queryString.parse(searchString).page;
                    break;
                }
            }
        }

        if (branchListResponse.data.length < 1) {
            break;
        }

        await worker.send({action: 'log', info: {
            level: 'info',
            message: `Adding branchListResponse.data.length: ${JSON.stringify(branchListResponse.data.length)}`,
            source: 'worker-instance',
            function: 'fetchAllRepoBranchesAPI',
        }});

        pageNum += 1;

        foundBranchList.push(branchListResponse.data);

    }

    foundBranchList = foundBranchList.flat();

    return foundBranchList;
}


const insertAllBranchesFromAPI = async (foundBranchesList, insertedPRList, installationId, repositoryId, worker) => {

    // Use ref as opposed to label for deduplication

    var branchObjectsToInsert;

    // Create Objects from foundBranchesList

    /*
        repository: { type: ObjectId, ref: 'Repository' },
        installationId: { type: Number, required: true },

        ref: { type: String, required: true },
        branchLabel: { type: String },
        lastCommit: { type: ObjectId, ref: 'Commit' },
        commitUser: { type: ObjectId, ref: 'IntegrationUser' },
    */

    foundBranchesList.map(branchObj => {
        branchObjectsToInsert.push({
            repository: repositoryId,
            installationId: installationId,
            ref: branchObj.name,
            // branchLabel: , doesn't exist here
            lastCommit: branchObj.commit.sha,
            // commitUser: ,
        });
    });





}


module.exports = {
    fetchAllRepoBranchesAPI,
    insertAllBranchesFromAPI
}