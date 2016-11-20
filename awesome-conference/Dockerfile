FROM node:6

RUN useradd --system --uid 202 asterisk && \
	mkdir -p /home/asterisk && \
	mkdir -p /usr/src/app && \
	chown -R asterisk:asterisk /home/asterisk && \
    chown -R asterisk:asterisk /usr/src/app && \
    wget -O /usr/local/bin/dumb-init \
      https://github.com/Yelp/dumb-init/releases/download/v1.1.3/dumb-init_1.1.3_amd64 && \
    chmod +x /usr/local/bin/dumb-init

USER asterisk
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

EXPOSE 3000

ENTRYPOINT [ "/usr/local/bin/dumb-init", "--"]
CMD [ "node", "app.js" ]
