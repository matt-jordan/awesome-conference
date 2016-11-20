'use strict';

module.exports = function reqSerializer(req) {
    if (!req) {
        return req;
    }

    return {
        id: req.id,
        url: req.url,
        method: req.method,
        headers: req.headers,
        ip: req.ip,
        protocol: req.protocol || 'http'
    };
};
