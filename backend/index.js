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
const dbRoute = `mongodb+srv://fsanal:${password}@documentationapp-vtdfe.mongodb.net/test?retryWrites=true&w=majority`

//mongoose.connect('mongodb://localhost:27017/myDatabase');
mongoose.connect(dbRoute, { useNewUrlParser: true });


let db = mongoose.connection;

db.once('open', () => console.log('connected to the database'));
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

pp.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(cors());

app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));