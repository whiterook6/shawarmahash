# Multi-stage Dockerfile for ShawarmaHash

# Stage 1: Build WebUI
FROM node:20-alpine AS webui-builder
WORKDIR /app/webui

# Copy webui package files
COPY webui/package.json webui/yarn.lock ./

# Install webui dependencies
RUN yarn install --frozen-lockfile

# Copy webui source
COPY webui/ ./

# Build webui for production
RUN yarn build

# Stage 2: Build Server
FROM node:20-alpine AS server-builder
WORKDIR /app/server

# Copy server package files
COPY server/package.json server/yarn.lock ./

# Install server dependencies
RUN yarn install --frozen-lockfile

# Copy server source
COPY server/ ./

# Build server for production
# GIT_HASH will be set at build time or default to "docker-build"
ARG GIT_HASH=docker-build
ENV GIT_HASH=${GIT_HASH}
RUN yarn prod:build

# Stage 3: Final Runtime Image
FROM node:20-alpine
WORKDIR /app

# Install only production dependencies for server
COPY server/package.json server/yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copy built server from builder
COPY --from=server-builder /app/server/output ./output

# Copy built webui from builder
COPY --from=webui-builder /app/webui/dist ./webui/dist

# Create non-root user and set up directories
# Use UID/GID 1001 to avoid conflicts with existing system groups
RUN addgroup -g 1001 nodeuser && \
    adduser -D -u 1001 -G nodeuser nodeuser && \
    mkdir -p /app/data && \
    chown -R nodeuser:nodeuser /app

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3000

# Set environment variables (can be overridden)
ENV NODE_ENV=production
ENV GIT_HASH=docker-build
ENV WEBUI_DIST_PATH=/app/webui/dist

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the server
CMD ["node", "output/index.js"]
