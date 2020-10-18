import { getModelForClass, prop } from '@typegoose/typegoose'
import { ObjectType, Field, ID } from 'type-graphql'
import { RoleOptions } from '../types'

@ObjectType()
export class User {

    @Field(() => ID)
    id: string

    @Field()
    @prop({required: true, trim: true})
    username: string

    @Field()
    @prop({required: true, trim: true, unique: true})
    email: string

    @prop({required: true})
    password: string;


    @prop({ default: 0 })
    public tokenVersion?: number

    @prop()
    resetPasswordToken?: string

    @prop()
    resetPasswordTokenExpiry?: number

    @prop()
    facebookId?: string

    @prop()
    googleId?: string

    @Field(() => [String])
    @prop({
      type: String,
      enum: RoleOptions,
      default: [RoleOptions.client],
    })
    roles?: RoleOptions[]
  
    @Field()
    @prop({ default: () => Date.now() + 60 * 60 * 1000 * 7 })
    createdAt?: Date
}

export const UserModel = getModelForClass(User)



// import mongoose from 'mongoose'


// const UserSchema = new mongoose.Schema({
//     username: {
//         type: String,
//         required: true
//     },
//     email: {
//         type: String,
//         required: true
//     },
//     password: {
//         type: String,
//         required: true
//     },
// })

// export const UserModel = mongoose.model('User', UserSchema)