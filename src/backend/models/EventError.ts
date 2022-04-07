import { Schema, Document, Types, model } from 'mongoose'

export interface EventErrorDoc extends Document {
  eventId: Types.ObjectId
  durableName: string
  clientGroup: string
  subject: string
  errorCount: number
  error: {
    message?: string
    stack?: string
    createdAt: Date
  }[]
  isResolved: Boolean
  createdAt: Date
  updatedAt: Date
}

const EventErrorSchema = new Schema({}, { timestamps: true, strict: false })

export const EventError = model<EventErrorDoc>('EventError', EventErrorSchema)

export const createEventError = async (data: {
  eventId: Types.ObjectId
  durableName: string
  clientGroup: string
  subject: string
  error: {
    message?: string
    stack?: string
  }
}) => {
  const error = { message: JSON.stringify(data.error.message), stack: data.error.stack, createdAt: new Date() }
  const eventError = await EventError.findOneAndUpdate(
    {
      eventId: data.eventId,
      durableName: data.durableName,
    },
    {
      $push: { error },
      $inc: { errorCount: 1 },
      isResolved: false,
    },
    { new: true }
  )
  if (eventError) return eventError.toObject()

  const newEventError = await new EventError({
    eventId: data.eventId,
    durableName: data.durableName,
    clientGroup: data.clientGroup,
    subject: data.subject,
    errorCount: 1,
    error: [{ ...error, createdAt: new Date() }],
    isResolved: false,
  }).save()

  return newEventError
}
