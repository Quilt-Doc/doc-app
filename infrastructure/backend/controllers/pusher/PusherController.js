const CryptoJS = require("crypto-js");

//models
const Document = require("../../models/Document");

// pusher
const Pusher = require("pusher");

const Slate = require("slate");

const { Node } = Slate;

// create pusher instance
const {
    PUSHER_APP_ID,
    PUSHER_KEY,
    PUSHER_SECRET,
    PUSHER_CLUSTER,
} = process.env;

const pusher = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
});

//logger
const logger = require("../../logging/index").logger;

const handlePusherWebhook = async (req, res) => {
    const bodyString = JSON.stringify(req.body);
    const hmac = CryptoJS.HmacSHA256(bodyString, PUSHER_SECRET).toString(
        CryptoJS.enc.Hex
    );
    /*
    if (hmac === req.headers['x-pusher-signature']) {
        const { events } = req.body;

        let editEvents = events.filter(ev => ev.event === "client-text-edit");
        //console.log("EDIT EVENTS", editEvents);
        
        let bulkWritePathOps = editEvents.map(ev => {
            const { data, channel } = ev;
            const documentId = channel.split('-')[1];

            const decodedData = decodeURIComponent(data);

            return ({
                updateOne: {
                    filter: { _id: documentId },
                    // Where field is the field you want to update
                    update: { $set: { markup: decodedData } },
                    upsert: false
                }
            })
        })

        //console.log("BULKWRITE PATH OPS", bulkWritePathOps);

        if (bulkWritePathOps.length > 0) {
            try {
                await Document.bulkWrite(bulkWritePathOps);
            } catch (err) {
                console.log("ERROR", err);
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `handlePusherWebhook Error: ${JSON.stringify(req.body)}`,
                                    function: 'handlePusherWebhook'});
                return res.status(404);
            }
        }
      

        return res.status(200);
    } else {
        return res.status(404);
    }
    */
    return res.status(200);
};

const authorizeVSCode = async (req, res) => {
    console.log("ASKING FOR PUSHER AUTHORIZATION");

    const { socket_id, channel_name } = req.body;

    const socketId = socket_id;

    const channel = channel_name;

    console.log("PUSHER VSCODE AUTH PARAMS", { socketId, channel });

    const auth = pusher.authenticate(socketId, channel);

    res.send(auth);
};

module.exports = {
    handlePusherWebhook,
    authorizeVSCode,
};
