const DirectAssociationGenerator = require("./helpers/directAssociationGenerator");
const LikelyAssociationGenerator = require("./helpers/likelyAssociationGenerator");

generateAssociations = async (integrationId, integrationType) => {
    const directGenerator = new DirectAssociationGenerator(
        integrationId,
        integrationType
    );

    const likelyGenerator = new LikelyAssociationGenerator(
        integrationId,
        integrationType
    );

    await Promise.all([
        likelyGenerator.generateLikelyAssociations(),
        directGenerator.generateDirectAssociations(),
    ]);
};

module.exports = {
    generateAssociations,
};
