docker build -t docker-registry.kunszg.com/kbot-mirrors:latest -f ../../../lib/mirrors/Dockerfile ../../../
docker push docker-registry.kunszg.com/kbot-mirrors:latest
