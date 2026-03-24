1 - docker-compose up -d

2 - Crear .env con las variables que estan en el .env.example

3 - yarn install

4 - yarn run migration:run src/database/migrations/initial

5 - yarn run seed

6 - yarn run start:dev

para correr swagger se usa la siguiente url: 

http://localhost:3000/docs