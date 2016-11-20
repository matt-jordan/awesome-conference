'use strict'

const log = require('../lib/log');
const ari = require('ari-client');

/**
 * Class for managing an Asterisk instance
 */
class AsteriskWrapper {

    /**
     * Manage our Asterisk instance
     *
     * @param {object} [config]
     */
    constructor(config) {
        this.url = `http://${config.asterisk.host}:8088`;
        this.username = config.asterisk.username;
        this.password = config.asterisk.password;
        this.appname = config.asterisk.application;
        this.app_secret = config.respoke.app_secret;
        this.endpoint = config.respoke.endpoint;
        this.client = undefined;
    }

    /**
     * Connect to the Asterisk instance
     *
     * @returns {Promise.<ari.Client>}
     */
    connect() {
        const that = this;

        if (this.client) {
            return Promise.reject('Client already connected');
        }

        log.debug({ url: this.url }, 'Connecting to Asterisk');

        return ari.connect(this.url, this.username, this.password)
        .then(_client => {
            that.client = _client;
            return _client;
        });
    }

    /**
     * Set up the Asterisk instance's Respoke information
     *
     * @returns {Promise}
     */
    provision() {
        if (!this.client) {
            return Promise.reject('Not connected to Asterisk!');
        }

        return this.client.asterisk.updateObject({
            configClass: 'res_respoke',
            objectType: 'app',
            id: `${this.appname}`,
            fields: [
                { attribute: 'app_secret', value: `${this.app_secret}`}
            ]
        }).then(() => {
            return this.client.asterisk.updateObject({
                configClass: 'res_respoke',
                objectType: 'endpoint',
                id: `${this.endpoint}`,
                fields: [
                    { attribute: 'app', value: `${this.appname}` },
                    { attribute: 'context', value: 'inbound' },
                    { attribute: 'transport', value: `${this.endpoint}` },
                    { attribute: 'turn', value: 'true' },
                    { attribute: 'allow', value: '!all,opus,ulaw,h264' },
                    { attribute: 'dtls_verify', value: 'no' },
                    { attribute: 'dtls_cert_file', value: '/etc/asterisk/keys/asterisk.pem' },
                    { attribute: 'dtls_ca_file', value: '/etc/asterisk/keys/ca.crt' },
                    { attribute: 'dtls_setup', value: 'actpass' }
                ]});
        }).then(() => {
            return this.client.asterisk.updateObject({
                configClass: 'res_respoke',
                objectType: 'endpoint',
                id: 'anonymous',
                fields: [
                    { attribute: 'app', value: `${this.appname}` },
                    { attribute: 'context', value: 'inbound' },
                    { attribute: 'transport', value: `${this.endpoint}` },
                    { attribute: 'turn', value: 'true' },
                    { attribute: 'allow', value: '!all,opus,ulaw,h264' },
                    { attribute: 'dtls_verify', value: 'no' },
                    { attribute: 'dtls_cert_file', value: '/etc/asterisk/keys/asterisk.pem' },
                    { attribute: 'dtls_ca_file', value: '/etc/asterisk/keys/ca.crt' },
                    { attribute: 'dtls_setup', value: 'actpass' },
                    { attribute: 'register', value: 'false' }
                ]});
        });
    }

    /**
     * Connect the Conferencing Application
     *
     * @returns {Promise<Client>}
     */
    connectConferenceApp() {
        const that = this;

        if (!this.client) {
            return Promise.reject('Not connected to Asterisk!');
        }

        this.client.on('WebSocketMaxRetries', err => {
            log.fatal({ err }, 'ARI Disconnected');
            // Exit so that the whole process will reconnect
            process.exit(1);
        });
        this.client.on('WebSocketReconnecting', err => {
            log.warn({ err }, 'WebSocket Reconnecting');
        });
        this.client.on('WebSocketConnected', err => {
            log.info({ err }, 'WebSocket Connected');
        });

        return this.client.start([ this.appname ])
        .then(() => {
            log.info(`ARI application ${this.appname} registered`);

            return this.client;
        });
    }

}

module.exports.AsteriskWrapper = AsteriskWrapper;
