'use strict';
const bunyan = require('bunyan');
const name = require('../../package.json').name;
const bformat = require('bunyan-format');
const serializers = require('./serializers');
const config = require('config');

function createLogger() {
    const { level, pretty, filePath: path } = config.log;

    if (level === 'silent') {
        return bunyan.createLogger({ name, streams: [] });
    }

    if (path) {
        return bunyan.createLogger({
            name,
            streams: [{ level, path }],
            serializers
        });
    }

    const stream = pretty ?
        bformat({ outputMode: 'short' }) :
        process.stdout;

    return bunyan.createLogger({
        name,
        streams: [{ level, stream }],
        serializers
    });
}

const log = createLogger();

if (config.log.logUncaughtException) {
    process.on('uncaughtException', err => {
        log.fatal({ err }, 'Uncaught exception');
        process.exit(1);
    });
}

module.exports = log;
