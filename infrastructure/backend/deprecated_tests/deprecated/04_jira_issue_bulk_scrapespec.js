require("dotenv").config();
const fs = require("fs");

var mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const IntegrationTicket = require("../../../models/integrations/integration_objects/IntegrationTicket");

/*
const fetchAllJiraIssues = async (repositoryId) => {
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
*/

describe("Github Issue Bulk Scrape", () => {
    test("dummy test", () => {
        expect(1).toEqual(1);
    });

    /*
    var createdRepositories = JSON.parse(process.env.TEST_CREATED_REPOSITORIES);
    var createdRepositoryIds = createdRepositories.map(repositoryObj => repositoryObj._id);


    test("quilt-testing Issues should be scraped.", async () => {
        var scrapedIssues = await fetchAllJiraIssues();

        expect(scrapedIssues.length).toEqual(brodalQueueIssueNum);

    });

    test("quilt-testing Issues should have IntegrationIntervals created.", async () => {
        var scrapedIssues = await fetchAllGithubIssues(createdRepositoryIds[0]);

        expect(getIntegrationIntervalsList(scrapedIssues).length).toEqual(brodalQueueIssueIntervalNum);

    });
    */
});
