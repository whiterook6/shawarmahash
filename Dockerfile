FROM node:24-alpine

WORKDIR /app

# Accept git hash as build argument
ARG GIT_HASH
ENV GIT_HASH=${GIT_HASH}

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source files
COPY . .

# Build the application
RUN yarn prod:build

# Expose the port the server runs on
EXPOSE 3000

# Start the server
CMD ["node", "output/index.js"]

