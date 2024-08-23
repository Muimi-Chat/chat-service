# Only for windows, to resolve CRLF to LF
FROM node:20.16

COPY ./ /app

RUN sed -i 's/\r$//' /app/migration-helper.sh

WORKDIR /app
