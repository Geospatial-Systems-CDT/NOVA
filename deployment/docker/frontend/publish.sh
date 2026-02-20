#!/bin/sh
# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.


AWS_REGION=eu-west-2
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

aws ecr get-login-password --region $AWS_REGION | sudo docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com
TAG=0.1.$(date +%s)

IMAGE=$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/nova/frontend:$TAG

sudo docker tag nova/frontend:latest $IMAGE
sudo docker push $IMAGE

echo "Revision tag: $TAG"
