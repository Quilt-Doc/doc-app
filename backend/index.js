const mongoose = require('mongoose');
const express = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('morgan');
require('dotenv').config();

const API_PORT = 3001;
const app = express();

const session = require('express-session');

// This should be an environment variable
const password = process.env.EXTERNAL_DB_PASS
var dbRoute = `mongodb+srv://fsanal:${password}@documentationapp-vtdfe.mongodb.net/test?retryWrites=true&w=majority`

console.log(process.env.USE_EXTERNAL_DB);

if (!typeof process.env.USE_EXTERNAL_DB !== 'undefined' && process.env.USE_EXTERNAL_DB == 0) {
    dbRoute = 'mongodb://127.0.0.1:27017?retryWrites=true&w=majority'
}
console.log(dbRoute)


//mongoose.connect('mongodb://localhost:27017/myDatabase');
mongoose.connect(dbRoute, { useNewUrlParser: true });

let db = mongoose.connection;

db.once('open', () => console.log('connected to the database'));
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(cors());

var routes = require("./routes/routes");
app.use('/api', routes);

app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));