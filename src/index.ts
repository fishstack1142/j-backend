import express from 'express'
import mongoose from "mongoose";

import dotenv from "dotenv";
dotenv.config();

import createServer from './createServer'

(async function () {

    await mongoose.connect(
        `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_ENDPOINT}/${process.env.DB_NAME}?retryWrites=true&w=majority`
        , {
            useUnifiedTopology: true,
            useCreateIndex: true,
            useNewUrlParser: true,
            useFindAndModify: false
        }
    );

    const app = express()

    const server = await createServer()

    server.applyMiddleware({ app })

    app.listen({ port: 5000 }, () =>
    console.log(`Server is running at port 5000${server.graphqlPath}`))

}())

