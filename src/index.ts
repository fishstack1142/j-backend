import express from 'express'
import mongoose from "mongoose";
import cookieParser from 'cookie-parser';


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
    app.use(cookieParser())

    const server = await createServer()

    server.applyMiddleware({ app })

    app.listen({ port: process.env.PORT }, () =>
    console.log(`Server is running at port ${process.env.PORT}${server.graphqlPath}`))

}())

