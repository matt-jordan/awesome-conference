'use strict';

module.exports = function bridgeSerializer(bridge) {
    if (!bridge) {
        return bridge;
    }

    return {
        id: bridge.id,
        name: bridge.name,
        video_source: bridge.video_source_id
    };
};
