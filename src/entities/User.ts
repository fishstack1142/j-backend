import { getModelForClass, prop } from '@typegoose/typegoose'
import { ObjectType, Field, ID } from 'type-graphql'

@ObjectType({ description: 'Model User' })
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
    password: string
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