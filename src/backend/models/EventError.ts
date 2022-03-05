import { Schema, Document, Types, model } from 'mongoose'

export interface EventErrorDoc extends Document {
  _id: Types.ObjectId
  operationId: Types.ObjectId
  parentId: Types.ObjectId
  clientGroup: string
  publishingSubject: string
  errorCount: number
  error: {
    message: string
    stack?: string
    createdAt: Date
  }[]
  resolvedBy: {
    eventId?: Types.ObjectId
  }
  createdAt: Date
  updatedAt: Date
}

const EventErrorSchema = new Schema(
  {
    operationId: { type: Types.ObjectId, required: true },
    parentId: { type: Types.ObjectId, required: true },
    clientGroup: { type: String, required: true },
    publishingSubject: { type: String, required: true },
    errorCount: { type: Number, required: true },
    error: [
      {
        message: { type: String, required: true },
        stack: String,
        createdAt: { type: Date, required: true },
      },
    ],
    resolvedBy: {
      eventId: Types.ObjectId,
    },
  },
  { timestamps: true }
)

export const EventError = model<EventErrorDoc>('EventError', EventErrorSchema)

export const createEventError = async <Subjects extends string>(data: {
  operationId: Types.ObjectId
  parentId: Types.ObjectId
  clientGroup: string
  publishingSubject: Subjects
  error: {
    message: string
    stack?: string
  }
}) => {
  const eventError = await EventError.findOneAndUpdate(
    {
      operationId: data.operationId,
      parentId: data.parentId,
      clientGroup: data.clientGroup,
      publishingSubject: data.publishingSubject,
    },
    {
      $push: { error: { ...data.error, createdAt: new Date() } },
      $inc: { errorCount: 1 },
    },
    { new: true }
  ).exec()
  if (eventError) return eventError.toObject()

  const newEventError = await new EventError({
    operationId: data.operationId,
    parentId: data.parentId,
    clientGroup: data.clientGroup,
    publishingSubject: data.publishingSubject,
    errorCount: 1,
    error: [{ ...data.error, createdAt: new Date() }],
  }).save()

  return newEventError
}
