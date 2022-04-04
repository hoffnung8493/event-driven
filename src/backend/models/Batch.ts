import { Schema, Document, Types, model } from 'mongoose'

export interface BatchDoc extends Document {
  operationIds: Types.ObjectId[]
  parentEventIds: Types.ObjectId[]
  durableName: string
  clientGroup: string
  subject: string
  batchEventHandlerOrder: number
  processTime: number
  error: {
    message?: string
    stack?: string
    createdAt: Date
  }
  createdAt: Date
  updatedAt: Date
}

const BatchSchema = new Schema(
  {
    operationIds: [{ type: Types.ObjectId, required: true }],
    parentEventIds: [{ type: Types.ObjectId, required: true }],
    durableName: { type: String, required: true },
    clientGroup: { type: String, required: true },
    subject: { type: String, required: true },
    batchEventHandlerOrder: { type: Number, required: true },
    processTime: Number,
    error: {
      type: new Schema({
        message: String,
        stack: String,
        createdAt: { type: Date, required: true },
      }),
    },
  },
  { timestamps: true }
)

export const Batch = model<BatchDoc>('Batch', BatchSchema)

export interface Batch<Subjects> {
  subject: Subjects
  data: any
}
