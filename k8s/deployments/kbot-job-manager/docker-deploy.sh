docker build -t docker-registry.app.kunszg.com/kbot-job-manager:latest -f ../../../lib/job-manager/Dockerfile ../../../
docker push docker-registry.app.kunszg.com/kbot-job-manager:latest
