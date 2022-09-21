import express from "express";
import {ApolloServer} from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import http from 'http';
import { schema } from "./schema";
import mongoose from 'mongoose';
require('dotenv').config()


async function startApolloServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const server = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    context: ({ res }) => {
        return {
          res
        }
      }
  });

  await server.start();
  server.applyMiddleware({ app, path:'/graphql', cors: false  });
  const port = process.env.PORT || 4000;
  await new Promise<void>(resolve => httpServer.listen({ port }, resolve));
  console.log(`🚀 Server ready at http://localhost:${port+server.graphqlPath}`);
}

startApolloServer()

async function main() {
  await mongoose.connect(process.env.DATABASE_URL!);
  console.log("Connected to mongo atlas successfully...");
}

main().catch(err => console.log(err));
