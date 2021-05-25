const mongoose = require("mongoose");
const express = require("express");
var cors = require("cors");
const bodyParser = require("body-parser");
// const logger = require('morgan');

const fs = require("fs");

require("dotenv").config();

// SENTRY
const Sentry = require("@sentry/node");

// PASSPORT
const passport = require("passport");
const passportSetup = require("./passport_config/passport-setup");

// const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");

var jwt = require("jsonwebtoken");

const API_PORT = 3001;
const app = express();

//SENTRY
Sentry.init({
    dsn:
        "https://5a8e044d64d24a7e8ec52600ee527944@o504090.ingest.sentry.io/5590374",
});

app.use(Sentry.Handlers.requestHandler());

const logger = require("./logging/index").logger;

const { format } = require("logform");

const jsonFormat = format.json();

// This should be an environment variable
const password = process.env.EXTERNAL_DB_PASS;
const user = process.env.EXTERNAL_DB_USER;
var dbRoute = `mongodb+srv://${user}:${password}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

if (process.env.USE_EXTERNAL_DB == 0) {
    dbRoute = "mongodb://127.0.0.1:27017?retryWrites=true&w=majority";
}

mongoose.connect(dbRoute, { useNewUrlParser: true });

let db = mongoose.connection;

db.once("open", () => console.log("connected to the database"));
db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use(bodyParser.urlencoded({ limit: "20mb", extended: false }));
app.use(bodyParser.json({ limit: "20mb" }));

// app.use(logger('dev'));

// handle cookies

/*
app.use(
    cookieSession({
      name: "session",
      keys: [process.env.COOKIE_KEY],
      maxAge: 24 * 60 * 60 * 100
    })
);
*/
app.use(cookieParser());

// initalize passport
app.use(passport.initialize());
// deserialize cookie from the browser
// app.use(passport.session());

// app.use(cors());
// app.options('*', cors());

// app.use(cors({credentials: true}));

app.use(
    cors({
        // allow server to accept request from different origin
        origin: true, // ['http://localhost:3000', 'https://getquilt.app', 'https://www.getquilt.app'],
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true, // allow session cookie from browser to pass through
    })
);

const nonAuthPaths = [
    "/pusher/vscode/auth",
    "/auth/login/success",
    "/auth/login/failed",
    "/integrations/connect/jira/callback",
    "/auth/github",
    "/api/auth/github",
    "/auth/github/redirect",
    "/api/verify/",
    "/auth/github/fork",
    "/api/auth/github/fork",
    "/api/testRoute",
    "/api/example_route",
    "/api/pusher/webhook",
    "/api/integrations/create",
    "/integrations/connect/trello",
    "/integrations/connect/jira",
    "/integrations/connect",
    "/api/integrations/connect",
    "integrations/connect/google",
    "/trello/handle_webhook",
    "/auth/encrypt_ide_token",
];

app.use(function (req, res, next) {
    req.path = req.path.trim();

    const authHeader = req.headers.authorization;

    var isNonAuthPath = false;
    var i;

    // Check if nonAuth API call
    for (i = 0; i < nonAuthPaths.length; i++) {
        if (req.path.includes(nonAuthPaths[i])) {
            isNonAuthPath = true;
            break;
        }
    }

    // Check if asset call
    if (
        req.path.includes("/assets") ||
        req.path.includes("/integrations/trello")
    ) {
        isNonAuthPath = true;
    }

    if (isNonAuthPath) {
        next();
        return;
    }

    // Get token
    var token = undefined;
    if (authHeader) {
        token = authHeader.split(" ")[1];
    } else if (req.cookies["user-jwt"]) {
        token = req.cookies["user-jwt"];
    } else {
        console.log("index.js: Request was not authenticated.", req.path);
        return res.status(401).json({
            authenticated: false,
            message: "user has not been authenticated",
        });
    }

    var publicKey = fs.readFileSync("docapp-test-public.pem", "utf8");
    //console.log("JWT TOKEN", token);
    try {
        // console.log('Attempting to verify token');
        var decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] });

        req.tokenPayload = decoded;
    } catch (err) {
        console.log("JWT Verify Failed Error: ");
        console.log(err);
        return res.status(403);
    }

    //console.log("Successfully verified token");
    next();
});

var routes = require("./routes/routes");
app.use("/api", routes);

const authCheck = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            authenticated: false,
            message: "user has not been authenticated",
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
        cookies: req.cookies,
    });
});

app.use(Sentry.Handlers.errorHandler());

app.listen(API_PORT, "0.0.0.0", () => {
    logger.debug({
        source: "backend-api",
        message: `Listening on port ${API_PORT}`,
        function: "index.js",
    });
});
