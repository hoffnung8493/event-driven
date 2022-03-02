import { Schema, Document, Types, connection } from 'mongoose'
import { database } from './database'

export interface MessageDoc extends Document {
  operationId: Types.ObjectId
  parentId: Types.ObjectId
  clientGroup: string
  subject: string
  data: any
  receivedAt: Date
  publishedAt: Date
  republish: {
    targetClientGroup: string
    createdAt: Date
  }[]
}

const MessageSchema = new Schema(
  {
    operationId: { type: Types.ObjectId, required: true },
    parentId: { type: Types.ObjectId, required: true },
    clientGroup: { type: String, required: true },
    subject: { type: String, required: true },
    data: Schema.Types.Mixed,
    receivedAt: { type: Date, required: true },
    publishedAt: { type: Date, required: true },
    republish: [
      {
        targetClientGroup: { type: String, required: true },
        createdAt: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true }
)

export const Message = connection.useDb(database).model<MessageDoc>('message', MessageSchema)

export interface Message<Subjects> {
  subject: Subjects
  data: any
}

export const createMessage = async <ClientGroups extends string, Subjects extends string, T extends Message<Subjects>>(data: {
  _id: Types.ObjectId
  operationId: Types.ObjectId
  parentId: Types.ObjectId
  clientGroup: string
  subject: T['subject']
  data: T['data']
  receivedAt: Date
  publishedAt: Date
  republish: {
    targetClientGroup: ClientGroups
    createdAt: Date
  }[]
}) => new Message(data).save()
