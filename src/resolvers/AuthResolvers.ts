import { Resolver, Query, Mutation, Arg } from 'type-graphql'
import { User, UserModel } from '../entities/User'

@Resolver()
export class AuthResolvers {

    @Query(() => [User], { nullable: 'items' }) //for nullable
    async users(): Promise<User[] | null> {

        try {
            return UserModel.find()
        } catch (error) {
            console.log(error)
            throw error
        }
    }



    @Mutation(() => User)
    async createUser(
        @Arg('username')
        username: string,

        @Arg('email')
        email: string,

        @Arg('password')
        password: string
    ) {

        try {
            const newUser = await UserModel.create({
                username,
                email,
                password
            })

            await newUser.save()

            return newUser
        } catch (error) {
            console.log(error)
            throw error
        }
    }

}