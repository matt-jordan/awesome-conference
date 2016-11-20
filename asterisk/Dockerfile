FROM debian:jessie

ARG PJSIP_PORT=5060

RUN useradd --system --uid 202 asterisk

RUN apt-get update -qq && \
	DEBIAN_FRONTEND=noninteractive \
	apt-get install -y --no-install-recommends \
		autoconf \
		build-essential \
		libedit-dev \
		libsrtp-dev \
		libjansson-dev \
		libogg-dev \
		libsqlite3-dev \
		libssl-dev \
		libxml2-dev \
		libxslt1-dev \
		uuid \
		uuid-dev \
		binutils-dev \
		libpopt-dev \
		libspandsp-dev \
		libvorbis-dev \
		libresample1-dev \
		libcurl4-openssl-dev \
		vim \
		curl \
		wget \
		xmlstarlet \
		python-dev \
		python-pip \
		&& \
	pip install j2cli && \
	apt-get purge -y --auto-remove && rm -rf /var/lib/apt/lists/*

ENV ASTERISK_VERSION=14.2.0-rc1
ENV RESPOKE_VERSION=v1.3.3

COPY build-asterisk.sh /usr/src/build/
COPY configs /usr/src/build/etc-asterisk/
COPY keys /usr/src/build/keys
COPY docker-entrypoint.sh /

RUN /usr/src/build/build-asterisk.sh

EXPOSE ${PJSIP_PORT}/udp 8088 5038

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["/usr/sbin/asterisk", "-f"]
