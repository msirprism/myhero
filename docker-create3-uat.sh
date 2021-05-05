./docker-destroy-uat.sh
docker-compose -f docker-compose-uat.yml up -d --build
docker image prune -f
docker logs myhero-uat-graphql
