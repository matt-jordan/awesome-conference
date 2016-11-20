'use strict';

module.exports = {
    port: 3000,
    environment: 'development',
    log: {
        level: 'debug',
        logUncaughtException: true,
        pretty: true
    },
    asterisk: {
        host: 'localhost',
        username: 'asterisk',
        password: 'asterisk',
        application: 'conference'
    },
    respoke: {
        app_secret: 'XXX',
        app_id: 'YYY',
        endpoint: 'webrtc',
        endpoint_role_id: 'ZZZ'
    }
};
