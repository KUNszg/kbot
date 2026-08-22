docker build -t docker-registry.app.kunszg.com/kbot-website:latest -f ../../../kbot-website/Dockerfile ../../.. --no-cache --pull
docker push docker-registry.app.kunszg.com/kbot-website:latest
