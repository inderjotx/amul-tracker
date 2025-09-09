#!/bin/bash

# Build script for Amul Tracker Docker images
# This script builds and tags all Docker images for the application

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
PLATFORM="linux/amd64"


echo -e "${GREEN}Building Amul Tracker Docker Images${NC}"
echo -e "${YELLOW}Platform: ${PLATFORM}${NC}"
echo ""

# Function to build and tag image
build_and_tag() {
    local dockerfile=$1
    local image_name=$2
    local context=$3
    
    echo -e "${YELLOW}Building ${image_name}...${NC}"
    
    if [ -n "$context" ]; then
        docker build --platform "$PLATFORM" -f "$dockerfile" -t  "${REGISTRY}/${image_name}:latest" "$context"
    else
        docker build --platform "$PLATFORM" -f "$dockerfile" -t "${REGISTRY}/${image_name}:latest" .
    fi
    
    echo -e "${GREEN}✓ Built ${REGISTRY}/${image_name}:latest${NC}"
    echo -e "${GREEN}✓ Tagged ${REGISTRY}/${image_name}:latest${NC}"
    echo ""
}

# Build NextJS application image
build_and_tag "Dockerfile.nextjs" "$NEXTJS_IMAGE" "."

# Build Worker image
build_and_tag "Dockerfile.worker" "$WORKER_IMAGE" "."

# Build Cron job image
build_and_tag "Dockerfile.cron" "$CRON_IMAGE" "."

# Build Migration image
build_and_tag "Dockerfile.migration" "$MIGRATION_IMAGE" "."

echo -e "${GREEN}All images built successfully!${NC}"
echo ""
echo -e "${YELLOW}Images created:${NC}"
echo -e "  ${REGISTRY}/${NEXTJS_IMAGE}:latest"
echo -e "  ${REGISTRY}/${WORKER_IMAGE}:latest"
echo -e "  ${REGISTRY}/${CRON_IMAGE}:latest"
echo -e "  ${REGISTRY}/${MIGRATION_IMAGE}:latest"
echo -e "  ${REGISTRY}/${NEXTJS_IMAGE}:latest"
echo -e "  ${REGISTRY}/${WORKER_IMAGE}:latest"
echo -e "  ${REGISTRY}/${CRON_IMAGE}:latest"
echo -e "  ${REGISTRY}/${MIGRATION_IMAGE}:latest"
echo ""

# Optional: Push to registry
echo -e "${YELLOW}Pushing images to registry...${NC}"
docker push "${REGISTRY}/${NEXTJS_IMAGE}:latest"
docker push "${REGISTRY}/${WORKER_IMAGE}:latest"
docker push "${REGISTRY}/${CRON_IMAGE}:latest"
docker push "${REGISTRY}/${MIGRATION_IMAGE}:latest"
echo -e "${GREEN}All images pushed successfully!${NC}"
echo -e "${GREEN}Build completed!${NC}"
