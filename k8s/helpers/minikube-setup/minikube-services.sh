#!/bin/bash

REAL_USER=${SUDO_USER:-$USER}
HOME_DIR=$(eval echo ~$REAL_USER)

port_forward_retry() {
    local resource=$1
    local ports=$2
    local namespace=${3:-default}

    while true; do
        if [ "$namespace" = "default" ]; then
            kubectl port-forward "$resource" "$ports"
        else
            kubectl port-forward "$resource" "$ports" -n "$namespace"
        fi
        echo "Port-forward $resource $ports lost connection, reconnecting in 3 seconds..."
        sleep 3
    done
}

minikube -p kbot dashboard --url --port=40000 &

port_forward_retry "svc/docker-registry" "5000:5000" &
port_forward_retry "svc/rabbitmq-service" "15672:15672" &
port_forward_retry "svc/rabbitmq-service" "5672:5672" &
port_forward_retry "svc/redis" "6379:6379" &
port_forward_retry "svc/mysql" "3306:3306" &
port_forward_retry "svc/kbot-api" "8080:8080" &
port_forward_retry "svc/kbot-website-service" "40100:40100" &
port_forward_retry "svc/ads-scraper" "8510:8510" &
port_forward_retry "svc/grafana" "3005:3005" "logging" &

minikube mount "$HOME_DIR/musicbot/music-bot-github:/home/docker/musicbot" &
minikube mount "/home/kunszg/kbot-env/node_modules:/home/docker/kbot/node_modules" &

wait


# place in /usr/local/bin/ then:
# sudo chmod +x /usr/local/bin/minikube-services.sh