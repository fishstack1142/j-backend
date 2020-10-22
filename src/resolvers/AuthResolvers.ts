import { Resolver, Query, Mutation, Arg, Ctx, ObjectType, Field } from 'type-graphql'
import { User, UserModel } from '../entities/User'
import { validateEmail, validatePassword, validateUsername } from '../utils/validate'
import { createToken, sendToken } from '../utils/tokenHandler'

import bcrypt from 'bcryptjs'
import { Request, Response } from 'express'
import { AppContext, RoleOptions } from '../types'
import { isAuthenticated } from '../utils/authHandler'
import { randomBytes } from 'crypto'

import Sendgrid, { MailDataRequired } from '@sendgrid/mail'
Sendgrid.setApiKey(process.env.SENDGRID_API_KEY!)

@ObjectType()
export class ResponseMessage {
    @Field()
    message: string
}

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

    @Query(() => User, { nullable: true })
    async me(@Ctx() { req }: AppContext): Promise<User | null> {
        try {
            if (!req.userId) throw new Error('Please log in to proceed')

            const user = await isAuthenticated(req.userId, req.tokenVersion)

            return user
        } catch (error) {
            throw error
        }
    }



    @Mutation(() => User, { nullable: true })
    async signUp(
        @Arg('username')
        username: string,

        @Arg('email')
        email: string,

        @Arg('password')
        password: string,

        @Ctx()
        { res }: { req: Request, res: Response }
    ): Promise<User | null> {

        try {

            if (!username) throw new Error('Username is required.')
            if (!email) throw new Error('Email is required')
            if (!password) throw new Error('Password is required')

            const user = await UserModel.findOne({ email }).exec()

            if (user) throw new Error('Email is already in use, please sign in')

            const isUsernameValid = validateUsername(username)

            if (!isUsernameValid) throw new Error('username length must be 3 - 60 characters')


            //use express validator later
            const isEmailValid = validateEmail(email)

            if (!isEmailValid) throw new Error('Email is invalid')

            const isPasswordValid = validatePassword(password)

            if (!isPasswordValid) throw new Error('password length must be 6 - 50 characters')

            const hashedPassword = await bcrypt.hash(password, 10)

            const newUser = await UserModel.create<Pick<User, 'username' | 'email' | 'password'>>({
                username,
                email,
                password: hashedPassword
            })


            let userSaved = await newUser.save()

            const token = createToken(userSaved.id, userSaved.tokenVersion!);

            console.log(token)
            sendToken(res, token)

            return newUser
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    @Mutation(() => User, { nullable: true })
    async signIn(
        @Arg('email')
        email: string,

        @Arg('password')
        password: string,

        @Ctx()
        { res }: { req: Request, res: Response }
    ): Promise<User | null> {

        try {

            if (!email) throw new Error('Email is required')
            if (!password) throw new Error('Password is required')

            const user = await UserModel.findOne({ email }).then(u => u)

            if (!user) throw new Error('User not found')

            const isPasswordValid = await bcrypt.compare(password, user.password)

            if (!isPasswordValid) throw new Error('Email or password is wrong')

            const token = createToken(user.id, user.tokenVersion!);

            console.log(token)
            sendToken(res, token)

            return user
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    @Mutation(() => ResponseMessage, { nullable: true })
    async signOut(

        @Ctx()
        { req, res }: AppContext): Promise<ResponseMessage | null> {

        try {

            const user = await UserModel.findById(req.userId).then(u => u)

            if (!user) return { message: 'user not found' }

            user.tokenVersion = user.tokenVersion! + 1
            await user.save()

            res.clearCookie(process.env.COOKIE_NAME!)

            return { message: 'logged out' }
        } catch (error) {
            console.log(error)
            throw error
        }
    }


    @Mutation(() => ResponseMessage, { nullable: true })
    async requestResetPassword(@Arg('email') email: string): Promise<ResponseMessage | null> {

            if (!email) throw new Error('Email is required.')

            const user = await UserModel.findOne({ email }).exec()

            if (!user) throw new Error('Email not found')

            const resetPasswordToken = randomBytes(16).toString('hex')
            const resetPasswordTokenExpiry = Date.now() + 1000 * 60 * 30

            const updatedUser = await UserModel.findOneAndUpdate({ email }, { resetPasswordToken, resetPasswordTokenExpiry }, { new: true }).exec()

            if (!updatedUser) throw new Error('error occurred')

            const message: MailDataRequired = {
                to: user.email,
                from: `${process.env.SENDGRID_EMAIL}`,
                subject: "Reset password as you requested",
                html: `<div>
                      <p>check the link below</p>\n\n
                      <a href='${process.env.SENDGRID_RESET_URL}?resetToken=${resetPasswordToken}' target='blank'>click here</a>
                </div>`,
            }

            const response = await Sendgrid.send(message)

            if (!response || response[0]?.statusCode !== 202) throw new Error("can't proceed")

            return { message: 'check your email to reset password' }
    }

    @Mutation(() => ResponseMessage, { nullable: true })
    async resetPassword(
        @Arg('password') password: string,
        @Arg('token') token:string
        ): Promise<ResponseMessage | null> {

            if (!password) throw new Error('Password is required.')
            if (!token) throw new Error('Wrong method')

            const user = await UserModel.findOne({ resetPasswordToken: token }).exec()

            if (!user) throw new Error('User not found')

            if (!user.resetPasswordTokenExpiry) throw new Error("Can't process")

            const isTokenValid = Date.now() <= user.resetPasswordTokenExpiry

            if(!isTokenValid) throw new Error('Sorry, ')

            const hashedPassword = await bcrypt.hash(password, 10)
            
            const updatedUser = await UserModel.findOneAndUpdate({ email: user.email }, { password: hashedPassword, resetPasswordToken: undefined, resetPasswordTokenExpiry: undefined }, { new: true }).exec()

            if (!updatedUser) throw new Error('error occurred')

            return { message: 'reset password is done' }
    }


    @Mutation(() => User, {nullable: true})
    async updateRole(
        @Arg('newRole', () => [String]) newRole: RoleOptions[],
        @Arg('userId') userId: string,
        @Ctx() {req}: AppContext
    ) {
        try {
            
            if(!req.userId) throw new Error('Please login')
            const admin = await isAuthenticated(req.userId, req.tokenVersion)

            const isSuperAdmin = admin.roles?.includes(RoleOptions.superAdmin)

            if (!isSuperAdmin) throw new Error('Not authorized')

            const user = await UserModel.findById(userId).exec()

            if(!user) throw new Error('No User')

            user.roles = newRole

            user.save()

            return user

        } catch (error) {
            throw error
        }
    }

}