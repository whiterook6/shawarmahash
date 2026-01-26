#!/bin/bash

# Script to generate SSL certificates using mkcert
# This creates locally-trusted certificates for HTTPS development

set -e

CERT_DIR="certs"
CERT_NAME="localhost"

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "Error: mkcert is not installed."
    echo ""
    echo "Install mkcert:"
    echo "  macOS: brew install mkcert"
    echo "  Linux: See https://github.com/FiloSottile/mkcert#linux"
    echo "  Windows: choco install mkcert"
    echo ""
    echo "After installing, run: mkcert -install"
    exit 1
fi

# Create certs directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Get local IP address (for access from other devices on network)
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
DOMAINS="localhost 127.0.0.1"

if [ -n "$LOCAL_IP" ]; then
    echo "Found local IP: $LOCAL_IP"
    DOMAINS="$DOMAINS $LOCAL_IP"
    echo "Certificates will be valid for: $DOMAINS"
else
    echo "Could not detect local IP. Certificates will be valid for: $DOMAINS"
    echo "To add your IP manually, edit this script or run mkcert manually:"
    echo "  mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 YOUR_IP"
fi

# Generate certificates
echo "Generating certificates..."
mkcert -key-file "$CERT_DIR/${CERT_NAME}-key.pem" -cert-file "$CERT_DIR/${CERT_NAME}.pem" $DOMAINS

echo ""
echo "✓ Certificates generated successfully!"
echo "  Certificate: $CERT_DIR/${CERT_NAME}.pem"
echo "  Private key: $CERT_DIR/${CERT_NAME}-key.pem"
echo ""
echo "To access from other devices on your network:"
echo "  1. Install mkcert on the other device"
echo "  2. Run 'mkcert -install' on the other device"
echo "  3. Copy the root CA certificate from:"
echo "     $(mkcert -CAROOT)/rootCA.pem"
echo "  4. Or use: mkcert -install -pkcs12 rootCA.pem"
echo ""
if [ -n "$LOCAL_IP" ]; then
    echo "Then access the app at: https://$LOCAL_IP:3000 (or https://localhost:3000)"
else
    echo "Then access the app at: https://localhost:3000"
    echo "To access from other devices, add your IP to the certificate (see instructions above)"
fi
