#!/bin/bash

minikube start --profile=kbot --driver=docker \
  --mount-string="/var/lib/mysql:/home/docker/mysql" \
  --mount-string="/home/kunszg/kbot-env/node_modules:/home/docker/kbot/node_modules" \
  --extra-config=apiserver.allow-privileged=true \
  --extra-config=kubelet.allowed-unsafe-sysctls=net.*

minikube -p kbot addons enable metrics-server
