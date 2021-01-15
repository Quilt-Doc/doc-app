/*
require("dotenv").config();

const api = require("../apis/api");

const mongoose = require("mongoose");

const _ = require("lodash");

const trelloControllerHelpers = require("../controllers/integrations/trello/TrelloControllerHelpers");

const testData = require("../__tests__data/02_trello_bulk_scrape_data");

const {
    TEST_USER_ID,
    TEST_CREATED_WORKSPACE_ID,
    EXTERNAL_DB_PASS,
    EXTERNAL_DB_USER,
} = process.env;

beforeAll(async () => {
    const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

    await mongoose.connect(dbRoute, { useNewUrlParser: true });

    let db = mongoose.connection;

    db.once("open", () => console.log("connected to the database"));

    db.on("error", console.error.bind(console, "MongoDB connection error:"));
});
*/
