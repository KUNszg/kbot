docker build -t docker-registry.kunszg.com/kbot-task-manager:latest -f ../../../lib/task-manager/Dockerfile ../../../
docker push docker-registry.kunszg.com/kbot-task-manager:latest
