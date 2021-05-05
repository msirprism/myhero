./docker-destroy.sh
docker-compose -f docker-compose-prod.yml up -d --build
docker image prune -f
docker logs myhero-graphql
