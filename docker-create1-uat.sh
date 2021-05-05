rm prisma/.env
cp .env.uat prisma/.env
docker-compose -f docker-compose-uat.yml up -d --build
#Please migrate db schema using phpMyAdmin then run ./docker-create2-uat.sh