docker-compose exec myhero-graphql npx prisma introspect
docker-compose exec myhero-graphql npx prisma generate
#docker logs myhero-graphql
./docker-destroy.sh
docker-compose up -d --build
docker image prune -f
docker logs myhero-graphql