import express from 'express'
import createServer from './createServer'

(function () {

    const app = express()

    const server = createServer()

    server.applyMiddleware({app})

    app.listen({ port: 5000 }, () => 
    console.log(`Server is running at port 5000${server.graphqlPath}`))

}())

