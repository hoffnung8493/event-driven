import { Schema, Document, Types, model } from 'mongoose'

export interface BatchDoc extends Document {
  _id: Types.ObjectId
  parentEventIds: Types.ObjectId[]
  durableName: string
  clientGroup: string
  subject: string
  processTime?: number
  createdAt: Date
}

const BatchSchema = new Schema({}, { strict: false })

export const Batch = model<BatchDoc>('Batch', BatchSchema)

export interface BatchInput {
  parentEventIds: Types.ObjectId[]
  durableName: string
  clientGroup: string
  subject: string
}

export const createBatch = (data: BatchInput) => {
  const batch = new Batch({ ...data, createdAt: new Date() })
  return {
    batch,
    catchError: createBatchError(batch._id),
  }
}

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
