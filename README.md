# ShawarmaHash

A blockchain-based game where players mine blocks on team-specific chains. This document explains the block structure, mining process, difficulty adjustment, and available APIs.

## Building and Running

This project follows a common pattern for full-stack applications:

- **Monorepo structure**: Separate `server/` and `webui/` directories with their own `package.json` files
- **Development**: Frontend (Vite) and backend (Node.js) run separately with the frontend proxying API requests
- **Production**: Frontend is built to static files, and the backend serves both the API and static frontend files
- **Docker**: Multi-stage build optimizes image size by separating build and runtime dependencies

This approach allows for:
- Fast development with hot reload for both frontend and backend
- Optimized production builds with tree-shaking and minification
- Single deployment unit (the server) that serves everything
- Easy containerization with Docker

### Prerequisites

- Node.js 20+ and Yarn
- For Docker: Docker and Docker Compose

### Environment Variables

The server requires the following environment variables (set in `server/.env` or via Docker):

- `NODE_ENV`: Either `"development"` or `"production"` (required)
- `IDENTITY_SECRET`: Secret key for identity token generation (required)
- `GIT_HASH`: Git commit hash (optional, defaults to "not set")
- `WEBUI_DIST_PATH`: Path to webui dist directory (optional, only needed for custom deployments)

### Development Mode

#### Running the WebUI in Development

The webui uses Vite for development with hot module replacement and proxying to the backend:

```bash
cd webui
yarn install
yarn dev
```

This will start the Vite dev server (typically on `http://localhost:5173`) with API requests proxied to `http://localhost:3000`. You'll probably see error HTTP responses if the API server itself isn't also running on :3000. See the next section:

#### Running the Server in Development

In a separate terminal:

```bash
cd server
yarn install

# Create .env file with required variables
cp .env.sample .env
# Edit .env and set IDENTITY_SECRET, NODE_ENV, etc.

# Build in development mode
yarn dev:build

# Run the server
node output/index.js
```

The server will start on `http://localhost:3000`.

### Production Build

#### Building the WebUI

```bash
cd webui
yarn install
yarn build
```

This creates a production build in `webui/dist/` that can be served statically.

#### Building the Server

```bash
cd server
yarn install

# Create .env file with required variables
cp .env.sample .env
# Edit .env and set IDENTITY_SECRET, NODE_ENV=production, etc.

# Build for production
yarn prod:build
```

This creates a production build in `server/output/` with bundled and minified code.

#### Running the Server in Production

After building both webui and server:

```bash
cd server
node output/index.js
```

The server will:
- Serve API endpoints at `/api/*`
- Serve the built webui from `webui/dist/` at the root path
- Store chain data in `server/data/` directory (relative to where the server runs)

**Note:** The server expects the `webui/dist` directory to be at `../../webui/dist` relative to the built server output, or you can set `WEBUI_DIST_PATH` environment variable to specify a custom path.

### Docker

#### Building the Docker Image

```bash
# Build with default git hash
docker build -t shawarmahash .

# Build with specific git hash
docker build --build-arg GIT_HASH=$(git rev-parse HEAD) -t shawarmahash .
```

#### Running with Docker Compose (Recommended)

1. Create a `.env` file in the project root (or set environment variables):

```bash
IDENTITY_SECRET=your-secret-key-here
GIT_HASH=$(git rev-parse HEAD)  # Optional
```

2. Start the container:

```bash
docker-compose up -d
```

3. View logs:

```bash
docker-compose logs -f
```

4. Stop the container:

```bash
docker-compose down
```

The data volume (`shawarmahash-data`) will persist chain data between container restarts.

#### Running with Docker (Manual)

```bash
# Create a directory for data persistence
mkdir -p ./data

# Run the container
docker run -d \
  --name shawarmahash \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e NODE_ENV=production \
  -e IDENTITY_SECRET=your-secret-key-here \
  -e GIT_HASH=$(git rev-parse HEAD) \
  shawarmahash
```

#### Docker Features

- **Multi-stage build**: Optimized image size by building webui and server separately
- **Data persistence**: Chain data is stored in a Docker volume (`shawarmahash-data`) or mounted directory
- **Health checks**: Built-in health check endpoint
- **Production ready**: Includes all optimizations for production deployment

The Docker image:
- Builds both webui and server in separate stages
- Copies the built artifacts into a minimal runtime image
- Serves the webui statically from the Fastify server
- Persists chain data to `/app/data` (mapped to a volume)

## Development

### Project Structure
- `server/`: Backend server implementation
  - `src/block/`: Block structure and utilities
  - `src/chain/`: Chain validation and management
  - `src/miner/`: Mining logic
  - `src/difficulty/`: Difficulty calculation
  - `src/game/`: Game state management
  - `src/server/`: HTTP server and API routes
- `webui/`: Frontend web interface

### Key Constants
- **Genesis Previous Hash**: `"ffffffffffffffffffffffffffffffff"`
- **Default Difficulty**: `"fffff000000000000000000000000000"` (5.0)
- **Min Difficulty**: `0`
- **Max Difficulty**: `32`
- **Hash Length**: `32` hex characters (128 bits)
- **Difficulty Adjustment Window**: `100` blocks
