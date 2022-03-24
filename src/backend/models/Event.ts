import { Schema, Document, Types, model } from 'mongoose'

export interface EventDoc extends Document {
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

const EventSchema = new Schema(
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

export const Event = model<EventDoc>('Event', EventSchema)

export interface Event<Subjects> {
  subject: Subjects
  data: any
}

export const createEvent = async <T extends Event<string>>(data: {
  _id: Types.ObjectId
  operationId: Types.ObjectId
  parentId: Types.ObjectId
  clientGroup: string
  subject: T['subject']
  data: T['data']
  receivedAt: Date
  publishedAt: Date
  republish: {
    targetClientGroup: string
    createdAt: Date
  }[]
}) => new Event(data).save()
