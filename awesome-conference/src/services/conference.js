'use strict'

const log = require('../lib/log');

/**
 * Our super awesome conference
 */
class Conference {

    constructor(respokeClient, ariClient) {
        let endpointsToChannels = {};
        let channelsToEndpoints = {};

        respokeClient.groups.join({groupId: 'conference'});
        respokeClient.on('pubsub', (message) => {
            if (message.message.messageType !== 'updateVideoSource') {
                return;
            }

            log.debug({respokeMessage: message.message}, 'Received');

            const endpointId = message.message.endpointId;
            const channel = endpointsToChannels[endpointId];

            if (!channel) {
                log.warn({endpointId}, 'Unable to find channel');
                return;
            }

            ariClient.bridges.list()
            .then(bridges => {
                const bridge = bridges.filter(candidate => candidate.name === 'awesome-conference');

                if (!bridge) {
                    return Promise.reject();
                }

                // There should be only one
                return bridge[0].setVideoSource({channelId: channel});
            });
        });

        function bridge_video_source_change(event, bridge) {
            const endpointId = channelsToEndpoints[bridge.video_source_id];

            if (!endpointId) {
                return;
            }

            respokeClient.groups.publish({
                groupId: 'conference',
                message: { messageType: 'videoSourceSet', endpointId }
            });
            log.info({bridge, endpointId}, `Video source is now ${endpointId} (${bridge.video_source_id})`);
        }

        function stasis_start_handler(event, channel) {
            channel.answer()
            .then(() => {
                return channel.getChannelVar({
                    variable: 'CHANNEL(remote)'
                }).then(variable => {
                    endpointsToChannels[variable.value] = channel.id;
                    channelsToEndpoints[channel.id] = variable.value;
                    log.info(`Participant ${variable.value} is ${channel.id}`);
                });
            })
            .then(() => {
                // Create or obtain the one and only conference bridge
                return ariClient.bridges.list();
            })
            .then(bridges => {
                const bridge = bridges.filter(candidate => candidate.name === 'awesome-conference');

                if (bridge.length === 0) {
                    log.info('Creating our awesome conference');

                    return ariClient.bridges.create({
                        type: 'mixing,dtmf_events',
                        name: 'awesome-conference'
                    });
                }
                return Promise.resolve(bridge[0]);
            })
            .then(bridge => {
                // Join the bridge!
                log.info({ channel, bridge }, 'Joining bridge');
                return bridge.addChannel({ channel: channel.id });
            });
        }

        function stasis_end_handler(event, channel) {
            log.info({channel}, 'Left app/bridge');
            const endpointId = channelsToEndpoints[channel.id];
            delete channelsToEndpoints[channel.id];
            delete endpointsToChannels[endpointId];
        }

        ariClient.on('StasisStart', stasis_start_handler);
        ariClient.on('StasisEnd', stasis_end_handler);
        ariClient.on('BridgeVideoSourceChanged', bridge_video_source_change);
    }
}

module.exports.Conference = Conference;
