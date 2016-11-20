'use strict';
const bunyan = require('bunyan');

module.exports = function errSerializer(err) {
    if (typeof err === 'string') {
        return { message: err };
    }

    const result = bunyan.stdSerializers.err(err);

    // log any enumerable properties not grabbed by bunyan
    if (err && (typeof err === 'object')) {
        Object.keys(err).forEach(key => {
            if (key !== 'error@context' && {}.hasOwnProperty.call(result, key)) {
                result[key] = err[key];
            }
        });
    }

    return result;
};
