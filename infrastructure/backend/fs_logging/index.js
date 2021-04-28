const winston = require("winston");
const util = require("util");

const { format } = winston;

const {
    timestamp,
    prettyPrint,
    colorize,
    combine,
    simple,
    splat,
    printf,
} = format;

const filterFunctions = format((info, opts) => {
    if (!info.func) {
        return info;
    }
    const includedFunctions = new Set(["nothing"]);

    if (includedFunctions.size == 0) return info;

    if (!includedFunctions.has(info.func)) {
        return false;
    }

    return info;
});

// magically transforms karan logs to faraz logs
const castASpell = printf(({ level, message, func, obj, e, timestamp }) => {
    let plain = `${level}: ${message} \n`;

    if ((func != null) & (func != undefined))
        plain = `${`\x1b[35m[ ${func} ]\x1b[0m `}${plain}`;

    if ((obj != null) & (obj != undefined) && process.env.LOG_OBJECTS == 1) {
        obj = util.inspect(obj, { colors: true, depth: 1 });

        plain = `${plain}${`\n${obj}\n`}`;
    }

    if ((e != null) & (e != undefined)) {
        e = util.inspect(e, { colors: true, depth: 4 });

        plain = `${plain}${`\n${e}\n`}`;
    }

    return plain;
});

const logger = winston.createLogger({
    level: "debug",
    format: combine(
        colorize(),
        timestamp(),
        prettyPrint(),
        splat(),
        simple(),
        filterFunctions(),
        castASpell
    ),
    transports: [new winston.transports.Console()],
});

module.exports = {
    logger,
};
