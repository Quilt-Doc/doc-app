const express = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');
// const logger = require('morgan');
const session = require('express-session');

const genSVG = require('./api/index');

const fs = require('fs');

require('dotenv').config();

// const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");


const API_PORT = 3001;
const app = express();

app.use(bodyParser.urlencoded({ limit: '20mb', extended: false }));
app.use(bodyParser.json({ limit: '20mb'}));



/*
app.use(cors());
*/
app.use(
    cors({
            // allow server to accept request from different origin
            origin: true,
            methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
            credentials: true // allow session cookie from browser to pass through
        })
        
);

app.get('/', genSVG);


app.listen(API_PORT, '0.0.0.0', () => console.log(`Listening on port ${API_PORT}`));
