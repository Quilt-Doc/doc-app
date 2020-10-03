const user_name     = 'karan@getquilt.app';
const refresh_token = '';
const access_token  = '';
const client_id     = '';
const client_secret = '';

const email_to = 'porsliana@gmail.com';

const nodemailer = require('nodemailer');

let transporter = nodemailer
.createTransport({
    service: 'Gmail',
    auth: {
        type: 'OAuth2',
        clientId: client_id,
        clientSecret: client_secret
    }
});
transporter.on('token', token => {
    console.log('A new access token was generated');
    console.log('User: %s', token.user);
    console.log('Access Token: %s', token.accessToken);
    console.log('Expires: %s', new Date(token.expires));
});
// setup e-mail data with unicode symbols
let mailOptions = {
    from    : user_name, // sender address
    to      : email_to, // list of receivers
    subject : 'Hello ✔', // Subject line
    text    : 'Hello world ?', // plaintext body
    html    : '<b>Hello world ?</b>', // html body

    auth : {
        user         : user_name,
        refreshToken : refresh_token,
        accessToken  : access_token,
        // expires      : 1494388182480
    }
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
        return console.log(error);
    }
    console.log('Message sent: ' + info.response);
});