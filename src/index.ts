import express, { Response } from "express";
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer, AuthenticationError } from 'apollo-server-core';
import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';
import http from 'http';
import { schema } from "./schema";
import mongoose from 'mongoose';
import jsonwebtoken from 'jsonwebtoken'
require('dotenv').config()
import cors from 'cors';
import cookieParser from "cookie-parser";


const getUser = (token: string, res: Response) => {
  try {
    if (token) {
      return jsonwebtoken.verify(token, process.env.JWT_SECRET!)
    }
    res.clearCookie("access_token");
    return null
  } catch (error) {
    return null
  }

}

async function startApolloServer() {
  const app = express();
  app.use(cookieParser());

  const corsOptions = {
    origin: process.env.FRONTEND_URL!,
    credentials: true,
    
  };

  app.use(cors(corsOptions));
  const httpServer = http.createServer(app);
  const server = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    cache: new InMemoryLRUCache(),
    context: ({ req, res }) => {
      if (req) {
        console.log(req.cookies)
        const token = req.cookies.access_token || ""
        const user = getUser(token, res);
        console.log({ user })
        return {
          user,
          res
        };
      }
      return {
        res
      }
    }
  });



  await server.start();
  server.applyMiddleware({ app, cors: false });
  const port = process.env.PORT || 4000;
  await new Promise<void>(resolve => httpServer.listen({ port }, resolve));
  console.log(`🚀 Server ready at http://localhost:${port + server.graphqlPath}`);

}
async function connectToMongoDB() {
  await mongoose.connect(process.env.DATABASE_URL!);
  console.log("Connected to mongo atlas successfully...");
}

startApolloServer();
connectToMongoDB().catch(err => console.log(err));





