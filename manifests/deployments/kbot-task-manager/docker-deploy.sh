docker build -t docker-registry.kunszg.com/kbot-job-manager:latest -f ../../../lib/job-manager/Dockerfile ../../../
docker push docker-registry.kunszg.com/kbot-job-manager:latest
