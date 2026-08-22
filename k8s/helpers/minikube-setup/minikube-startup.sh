#!/bin/bash

minikube start --profile=kbot --driver=docker \
  --mount-string="/home/kunszg/kbot-env/node_modules:/home/docker/kbot/node_modules" \
  --extra-config=apiserver.allow-privileged=true \
  --extra-config=kubelet.allowed-unsafe-sysctls=net.*

minikube -p kbot addons enable metrics-server ingress


minikube start --profile=kbot3 --driver=docker \
  --mount --mount-string="/var/lib/mysql:/mnt/data" \
  --extra-config=apiserver.allow-privileged=true \
  --extra-config=kubelet.allowed-unsafe-sysctls=net.* \
  --cpus=12 \
  --memory=25600

minikube -p kbot3 addons enable metrics-server ingress
