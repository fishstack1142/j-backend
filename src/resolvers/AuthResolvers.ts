import { Resolver, Query, Mutation, Arg, Ctx } from 'type-graphql'
import { User, UserModel } from '../entities/User'
import { validateEmail, validatePassword, validateUsername } from '../utils/validate'
import { createToken, sendToken } from '../utils/tokenHandler'

import bcrypt from 'bcryptjs'
import { Request, Response } from 'express'

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
    async signUp(
        @Arg('username')
        username: string,

        @Arg('email')
        email: string,

        @Arg('password')
        password: string,

        @Ctx()
        { res }: { req: Request, res: Response }
    ) {

        try {

            if (!username) throw new Error('Username is required.')
            const isUsernameValid = validateUsername(username)

            if (!isUsernameValid) throw new Error('username length must be 3 - 60 characters')

            if (!email) throw new Error('Email is required')

            //use express validator later
            const isEmailValid = validateEmail(email)

            if (!isEmailValid) throw new Error('Email is invalid')

            if (!password) throw new Error('Password is required')
            const isPasswordValid = validatePassword(password)

            if (!isPasswordValid) throw new Error('password length must be 6 - 50 characters')

            const hashedPassword = await bcrypt.hash(password, 10)

            const newUser = await UserModel.create({
                username,
                email,
                password: hashedPassword
            })


            let userSaved = await newUser.save()

            const token = createToken(userSaved.id, 0);

            console.log(token)
            sendToken(res, token)

            return newUser
        } catch (error) {
            console.log(error)
            throw error
        }
    }

}