const logform = require("logform");
const tripleBeam = require("triple-beam");
const winston = require("winston");

const { format } = require("logform");
const { errors } = format;
const errorsFormat = errors({ stack: true });

var logger = undefined; 



const validKeys = ["date", "level", "message", "stack", "source", "function", "errorDescription"];

const objectKeyRemover = logform.format(info => {

    Object.keys(info).forEach((key) => validKeys.includes(key) || delete info[key]);
    return info;
});


logger = winston.createLogger({
    levels: winston.config.syslog.levels,
    transports: [
        new winston.transports.Console({
            level: "debug",
            format: winston.format.combine(
                errors({ stack: true }),
                objectKeyRemover(),
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
    ],
});

module.exports = {
    logger,
};
