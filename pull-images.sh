#!/bin/bash

# Pull script for Amul Tracker Docker images
# This script pulls the latest Docker images from the registry

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Docker registry and image names
REGISTRY="inderharrysingh"
NEXTJS_IMAGE="amul-nextjs"
WORKER_IMAGE="amul-worker"
CRON_IMAGE="amul-cron"
MIGRATION_IMAGE="amul-migration"

echo -e "${GREEN}Pulling Amul Tracker Docker Images${NC}"
echo ""

# Function to pull image
pull_image() {
    local image_name=$1
    
    echo -e "${YELLOW}Pulling ${image_name}...${NC}"
    
    if docker pull "${REGISTRY}/${image_name}:latest"; then
        echo -e "${GREEN}✓ Pulled ${REGISTRY}/${image_name}:latest${NC}"
    else
        echo -e "${RED}✗ Failed to pull ${REGISTRY}/${image_name}:latest${NC}"
        exit 1
    fi
    echo ""
}

# Pull NextJS application image
pull_image "$NEXTJS_IMAGE"

# Pull Worker image
pull_image "$WORKER_IMAGE"

# Pull Cron job image
pull_image "$CRON_IMAGE"

# Pull Migration image
pull_image "$MIGRATION_IMAGE"

echo -e "${GREEN}All images pulled successfully!${NC}"
echo ""
echo -e "${YELLOW}Images pulled:${NC}"
echo -e "  ${REGISTRY}/${NEXTJS_IMAGE}:latest"
echo -e "  ${REGISTRY}/${WORKER_IMAGE}:latest"
echo -e "  ${REGISTRY}/${CRON_IMAGE}:latest"
echo -e "  ${REGISTRY}/${MIGRATION_IMAGE}:latest"
echo ""

# Optional: Show image sizes
if [ "$1" = "--show-sizes" ]; then
    echo -e "${YELLOW}Image sizes:${NC}"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep "$REGISTRY"
    echo ""
fi

echo -e "${GREEN}Pull completed!${NC}"
