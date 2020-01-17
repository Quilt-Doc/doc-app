const mongoose = require('mongoose');
const express = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('morgan');


const API_PORT = 3001;
const app = express();
const router = express.Router();

const session = require('express-session');
const password = 'qZyvXV2chEbJntnE'
var dbRoute = `mongodb+srv://fsanal:${password}@documentationapp-vtdfe.mongodb.net/test?retryWrites=true&w=majority`

console.log(process.env);
console.log(process.env.USE_EXTERNAL_DB);

if (!typeof process.env.USE_EXTERNAL_DB !== 'undefined' && process.env.USE_EXTERNAL_DB == 'false') {
    dbRoute = 'mongodb://127.0.0.1:27017?retryWrites=true&w=majority'
}
console.log(dbRoute)


//mongoose.connect('mongodb://localhost:27017/myDatabase');
mongoose.connect(dbRoute, { useNewUrlParser: true });

let db = mongoose.connection;

var routes = require("./routes/routes");
app.use('/api', routes);

db.once('open', () => console.log('connected to the database'));
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(cors());

app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));