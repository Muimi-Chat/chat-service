# Only for windows, to resolve CRLF to LF
FROM node:20.18.1

COPY ./ /app

RUN sed -i 's/\r$//' /app/migration-helper.sh

WORKDIR /app
