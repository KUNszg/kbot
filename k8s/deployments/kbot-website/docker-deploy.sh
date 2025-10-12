docker build -t docker-registry.kunszg.com/kbot-website:latest -f ../../../kbot-website/Dockerfile ../../.. --no-cache --pull
docker push docker-registry.kunszg.com/kbot-website:latest
