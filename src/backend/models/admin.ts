import { Schema, Document, connection } from 'mongoose'
import { database } from './database'

export interface AdminDoc extends Document {
  username: string
  hashedPassword: string
  authorized: boolean
}

const AdminSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    hashedPassword: { type: String, required: true },
    authorized: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
)

export const Admin = connection.useDb(database).model<AdminDoc>('Event-Admin', AdminSchema)

export const createAdmin = (data: { username: string; hashedPassword: string }) => new Admin(data).save()
