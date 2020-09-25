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
    console.log('Defining client');
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
                    customField: { type: 'text' },
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
      /*
      setImmediate(() => {
        this.emit('logged', info);
      });
      */
      console.log('unga bunga');
      console.log(info);
  
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



/*
  const dataset = [{
    id: 1,
    text: 'If I fall, don\'t bring me back.',
    user: 'jon',
    date: new Date()
  }, {
    id: 2,
    text: 'Witer is coming',
    user: 'ned',
    date: new Date()
  }, {
    id: 3,
    text: 'A Lannister always pays his debts.',
    user: 'tyrion',
    date: new Date()
  }, {
    id: 4,
    text: 'I am the blood of the dragon.',
    user: 'daenerys',
    date: new Date()
  }, {
    id: 5, // change this value to a string to see the bulk response with errors
    text: 'A girl is Arya Stark of Winterfell. And I\'m going home.',
    user: 'arya',
    date: new Date()
  }]

  const body = dataset.flatMap(doc => [{ index: { _index: 'tweets' } }, doc])

  const { body: bulkResponse } = await client.bulk({ refresh: true, body })

  if (bulkResponse.errors) {
    const erroredDocuments = []
    // The items array has the same order of the dataset we just indexed.
    // The presence of the `error` key indicates that the operation
    // that we did for the document has failed.
    bulkResponse.items.forEach((action, i) => {
      const operation = Object.keys(action)[0]
      if (action[operation].error) {
        erroredDocuments.push({
          // If the status is 429 it means that you can retry the document,
          // otherwise it's very likely a mapping error, and you should
          // fix the document before to try it again.
          status: action[operation].status,
          error: action[operation].error,
          operation: body[i * 2],
          document: body[i * 2 + 1]
        })
      }
    })
    console.log(erroredDocuments)
  }

  const { body: count } = await client.count({ index: 'tweets' })
  console.log(count)
*/