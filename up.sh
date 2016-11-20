#!/bin/sh

# If you aren't running Linux, use an alternative means to get the primary
# address of your machine
export EXTERNAL_IP=$(ip route get 8.8.8.8 | head -1 | cut -d' ' -f8)
docker-compose up --build
