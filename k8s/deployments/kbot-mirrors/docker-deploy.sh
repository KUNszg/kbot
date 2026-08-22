docker build -t docker-registry.app.kunszg.com/kbot-mirrors:latest -f ../../../lib/mirrors/Dockerfile ../../../
docker push docker-registry.app.kunszg.com/kbot-mirrors:latest
