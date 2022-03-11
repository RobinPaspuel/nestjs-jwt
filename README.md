# Bookmark App

This app is a technology test of NestJS and Prisma ORM. The current functionalities are: authentication, bookmarks CRUD.

## Technology Stack
 - NestJS
 - Prisma ORM
 - Pactum (e2e testing)
 - Swagger

## Instructions

Install the required dependencies with:
```bash
$ npm install
```
A .env file with the following env variables is needed:

 - DATABASE_URL
 - JWT_SECRET (openssl rand -hex 32)

To test the endpoints run:
```bash
$ npm run start:api
```
> The start script uses Docker and docker-compose

Visit /docs for the Swagger documentation.
