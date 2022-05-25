import { Schema, Document, Types, model } from 'mongoose'

export interface EventDoc extends Document {
  _id: Types.ObjectId
  parentIds: Types.ObjectId[]
  durableName?: string
  clientGroup: string
  subject: string
  data: any
  republish: {
    targetClientGroup: string
    createdAt: Date
  }[]
  createdAt: Date
}

const EventSchema = new Schema({}, { strict: false })

export const Event = model<EventDoc>('Event', EventSchema)

export interface Event<Subjects> {
  subject: Subjects
  data: any
}

export const createEvent = <PublishingEvent extends Event<string>>(data: {
  parentIds: Types.ObjectId[]
  durableName?: string
  clientGroup: string
  subject: PublishingEvent['subject']
  data: PublishingEvent['data']
}) => {
  const event = new Event({ ...data, republish: [], createdAt: new Date() })
  event.save().catch(console.log)
  return event
}
