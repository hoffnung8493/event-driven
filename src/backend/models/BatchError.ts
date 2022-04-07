import { Schema, Document, Types, model } from 'mongoose'

export interface BatchError extends Document {
  batchId: Types.ObjectId
  message?: string
  stack?: string
  isConfirmed: Boolean
  createdAt: Date
  updatedAt: Date
}

const BatchErrorSchema = new Schema({}, { timestamps: true, strict: false })

export const BatchError = model<BatchError>('BatchError', BatchErrorSchema)

export const createBatchError = (batchId: Types.ObjectId) => (error: Error) => {
  new BatchError({
    batchId,
    message: error.message ? JSON.stringify(error.message) : undefined,
    stack: error.stack ? JSON.stringify(error.stack) : undefined,
    isConfirmed: false,
  }).save()
  return
}
