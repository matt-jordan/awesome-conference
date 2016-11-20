'use strict';

module.exports = function channelSerializer(channel) {
    if (!channel) {
        return channel;
    }

    return {
        id: channel.id,
        name: channel.name
    };
};
