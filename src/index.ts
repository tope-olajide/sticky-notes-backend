import express, {Request, Response } from "express";
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServer } from '@apollo/server';

import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import { schema } from "./schema";
import mongoose from 'mongoose';
import jsonwebtoken from 'jsonwebtoken'
import cors from 'cors';
import cookieParser from "cookie-parser";
import { json } from 'body-parser';

require('dotenv').config()


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

   const corsOptions = {
    origin: process.env.FRONTEND_URL!,
    credentials: true,
    
  };


  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
  });

  await server.start();
  app.use(
    '/graphql',
    cors(corsOptions),
    json(),
    cookieParser(),
    expressMiddleware(server, {
      context: async ({ req, res }:{req:Request, res:Response})=> {
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
    }),
  );
  await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000/graphql`);

}
async function connectToMongoDB() {
  await mongoose.connect(process.env.DATABASE_URL!);
  console.log("Connected to mongo atlas successfully...");
}

startApolloServer();
connectToMongoDB().catch(err => console.log(err));





