const logform = require('logform');
const tripleBeam = require('triple-beam');
const winston = require('winston');

const { format } = require('logform');
const { errors } = format;

var ElasticSearchTransport = require('./es_transport').ElasticSearchTransport;
var setupESConnection = require('./es_transport').setupESConnection;

var logger = undefined; 

const errorHunter = logform.format(info => {
  if (info.message) {
    if (info.message instanceof Error) {
      if (info.errorDescription) {
        info.message.message = `${info.errorDescription}\n${info.message.message}`;
        delete info.errorDescription;
      }
    }
    return info;
  }


  // info.error = Object.values(info).find(obj => obj instanceof Error);

  return info;
});

const errorPrinter = logform.format(info => {
  if (!info.error) return info;

  // Handle case where Error has no stack.
  var errorMsg = info.error.stack || info.error.toString();

  info.message += `\n${errorMsg}`;
  console.log('RETURNING MESSAGE: ', info.message);
  return info;
});


if (process.env.IS_PRODUCTION) {
  logger = winston.createLogger({
      transports: [
        new ElasticSearchTransport({
          level: 'info',
          format: winston.format.combine(
            errorHunter(),
            errors({ stack: true }),
            // errorPrinter(),
            winston.format.json()
          )
        }),
        new winston.transports.Console({
          level: 'debug',
          format: winston.format.combine(
            errorHunter(),
            errors({ stack: true }),
            // errorPrinter(),
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
  });
}

else {
  logger = winston.createLogger({
    transports: [
      new winston.transports.Console({
        level: 'debug',
        format: winston.format.combine(
          errorHunter(),
          errorPrinter(),
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });
}

module.exports = {
    logger,
    setupESConnection
}
