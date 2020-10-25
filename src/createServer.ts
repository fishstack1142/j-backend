// import { ApolloServer, gql } from 'apollo-server-express'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'

import { AuthResolvers } from './resolvers/AuthResolvers'
import { createToken, sendToken, verifyToken } from './utils/tokenHandler'
import { AppContext } from './types'
import { UserModel } from './entities/User'

// import { UserModel } from './entities/User'

// const typeDefs = gql`
// type User {
//     id: String!
//     username: String!
//     email: String!
//     password: String!
// }

// type Query {
//     users: [User]
// }

// type Mutation {
//     createUser(username: String!, email: String!, password: String!): User
// }
// `

// interface InputArgs {
//     username: string
//     email: string
//     password: string
// }

// const resolvers = {
//     Query: {
//         users: () => UserModel.find()
//     },

//     Mutation: {
//         createUser: async (_: any, args: InputArgs) => {
//             const { username, email, password } = args

//             try {
//                 const newUser = await UserModel.create({
//                     username,
//                     email,
//                     password
//                 })

//                 return newUser
//             } catch (error) {
//                 console.log(error)
//                 throw error
//             }

//         }
//     }
// }


export default async () => {

    const schema = await buildSchema({
        resolvers: [AuthResolvers],
        emitSchemaFile: { path: './src/schema.graphql' },
        validate: false
    })

    return new ApolloServer({
        schema, context: async ({ req, res }: AppContext) => {
            // console.log('cookie===>', req.cookies)
            const token = req.cookies[process.env.COOKIE_NAME!]

            if (token) {
                try {
                    const decodedToken = verifyToken(token) as {
                        userId: string
                        tokenVersion: number
                        lat: number
                        exp: number
                    } | null

                    if (decodedToken) {
                        req.userId = decodedToken.userId
                        req.tokenVersion = decodedToken.tokenVersion

                        if (Date.now() / 1000 - decodedToken.lat > 6 * 60 * 60) {
                            const user = await UserModel.findById(req.userId).exec()

                            if (user?.tokenVersion === req.tokenVersion) {

                                user.tokenVersion = user.tokenVersion + 1;

                                const updatedUser = await user.save()

                                if (updatedUser) {
                                    const token = createToken(user.id, updatedUser.tokenVersion!)

                                    req.tokenVersion = updatedUser.tokenVersion

                                    sendToken(res, token)
                                }
                            }
                        }

                    }

                } catch (error) {
                    req.userId = undefined
                    req.tokenVersion = undefined
                }
            }

            return { req, res }
        }
    })
}