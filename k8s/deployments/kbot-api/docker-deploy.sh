docker build -t docker-registry.app.kunszg.com/kbot-api:latest -f ../../../api/Dockerfile ../../../
docker push docker-registry.app.kunszg.com/kbot-api:latest
