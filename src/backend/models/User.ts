import { Schema, Document, model } from 'mongoose'

export interface UserDoc extends Document {
  username: string
  hashedPassword: string
  authorized: boolean
}

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    hashedPassword: { type: String, required: true },
    authorized: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
)

export const User = model<UserDoc>('user', UserSchema)

export const createUser = (data: { username: string; hashedPassword: string }) => new User(data).save()
