const logform = require('logform');
const tripleBeam = require('triple-beam');
const winston = require('winston');

const { format } = require('logform');
const { errors } = format;

var ElasticSearchTransport = require('./es_transport').ElasticSearchTransport;
var setupESConnection = require('./es_transport').setupESConnection;

var logger = undefined; 

const errorDescriptionSetter = logform.format(info => {
  if (info.errorDescription) {
    if (info.message) {
      if (info.message.length > 0) {
        info.message = `${info.errorDescription}\n${info.message}`
      }
    }
    else {
      info.message = info.errorDescription;
    }
    delete info.errorDescription;
  }
  return info;
});


if (process.env.IS_PRODUCTION) {
  logger = winston.createLogger({
      transports: [
        new ElasticSearchTransport({
          level: 'info',
          format: winston.format.combine(
            errors({ stack: true }),
            errorDescriptionSetter(),
            winston.format.json()
          )
        }),
        new winston.transports.Console({
          level: 'debug',
          format: winston.format.combine(
            errors({ stack: true }),
            errorDescriptionSetter(),
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
          errors({ stack: true }),
          errorDescriptionSetter(),
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
