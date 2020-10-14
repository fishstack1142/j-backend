import { Resolver, Query } from 'type-graphql'
import { User, UserModel } from '../entities/User'
 
@Resolver()
export class AuthResolvers { 

    @Query(() => [User], {nullable: 'items'}) //for nullable
    async users(): Promise<User[] | null> {

        try {
            return UserModel.find()
        } catch (error) {
            console.log(error)
            throw error
        }
    }


 }