const Ticket = require('../../models/integrations_fs/Ticket');

retrieveTickets = async (req, res) => {
    const { workspaceId } = req.params;

    let query = Ticket.find({workspace: workspaceId});

    const tickets = await query.lean().exec();

    return res.json({success: true, result: tickets});
}

module.exports = {
    retrieveTickets
}