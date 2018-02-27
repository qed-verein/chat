#!/usr/bin/env bash

# Copyright (C) 2004-2018 Quod Erat Demonstrandum e.V. <webmaster@qed-verein.de>
#
# This file is part of QED-Chat.
#
# QED-Chat is free software: you can redistribute it and/or modify it
# under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# QED-Chat is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public
# License along with QED-Chat.  If not, see
# <http://www.gnu.org/licenses/>.

#######################################  # # #
#######################################  # # #
### THIS IS A TESTING ONLY SETUP!!! ###  # # #
#######################################
#######################################  # # #

# TODO: Maybe use arguemt for this (all of this)
# We would also need to adjust the config accordingly (maybe use sed)
export PASSWORD_MYSQL=0nL9a3nR8sV5ODtQfNs463ssKLpo19Lf

export MYSQL_CONTAINER_NAME=mysql_chat
export CHAT_CONTAINER_NAME=chat

export CHAT_NETWORK_NAME=chat_net

if [ -z ${CHAT_HTTP_PORT} ];
then export CHAT_HTTP_PORT=5000;
fi;

if [[ $EUID -ne 0 ]]; then
   echo "This script normally needs root"
fi

echo "Setting up networking..."
if [ ! "$(docker network ls | grep $CHAT_NETWORK_NAME)" ]; then
    docker network create --driver bridge $CHAT_NETWORK_NAME
fi

echo "Cleaning up old containers..."
docker stop $MYSQL_CONTAINER_NAME
docker rm $MYSQL_CONTAINER_NAME
docker stop $CHAT_CONTAINER_NAME
docker rm $CHAT_CONTAINER_NAME

echo "Starting mysql server..."
docker run -d --name=$MYSQL_CONTAINER_NAME --restart=always --network=$CHAT_NETWORK_NAME \
    -e MYSQL_ROOT_PASSWORD=$PASSWORD_MYSQL -e MYSQL_DATABASE=chat mariadb:10.1 \
    --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

echo "Building chat container..."
docker build . -t qed/chat

echo "Waiting for mysql server startup..."
sleep 20

# TODO: Maybe replace this with "Initializing a fresh instance" on https://hub.docker.com/_/mariadb/
echo "Preparing database..."
docker exec -i $MYSQL_CONTAINER_NAME mysql -u root -p$PASSWORD_MYSQL chat < schema.sql
docker exec -i $MYSQL_CONTAINER_NAME mysql -u root -p$PASSWORD_MYSQL chat < .docker/sampledata.sql

echo "Starting chat..."
docker run -d --name=$CHAT_CONTAINER_NAME --restart=always --network=$CHAT_NETWORK_NAME -p $CHAT_HTTP_PORT:80 qed/chat
