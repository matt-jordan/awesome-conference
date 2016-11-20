'use strict';
const err = require('./err');
const req = require('./req');
const channel = require('./channel');
const bridge = require('./bridge');
const bunyan = require('bunyan');

module.exports = {
    err,
    req,
    channel,
    bridge,
    res: bunyan.stdSerializers.res
};
