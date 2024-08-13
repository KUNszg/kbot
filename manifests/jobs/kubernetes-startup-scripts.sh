#!/bin/bash

# minikube start --driver=docker
screen minikube dashboard --url --port=40001

screen kubectl port-forward --namespace kbot svc/registry 5000:5000
screen kubectl port-forward --namespace kbot svc/rabbitmq 15672:15672
screen kubectl port-forward --namespace kbot svc/redis 6379:

screen minikube mount ./musicbot:/home/docker/musicbot
screen minikube mount ./kbot/node_modules:/home/docker/kbot/node_modules
screen minikube mount /var/run/mysqld/mysqld.sock:/home/docker/run/mysqld/mysqld.sock
# exit from attached mode with ctrl+a + ctrl+d