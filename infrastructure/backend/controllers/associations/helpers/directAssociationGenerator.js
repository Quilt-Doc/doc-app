//classes
const AssociationGenerator = require("./associationGenerator");

//association
const Association = require("../../../models/associations/Association");

class DirectAssociationGenerator extends AssociationGenerator {
    constructor(integrationId, integrationType) {
        super(integrationId, integrationType);
    }

    async generateDirectAssociations() {
        await super.acquireIntegrationObjects();

        //acquire all code objects of each direct attachment in the ticket
        await queryDirectAttachments();

        //create and insert associations using tickets and associated code objects
        await insertDirectAssociations();
    }

    async queryDirectAttachments() {
        // make a promise.all call to evaluate all queries for each
        // ticket together
        const codeObjects = await Promise.all(
            this.tickets.map((ticket) => {
                const { attachments } = ticket;

                // make a promise.all for all the attachment queries for
                // current ticket in map function
                return Promise.all(
                    attachments.map((attachment) => {
                        const { type, repository, identifier } = attachment;

                        if (
                            ![
                                "pullRequest",
                                "commit",
                                "branch",
                                "issue",
                            ].includes(type)
                        ) {
                            //throw new Error("Not Correct Attachment Type")
                            return null;
                        }

                        // acquire the model for the attachment currently inspected
                        const attachmentModel = this.coModelMapping[type];

                        let query = attachmentModel.find({
                            sourceId: identifier,
                            repository,
                        });

                        query.select("_id");

                        return query.exec();
                    })
                );
            })
        );

        this.codeObjects = codeObjects;
    }

    async insertDirectAssociations() {
        const { workspace } = this.integration;

        let associations = [];

        this.codeObjects.map((ticketCodeObjects, i) => {
            //extract relevant ticket for code object grouping
            const ticket = this.tickets[i];

            ticketCodeObjects.map((codeObject) => {
                if (!codeObject) return;

                let association = {
                    workspace,
                    firstElement: ticket._id,
                    firstElementType: "IntegrationTicket",
                    secondElement: codeObject._id,
                    secondElementType: codeObject.constructor.modelName,
                    quality: 1,
                    associationLevel: 1,
                };

                associations.push(association);
            });
        });

        associations = await Association.insertMany(associations).lean();

        return associations;
    }
}

module.exports = DirectAssociationGenerator;
