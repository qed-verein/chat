# THIS IS A TESTING ONLY SETUP!!!

FROM debian:stretch

ENV DEBIAN_FRONTEND noninteractive 
RUN apt-get update && apt-get install -y \ 
    build-essential \
    libmariadbclient-dev \
    libpq-dev \
    ruby \ 
    ruby-dev \ 
    rubygems \
    apache2 \
    ruby-eventmachine \
    ruby-sequel \
    ruby-json \
    ruby-mysql2 && \
    gem update && \
    gem install websocket && \
    a2enmod proxy && \
    a2enmod proxy_wstunnel && \
    a2enmod proxy_scgi

ADD . /code
WORKDIR /code

COPY .docker/rubychat-config.TESTINGONLY.rb /etc/chat/rubychat-config.rb
COPY .docker/000-default.conf /etc/apache2/sites-enabled/

COPY .docker/docker_start.sh .
RUN chmod u+x docker_start.sh

COPY public_html/ /www
RUN chown www-data.www-data -R /www

EXPOSE 80

CMD [ "./docker_start.sh" ]