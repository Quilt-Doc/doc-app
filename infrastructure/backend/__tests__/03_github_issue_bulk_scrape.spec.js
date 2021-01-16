/**
 * @jest-environment ./__tests__config/my-custom-environment
 */



require('dotenv').config();
const fs = require("fs");

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const IntegrationTicket = require('../../models/integrations/integration_objects/IntegrationTicket');

/*
beforeAll(() => {
    if (fs.existsSync('./test_env.json')) {
        //file exists
        var data = fs.readFileSync('./test_env.json', 'utf8');
        process.env = JSON.parse(data);
    }
})
*/

const fetchAllGithubIssues = async (repositoryId) => {
    var scrapedGithubIssues;
    try {
        scrapedGithubIssues = await IntegrationTicket.find({ repositoryId: ObjectId(repositoryId.toString()) })
                                                        .lean()
                                                        .exec();
    }
    catch (err) {
        console.log(err);
        throw Error(`Couldn't fetch IntegrationTickets - repositoryId: ${repositoryId}`);
    }

    return scrapedGithubIssues;
}

const getIntegrationIntervalsList = (scrapedIssues) => {
    var intervalList = scrapedIssues.map(issueObj => {
        return issueObj.intervals
    });
    intervalList = intervalList.flat().filter(obj => obj);
    return intervalList;
}

describe("Github Issue Bulk Scrape", () => {

    var createdRepositories = JSON.parse(process.env.TEST_CREATED_REPOSITORIES);
    var createdRepositoryIds = createdRepositories.map(repositoryObj => repositoryObj._id);

    var brodalQueueIssueNum = 2;
    var docAppIssueNum = 6;

    var brodalQueueIssueIntervalNum = 2;
    var docAppIssueIntervalNum = 3;




    test("brodal_queue Issues should be scraped.", async () => {
        var scrapedIssues = await fetchAllGithubIssues(createdRepositoryIds[0]);

        expect(scrapedIssues.length).toEqual(brodalQueueIssueNum);

    });

    test("brodal_queue Issues should have IntegrationIntervals created.", async () => {
        var scrapedIssues = await fetchAllGithubIssues(createdRepositoryIds[0]);

        expect(getIntegrationIntervalsList(scrapedIssues).length).toEqual(brodalQueueIssueIntervalNum);

    });
    /*
    test("brodal_queue Issues should have labels scraped", async () => {
        var scrapedIssues = await fetchAllGithubIssues(createdRepositoryIds[0]);
    });
    */



    test("doc-app Issues should be scraped.", async () => {
        var scrapedIssues = await fetchAllGithubIssues(createdRepositoryIds[1]);

        expect(scrapedIssues.length).toEqual(docAppIssueNum);

    });

    test("doc-app Issues should have IntegrationIntervals created.", async () => {
        var scrapedIssues = await fetchAllGithubIssues(createdRepositoryIds[1]);

        expect(getIntegrationIntervalsList(scrapedIssues).length).toEqual(docAppIssueIntervalNum);

    });
    /*
    test("doc-app Issues should have labels scraped", async () => {
        var scrapedIssues = await fetchAllGithubIssues(createdRepositoryIds[1]);
    });
    */

});
