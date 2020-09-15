const logform = require('logform');
const tripleBeam = require('triple-beam');
const winston = require('winston');

var ElasticSearchTransport = require('./es_transport').ElasticSearchTransport;
var setupESConnection = require('./es_transport').setupESConnection;

var logger = undefined; 

const errorHunter = logform.format(info => {
  console.log('errorHunter');
  if (info.error) return info;

  // const splat = info[tripleBeam.SPLAT] || [];
  console.log('splat: ', splat);
  info.error = splat.find(obj => obj instanceof Error);
  console.log('info.error: ', info.error);

  return info;
});

const errorPrinter = logform.format(info => {
  console.log('errorPrinter');
  if (!info.error) return info;

  // Handle case where Error has no stack.
  const errorMsg = info.error.stack || info.error.toString();
  console.log('errorMsg: ', errorMsg);
  info.message += `\n${errorMsg}`;

  return info;
});


if (process.env.IS_PRODUCTION) {
  logger = winston.createLogger({
      transports: [
        new ElasticSearchTransport({
          level: 'info',
          format: winston.format.combine(
            errorHunter(),
            errorPrinter(),
            winston.format.json()
          )
        }),
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
