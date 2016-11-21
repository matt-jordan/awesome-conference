# Asterisk "Awesome Conference"

An awesome conference, consisting of:
* An [Asterisk](http://asterisk.org)/ARI driven video conferencing application
* A [Respoke](https://www.respoke.io) driven WebRTC client

To run the awesome conference, you will need a valid [Respoke](https://www.respoke.io) account.

## Asterisk/ARI

Asterisk is deployed in a Docker container bound to the host network. The configuration of Asterisk is static, and all relevant configuration bits as well as control of the ARI application is done by the remote application implemented in `awesome-conference`.

The ARI application will toss all inbound Respoke WebRTC channels into a mixing bridge. The mixing bridge, by default, will relay the active speaker's video stream to the other participants. If a signal is received from a participant to lock onto a particular video source, then the video stream in the bridge will be set to that participant. 

## Respoke

The Respoke client displays the video stream from the conference, along with small pictures of all of the participants in the conference. The pictures of the participants update periodically. If a picture is selected, the video stream is switched to that participant.

# Configuration

Because Docker is used to build and run the services, all configuration of the services is done via environment variables passed into the Docker container. Configuration for your deployment should be done in the `docker-compose.yml` file.

## Mandatory Configuration

### `awesome-conference`

* `APP_SECRET`: Your Respoke App Secret
* `APP_ID`: Your Respoke App ID
* `ENDPOINT_ROLE_ID`: A role ID that you've created for you application. The role should have full Global Group Permissions and full Event permissions.

## Optional Configuration

### `asterisk`

* `APPLICATION_NAME`: The name of the Respoke application.
* `ARI_PASSWORD`: Our ARI password. Change this if you want to be secure, leave it as is to live dangerously.
* `RESPOKE_ENDPOINT`: The name of the Respoke endpoint Asterisk uses that other clients will establish a call to.

### `awesome-conference`

* `PORT`: The port the conference runs on. Defaults to `3000`.
* `HOST`: The external IP address that we advertise. This should be provided automatically by the `up.sh` script.
* `APPLICATION_NAME`: The name of the Respoke application.
* `ARI_PASSWORD`: Our ARI password. Change this if you want to be secure, leave it as is to live dangerously.
* `RESPOKE_ENDPOINT`: The name of the Respoke endpoint Asterisk uses that other clients will establish a call to.

# Building/Running

This project uses [Docker-Compose](https://docs.docker.com/compose/) for fun, profit, and/or pain. Because we have to pass in the determined external IP address, it is recommended that you use the `up.sh` script to invoke the services.

```
$ ./up.sh
```

# Notes

* The project assumes your Respoke application is in development mode, despite asking for a `ENDPOINT_ROLE_ID`. That should probably be fixed.
* My CSS skills are abysmal. In my defense, I copied most of it from Jeff Parrish's awesome [YoDude](https://github.com/respoke/yodude).
* It should go without saying that this is a demo application. Take everything with a healthy dose of skepticism. You should also assume that just about everything is not as secure as it should be.
* The certificate used is self-signed.
* New participants won't be informed of the current video source. Making that function is an exercise for the reader.
* If your picture box remains gray, then for some reason, the client application couldn't grab the webcam. Refresh.
* No video is provided when there is only one participant.
