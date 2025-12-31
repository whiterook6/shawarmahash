FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source files
COPY . .

# Build the application
RUN yarn build

# Expose the port the server runs on
EXPOSE 3000

# Start the server
CMD ["node", "build/index.js"]

