# Base will install runtime dependencies and configure generics
FROM node:22-slim as base

LABEL maintainer="Marko Kajzer <markokajzer91@gmail.com>, Nico Stapelbroek <discord-soundbot@nstapelbroek.com>"

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

# Add `tiny` init for signal forwarding
RUN apt-get -qq update > /dev/null && \
    apt-get -qq -y install wget > /dev/null && \
    rm -rf /var/lib/apt/lists
RUN wget -qO /tini https://github.com/krallin/tini/releases/download/v0.19.0/tini-$(dpkg --print-architecture) && \
    chmod +x /tini

####################################################################################################

# Builder will install system dependencies
FROM base as builder

# Install ffmpeg and other deps
RUN apt-get -qq update > /dev/null && \
    apt-get -qq -y install git g++ make python3.11 ffmpeg tar xz-utils > /dev/null && \
    rm -rf /var/lib/apt/lists

####################################################################################################

# Build will compile ts to js
FROM builder AS build

# Copy files
COPY --chown=node:node . /app

# Install compile dependencies
RUN npm install && \
    npm cache clean --force

# Build project
RUN npm run build

####################################################################################################

# release has the bare minimum to run the application
FROM base as release

# Install ffmpeg in release stage for proper library dependencies
RUN apt-get -qq update > /dev/null && \
    apt-get -qq -y install ffmpeg > /dev/null && \
    rm -rf /var/lib/apt/lists

COPY --from=build --chown=node:node /app .

USER node
ENV NODE_ENV=production
ENTRYPOINT ["/tini", "--"]
CMD ["npm", "run", "serve"]
