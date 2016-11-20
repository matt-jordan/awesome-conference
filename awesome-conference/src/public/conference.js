/* global angular */
/* global respoke */
/* global Webcam */
'use strict';

var GROUP_NAME = 'conference';

var conference = angular.module('conference', ['ngResource']);

function noop() {}

function uid() {
    return Math.random().toString(36).substring(2, 6);
}

function resetVideos() {
    var vids = document.querySelectorAll('video');
    var vid;
    var newVid;
    var parent;
    for (var i = 0; i < vids.length; i++) {
        vid = vids.item(i);
        if (vid.id) {
            newVid = document.createElement('video');
            newVid.id = vid.id;
            parent = vid.parentNode;
            parent.removeChild(vid);
            parent.appendChild(newVid);
        }
    }
}

conference.controller('AppController', ['$rootScope', function ($rootScope) {
    $rootScope.people = {};
    $rootScope.videoSource = null;
    $rootScope.people[$rootScope.myEndpoint] = '';

	$rootScope.startCall = function () {
		$rootScope.activeCall = $rootScope.client.startVideoCall({
			endpointId: 'webrtc',
			videoRemoteElement: document.getElementById('video-remote'),
			onConnect: function () {
				console.log('Connected!');
			},
			onHangup: function () {
				console.log('Hungup');
				$rootScope.activeCall = null;
				resetVideos();
			},
			onError: function (err) {
				console.error('Error: ' + err);
				$rootScope.activeCall = null;
				resetVideos();
			}
		})
	};

	$rootScope.setVideoSource = function (endpointId) {
        var group = $rootScope.client.getGroup({ id: GROUP_NAME });
        if (!group) { return; } // wha...

        group.sendMessage({
            message: { messageType: 'updateVideoSource', endpointId: endpointId },
            onError: function (err) { console.error(err); }
        });
    };

    $rootScope.getPersonClass = function (endpointId) {
        if (endpointId !== $rootScope.videoSource) {
            return 'person';
        }
        return 'videoSource';
    };
}]);

conference.directive('pic', [function () {
    return {
        scope: {
            base64: '='
        },
        template: '<img ng-src="{{ base64 }}" class="img" />'
    };
}]);

conference.directive('camera', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
    return {
        link: function (/*scope, el*/) {
            Webcam.set({
                width: 160,
                height: 120,
                dest_width: 160,
                dest_height: 120,
                image_format: 'jpeg',
                jpeg_quality: 32,
                force_flash: false,
                flip_horiz: false
            });
            Webcam.attach('my-camera');
            Webcam.on('live', function () {
                setInterval(function () {

                    var group = $rootScope.client.getGroup({ id: GROUP_NAME });
                    if (!group) { return; } // respoke not connected

                    Webcam.snap(function (dataUri) {
                        $rootScope.people[$rootScope.myEndpoint] = dataUri;
                        group.sendMessage({
                            message: { messageType: 'imageUpdate', image: dataUri},
                            onError: function (err) { console.error(err); }
                        });
                    });

                    $timeout(noop);
                }, 2500);
            });
            Webcam.on('error', function (err) {
                console.error('Webcamjs Error:', err);
            });
        },
        template: '<div id="my-camera"></div>'
    };
}]);

conference.run(['$rootScope', '$timeout', "$resource", function ($rootScope, $timeout, $resource) {
    // respoke.log.setLevel('debug');

    var myEndpoint = uid();
    $rootScope.myEndpoint = myEndpoint;
    localStorage.setItem('endpointId', myEndpoint);

    var Tokens = $resource('/token');
    var token = Tokens.get({endpointId: myEndpoint}, function (authData) {
        console.log(authData);

        var client = respoke.createClient({
            developmentMode: true,
            appId: authData.appId
        });

        client.listen('error', function (err) {
            console.error(err);
        });

        client.listen('message', function (data) {
            var imageContents = data.message.message.image;
            var endpointId = data.message.endpointId;
            var messageType = data.message.message.messageType;

            if (messageType === 'imageUpdate' && endpointId !== 'backend') {
                if (!imageContents || !endpointId) {
                    console.error('No endpointId or imageContents!');
                    return;
                }

                $rootScope.people[endpointId] = imageContents;
            } else if (messageType === 'videoSourceSet') {
                $rootScope.videoSource = data.message.message.endpointId;
                console.log('Video source is now: ' + $rootScope.videoSource);
            }

            $timeout(noop);
        });

        client.listen('connect', function () {
            client.join({
                id: GROUP_NAME,
                onSuccess: function (group) {
                    console.log('Joined', group);
                    group.getMembers().then(function (connections) {
                        connections.forEach(function (member) {
                            console.log('Already here', member);
                            if (member.endpointId !== 'backend') {
                                $rootScope.people[member.endpointId] = '';
                            }
                        });
                        $timeout(noop);
                    });
                },
                onJoin: function (data) {
                    var endpointId = data.connection.endpointId;

                    if (endpointId === 'backend') {
                        return;
                    }

                    $rootScope.people[endpointId] = '';
                    $timeout(noop);
                },
                onLeave: function (data) {
                    var endpointId = data.connection.endpointId;

                    if (endpointId === 'backend') {
                        return;
                    }

                    $rootScope.people[endpointId] = null;
                    delete $rootScope.people[endpointId];
                    $timeout(noop);
                }
            });
            $rootScope.startCall();
        });

        client.connect({
            endpointId: myEndpoint
        });

        $rootScope.client = window.client = client;

    });

}]);