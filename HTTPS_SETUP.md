# HTTPS Setup Guide

This guide explains how to set up HTTPS for local development so you can use `subtle.crypto` from browsers on other devices on your WiFi network.

## Quick Start

1. **Install mkcert** (if not already installed):
   ```bash
   # macOS
   brew install mkcert
   
   # Linux (see https://github.com/FiloSottile/mkcert#linux)
   # Windows: choco install mkcert
   ```

2. **Install the local CA**:
   ```bash
   mkcert -install
   ```

3. **Generate certificates**:
   ```bash
   ./scripts/generate-certs.sh
   ```

4. **Start your servers**:
   ```bash
   # Terminal 1: Start the backend server
   cd server
   node output/index.js
   
   # Terminal 2: Start the frontend dev server
   cd webui
   yarn run dev
   ```

The servers will automatically detect the certificates and use HTTPS. You'll see:
- Backend: `🚀 Server running on https://0.0.0.0:3000`
- Frontend: Vite will serve on `https://localhost:5173` (or similar)

## Accessing from Another Device

To access the app from another laptop on your WiFi:

1. **Find your local IP address**:
   ```bash
   # macOS/Linux
   ipconfig getifaddr en0  # or en1
   
   # Or check in System Preferences > Network
   ```

2. **Install mkcert on the other device** and run `mkcert -install`

3. **Access the app**:
   - Frontend: `https://YOUR_IP:5173` (or whatever port Vite uses)
   - Backend API: `https://YOUR_IP:3000`

   Note: The certificate script automatically includes your local IP if detected.

## Docker Compose

When using Docker Compose, certificates are automatically mounted if they exist in the `certs/` directory:

```bash
# Generate certificates first
./scripts/generate-certs.sh

# Then start with docker-compose
docker-compose up
```

The server will automatically use HTTPS if certificates are found.

## Troubleshooting

### Certificate not found
- Make sure you've run `./scripts/generate-certs.sh`
- Check that `certs/localhost.pem` and `certs/localhost-key.pem` exist

### Browser shows certificate warning
- Make sure you've run `mkcert -install` on your machine
- On other devices, you need to install mkcert and run `mkcert -install` there too

### Can't access from other device
- Check firewall settings
- Verify you're using the correct IP address
- Make sure the certificate was generated with your IP (the script tries to detect it automatically)

### Vite proxy errors
- The Vite config automatically detects certificates and proxies to HTTPS
- If you see proxy errors, make sure both frontend and backend are using HTTPS
