#!bin/bash
echo "Building worker"
docker buildx build  --platform linux/amd64 --load  --provenance=false -t aws-worker:latest --file Dockerfile.aws.worker  .

echo "Tagging worker"
docker tag aws-worker:latest 944599182924.dkr.ecr.ap-south-1.amazonaws.com/amul-worker:latest                                                                                                                        ─╯

echo "Pushing worker"
docker push 944599182924.dkr.ecr.ap-south-1.amazonaws.com/amul-worker:latest

echo "-----------"

echo "Building tracker"
docker buildx build  --platform linux/amd64 --load  --provenance=false -t aws-tracker:latest --file Dockerfile.aws.cron .

echo "Tagging tracker"
docker tag aws-tracker:latest 944599182924.dkr.ecr.ap-south-1.amazonaws.com/amul-tracker:latest                                                                                                                        ─╯

echo "Pushing tracker"
docker push 944599182924.dkr.ecr.ap-south-1.amazonaws.com/amul-tracker:latest