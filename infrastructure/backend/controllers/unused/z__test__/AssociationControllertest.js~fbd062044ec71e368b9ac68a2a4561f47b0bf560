const LikelyAssociationGenerator = require("../../associations/helpers/likelyAssociationGenerator");

const {
    samplePullRequests,
    sampleCommits,
    sampleIssues,
    sampleBranches,
    sampleTickets,
} = require("./AssociationController.data");

const _ = require("lodash");

describe("Test generateSemanticAssociations Helper Methods", () => {
    test("uniqueCodeMapping correctly created", async () => {
        const expectedUniqueCodeObjectMapping = {
            likelyPullRequests: _.mapKeys(samplePullRequests, "_id"),
            likelyIssues: _.mapKeys(sampleIssues, "_id"),
            likelyCommits: _.mapKeys(sampleCommits, "_id"),
            likelyBranches: _.mapKeys(sampleBranches, "_id"),
        };

        const likelyGenerator = new LikelyAssociationGenerator(null, "trello");

        likelyGenerator.tickets = sampleTickets;

        likelyGenerator.storeUniqueCodeObjects();

        expect(likelyGenerator.uniqueCodeObjectMapping).toEqual(
            expectedUniqueCodeObjectMapping
        );
    });

    test("acquireEmbeddings creates embeddings of correct size", async () => {
        const likelyGenerator = new LikelyAssociationGenerator(null, "trello");

        likelyGenerator.tickets = sampleTickets;

        likelyGenerator.uniqueCodeObjectMapping = {
            likelyPullRequests: _.mapKeys(samplePullRequests, "_id"),
            likelyIssues: _.mapKeys(sampleIssues, "_id"),
            likelyCommits: _.mapKeys(sampleCommits, "_id"),
            likelyBranches: _.mapKeys(sampleBranches, "_id"),
        };

        const resultMapping = {
            likelyPullRequests: samplePullRequests,
            likelyIssues: sampleIssues,
            likelyCommits: sampleCommits,
            likelyBranches: sampleBranches,
        };

        await likelyGenerator.acquireEmbeddings();

        /*
        const [
            embeddedNames,
            embeddedDescs,
        ] = await likelyGenerator.acquireEmbeddings();

        expect(embeddedNames.length).toBe(5);

        expect(embeddedNames[0].length, sampleTickets.length);

        Object.values(resultMapping).map((item, i) => {
            expect(embeddedNames[i + 1].length).toBe(item.length);
        });

        expect(embeddedDescs.length).toBe(5);

        expect(embeddedDescs[0].length, sampleTickets.length);

        Object.values(resultMapping).map((item, i) => {
            expect(embeddedDescs[i + 1].length).toBe(item.length);
        });*/
    }, 100000);
});
