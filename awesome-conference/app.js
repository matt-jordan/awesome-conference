'use strict';
const https = require('https');
const config = require('config');
const log = require('./src/lib/log');
const bootstrap = require('./src/bootstrap');
const fs = require('fs');
const privateKey = fs.readFileSync('/etc/asterisk/keys/asterisk.key', 'utf8');
const certificate = fs.readFileSync('/etc/asterisk/keys/asterisk.crt', 'utf8');

const credentials = {key: privateKey, cert: certificate};

bootstrap.boot().then(app => {
    https.createServer(credentials, app).listen(config.port, () => {
        log.info(`server listening on port ${config.port}`);
    });
}).catch(err => {
    process.nextTick(() => { throw err; });
});
