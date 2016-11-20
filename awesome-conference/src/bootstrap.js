'use strict';
const config = require('config');
const express = require('express');
const session = require('express-session');
const path = require('path');
const uuid = require('uuid');
const asterisk = require('./services/asterisk');
const conference = require('./services/conference');
const respoke = require('./services/respoke');

function boot() {
    return new Promise(resolve => {
        const app = express();
        let respokeWrapper;

        app.set('x-powered-by', false);
        app.set('trust proxy', true);

        app.use(express.static(path.join(__dirname, 'public')));

        app.use(session({
            secret: uuid.v4(),
            cookie: {},
            resave: false,
            saveUninitialized: false
        }));

        app.get('/token', (req, res, next) => {
            if (!req.query.endpointId) {
                let err = new Error(`Missing required query param 'endpointId'`);
                err.status = 400;
                next(err);
            }

            if (respokeWrapper) {
                respokeWrapper.register_endpoint(req.query.endpointId)
                .then( authToken => {
                    res.json(authToken);
                });
            } else {
                res.sendStatus(500);
            }
        });

        app.use((req, res, next) => {
            let err = new Error(`Not Found: ${req.url}`);
            err.status = 404;
            next(err);
        });

        const asteriskWrapper = new asterisk.AsteriskWrapper(config);
        asteriskWrapper.connect()
        .then(() => {
            return asteriskWrapper.provision();
        })
        .then(() => {
            respokeWrapper = new respoke.RespokeWrapper(config);
            let respokeClient;

            return respokeWrapper.connect()
            .then((_respokeClient) => {
                respokeClient = _respokeClient;

                return asteriskWrapper.connectConferenceApp();
            })
            .then(ariClient => {
                const conf = new conference.Conference(respokeClient, ariClient);

                resolve(app);
            });
        });
    });
}

module.exports = { boot };
