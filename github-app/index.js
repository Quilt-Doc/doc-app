var https = require('https')

const fs = require('fs');

var jwt = require('jsonwebtoken');

require('dotenv').config();


createJWTToken = () => {

  const now = new Date().getTime();
  const timeNow = Math.round(now / 1000);

  // Generate the JWT
  var payload = {
    // issued at time
    iat: timeNow,
    // JWT expiration time (10 minute maximum)
    exp: timeNow + (10 * 60),
    // GitHub App's identifier
    iss: 68514
  }

  var private_key = fs.readFileSync('docapp-test.pem', 'utf8');

  return jwt.sign(payload, private_key, { algorithm: 'RS256' });

}

var token = createJWTToken();
console.log('TOKEN: ');
console.log(token);

var createHandler = require('github-webhook-handler')
var handler = createHandler({ path: '/webhook', secret: process.env.WEBHOOK_SECRET })

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};


https.createServer(options, function (req, res) {
  handler(req, res, function (err) {
    res.statusCode = 404
    res.end('no such location')
  })
}).listen(3002)

handler.on('error', function (err) {
  console.error('Error:', err.message)
})

handler.on('push', function (event) {
  console.log('Received a push event for %s to %s',
    event.payload.repository.name,
    event.payload.ref)
  console.log('Print payload');
  console.log(event.payload);
  var head_commit = event.payload['head_commit']
})

handler.on('issues', function (event) {
  console.log('Received an issue event for %s action=%s: #%d %s',
    event.payload.repository.name,
    event.payload.action,
    event.payload.issue.number,
    event.payload.issue.title)
  console.log('Print payload');
  console.log(event.payload);
})