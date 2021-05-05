docker-compose -f docker-compose-uat.yml exec myhero-uat-graphql npx prisma introspect
#docker-compose -f docker-compose-uat.yml exec myhero-graphql npx prisma generate
#docker logs myhero-uat-graphql
./docker-destroy-uat.sh
docker-compose -f docker-compose-uat.yml up -d --build
docker image prune -f
docker logs myhero-uat-graphql