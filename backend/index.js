const mongoose = require('mongoose');
const express = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('morgan');
const session = require('express-session');

require('dotenv').config();

// PASSPORT 
const passport = require("passport");
const passportSetup = require("./passport_config/passport-setup");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");



const API_PORT = 3001;
const app = express();



// This should be an environment variable
const password = process.env.EXTERNAL_DB_PASS
const user = process.env.EXTERNAL_DB_USER;
var dbRoute = `mongodb+srv://${user}:${password}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`

console.log(process.env.USE_EXTERNAL_DB);

if (process.env.USE_EXTERNAL_DB == 0) {
    dbRoute = 'mongodb://127.0.0.1:27017?retryWrites=true&w=majority'
    console.log('Running')
}
console.log(dbRoute);


//mongoose.connect('mongodb://localhost:27017/myDatabase');
mongoose.connect(dbRoute, { useNewUrlParser: true });

let db = mongoose.connection;

db.once('open', () => console.log('connected to the database'));
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));

// handle cookies 


app.use(
    cookieSession({
      name: "session",
      keys: [process.env.COOKIE_KEY],
      maxAge: 24 * 60 * 60 * 100
    })
);
app.use(cookieParser());

// initalize passport
app.use(passport.initialize());
// deserialize cookie from the browser
app.use(passport.session());

/*
app.use(cors());
*/
app.use(
    cors({
            origin: "http://localhost:3000", // allow server to accept request from different origin
            methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
            credentials: true // allow session cookie from browser to pass through
        })
);
  
var routes = require("./routes/routes");
app.use('/api', routes);

/*
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) { return next(); }
    return res.json({
        authenticated: false,
        message: "user has not been authenticated"
    })
}

app.get("/", ensureAuthenticated, (req, res) => {
    res.status(200).json({
      authenticated: true,
      message: "user successfully authenticated",
      user: req.user,
      cookies: req.cookies
    });
});
*/

const authCheck = (req, res, next) => {
    if (!req.user) {
      res.status(401).json({
        authenticated: false,
        message: "user has not been authenticated"
      });
    } else {
      next();
    }
};
  
  // if it's already login, send the profile response,
  // otherwise, send a 401 response that the user is not authenticated
  // authCheck before navigating to home page
app.get("/", authCheck, (req, res) => {
    return res.status(200).json({
        authenticated: true,
        message: "user successfully authenticated",
        user: req.user,
        cookies: req.cookies
    });
});
  
app.listen(API_PORT, '0.0.0.0', () => console.log(`LISTENING ON PORT ${API_PORT}`));