const Transport = require('winston-transport');
const util = require('util');

const { Client } = require('@elastic/elasticsearch');
const { createAWSConnection, awsCredsifyAll, awsGetCredentials } = require('@acuris/aws-es-connection')

var awsCredentials = undefined;
var AWSConnection = undefined;
var client = undefined;


setupESConnection = async () => {

    awsCredentials = await awsGetCredentials();
    AWSConnection = createAWSConnection(awsCredentials)
    client = awsCredsifyAll(
        new Client({
            node: 'https://search-quilt-e5ak7qxc7rf4t7gdl3p5vf2p6a.us-east-1.es.amazonaws.com',
            Connection: AWSConnection
        })
    )

    await client.indices.create({
        index: 'quilt-logs',
        body: {
            mappings: {
                properties: {
                    date: { type: 'date'},
                    level: { type: 'text' },
                    message: { type: 'text' },
                    stack: { type: 'text' },
                    source: { type: 'text' },
                    function: { type: 'text' },
                    errorDescription: {type: 'text'}
                }
            }
        }
    }, { ignore: [400] });

}

class ElasticSearchTransport extends Transport {
    constructor(opts) {
      super(opts);
      //
      // Consume any custom options here. e.g.:
      // - Connection information for databases
      // - Authentication information for APIs (e.g. loggly, papertrail, 
      //   logentries, etc.).
      //
    }

    async log(info, callback) {
  
      let esData = {};
      for(let prop in info) {
          if(info.hasOwnProperty(prop)) {
              esData[prop] = info[prop];
          }
      }

      esData.date = (new Date()).toISOString();

      esData = [esData];
  
      
      var body = esData.flatMap(doc => [{ index: { _index: 'quilt-logs' } }, doc])
      const { body: bulkResponse } = await client.bulk({ refresh: true, body })
      // Perform the writing to the remote service
      callback();
    }
}



//
// Inherit from `winston-transport` so you can take advantage
// of the base functionality and `.exceptions.handle()`.
//
module.exports = {
    ElasticSearchTransport,
    setupESConnection,
}