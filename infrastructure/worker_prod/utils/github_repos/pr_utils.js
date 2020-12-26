
const {serializeError, deserializeError} = require('serialize-error');

// const { fetchAppToken, requestInstallationToken } = require('../../apis/api');

const fetchAllRepoPRsAPI = async (installationClient, installationId, fullName, worker) => {
    // Get list of all PRs
    // GET /repos/{owner}/{repo}/pulls
    // per_page	integer	query - Results per page (max 100)
    // page	integer	query - Page number of the results to fetch.


    var perPage = 100;
    var pageNum = 0;

    var prListResponse;

    // Default value of 10
    var lastPageNum = 10;

    var foundPRList = [];
    var searchString;
 

    while (pageNum < lastPageNum) {
        try {
            prListResponse = await installationClient.get(`/repos/${fullName}/pulls?per_page=${perPage}&page=${pageNum}&state=all`);
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error',
                                                        message: serializeError(err),
                                                        errorDescription: `Github API List PRs failed - installationId, fullName: ${installationId}, ${fullName}`,
                                                        source: 'worker-instance',
                                                        function: 'fetchAllRepoPRsAPI'}});

            break;

            // throw new Error(`Github API List Branches failed - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`);
        }

        // We've gotten all results
        if (!prListResponse.headers.link) {
            pageNum = lastPageNum;
        }

        else {
            var link = LinkHeader.parse(prListResponse.headers.link);

            await worker.send({action: 'log', info: {
                level: 'info',
                message: `prListResponse.headers.link: ${JSON.stringify(link)}`,
                source: 'worker-instance',
                function: 'fetchAllRepoPRsAPI',
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

        if (prListResponse.data.length < 1) {
            break;
        }

        await worker.send({action: 'log', info: {
            level: 'info',
            message: `Adding prListResponse.data.length: ${prListResponse.data.length}`,
            source: 'worker-instance',
            function: 'fetchAllRepoPRsAPI',
        }});

        pageNum += 1;

        foundPRList.push(prListResponse.data);

    }

    foundPRList = foundPRList.flat();

    return foundPRList;
}

module.exports = {
    fetchAllRepoPRsAPI
}