#!/bin/bash

PROGNAME=$(basename $0)
SOURCE_DIR="/usr/src/build"

MENUSELECT_DISABLE=(
    app_talkdetect app_adsiprog app_alarmreceiver
    app_amd app_chanisavail app_dictate app_externalivr app_festival
    app_getcpeid app_ices app_image app_minivm app_morsecode app_mp3
    app_nbscat app_sms app_test app_url app_waitforring app_waitforsilence
    app_zapateller cdr_custom cdr_manager cdr_syslog cdr_sqlite3_custom
    cel_custom cel_manager cel_sqlite3_custom chan_iax2 chan_alsa
    chan_console chan_mgcp chan_oss chan_phone chan_sip chan_skinny
    chan_unistim func_audiohookinherit pbx_ael pbx_dundi pbx_realtime
    res_fax res_ael_share res_fax_spandsp res_phoneprov
    res_pjsip_phoneprov_provider BUILD_NATIVE CORE-SOUNDS-EN-GSM
)

MENUSELECT_ENABLE=(
    BETTER_BACKTRACES res_endpoint_stats res_mwi_external res_stasis_mailbox
    res_ari_mailboxes codec_opus CORE-SOUNDS-EN-WAV CORE-SOUNDS-EN-ULAW
    EXTRA-SOUNDS-EN-WAV EXTRA-SOUNDS-EN-ULAW
)

if test -z ${ASTERISK_VERSION}; then
    echo "${PROGNAME}: ASTERISK_VERSION required" >&2
    exit 1
fi

set -ex

mkdir -p ${SOURCE_DIR}/asterisk
mkdir -p ${SOURCE_DIR}/cache
cd ${SOURCE_DIR}/asterisk

# Build Asterisk
curl -vsL http://downloads.asterisk.org/pub/telephony/asterisk/releases/asterisk-${ASTERISK_VERSION}.tar.gz |
    tar --strip-components 1 -xz

# 1.5 jobs per core works out okay
: ${JOBS:=$(( $(nproc) + $(nproc) / 2 ))}

./configure --with-resample --with-pjproject-bundled --with-externals-cache=${SOURCE_DIR}/cache
make menuselect/menuselect menuselect-tree menuselect.makeopts

for i in "${MENUSELECT_DISABLE[@]}"; do
    menuselect/menuselect --disable $i menuselect.makeopts
done

for i in "${MENUSELECT_ENABLE[@]}"; do
    menuselect/menuselect --enable $i menuselect.makeopts
done

make -j ${JOBS} all
make install

mkdir chan_respoke
cd chan_respoke
# Build chan_respoke
curl -vsL https://github.com/respoke/chan_respoke/releases/download/${RESPOKE_VERSION}/chan_respoke-${RESPOKE_VERSION}.tar.gz |
    tar --strip-components 1 -xz
make -j ${JOBS}
make install
cd ..

# copy config files into place
mkdir -p /etc/asterisk/
mkdir -p /etc/asterisk/keys
cp -a ${SOURCE_DIR}/etc-asterisk/* /etc/asterisk/
cp -a ${SOURCE_DIR}/keys/* /etc/asterisk/keys

chown -R asterisk:asterisk /var/*/asterisk
chown -R asterisk:asterisk /etc/asterisk
chmod a+r /etc/asterisk/keys
chown -R asterisk:asterisk /usr/sbin/asterisk
chown -R asterisk:asterisk /var/lib/asterisk/sounds
chmod -R 750 /var/spool/asterisk
