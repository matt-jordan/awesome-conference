'use strict';

const Respoke = require('respoke-admin');
const log = require('../lib/log');

class RespokeWrapper {

    constructor(config) {
        this.app_id = config.respoke.app_id;
        this.app_secret = config.respoke.app_secret;
        this.endpoint_role_id = config.respoke.endpoint_role_id;
        this.client = null;
    }

    connect() {
        let that = this;

        if (this.client) {
            return Promise.reject('Client already connected');
        }

        log.info('Connecting to Respoke');

        return new Promise(resolve => {
            that.client = new Respoke({
                appId: that.app_id,
                'App-Secret': that.app_secret,
                autoreconnect: true
            });
            that.client.auth.connect({ endpointId: 'backend' });
            that.client.on('connect', () => {
                log.info('Connected to Respoke');
                resolve(that.client);
            });
        });
    }

    register_endpoint(endpointId) {
        const that = this;

        if (!this.client) {
            return Promise.reject('Client not connected');
        }

        return this.client.auth.endpoint({
            endpointId,
            roleId: that.endpoint_role_id
        }).then( authData => {
            log.info(`Providing auth for endpoint ${endpointId}`)
            return Promise.resolve({
                appId: that.app_id,
                tokenId: authData.tokenId
            });
        });
    }
}

module.exports.RespokeWrapper = RespokeWrapper;
