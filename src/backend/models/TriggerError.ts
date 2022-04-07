import { Schema, Document, Types, model } from 'mongoose'

export interface TriggerError extends Document {
  triggerId: Types.ObjectId
  message?: string
  stack?: string
  isConfirmed: Boolean
  createdAt: Date
  updatedAt: Date
}

const TriggerErrorSchema = new Schema({}, { timestamps: true, strict: false })

export const TriggerError = model<TriggerError>('TriggerError', TriggerErrorSchema)

export const catchTriggerError = (triggerId: Types.ObjectId) => (error: Error) => {
  new TriggerError({
    triggerId,
    message: error.message ? JSON.stringify(error.message) : undefined,
    stack: error.stack ? JSON.stringify(error.stack) : undefined,
    isConfirmed: false,
  }).save()
  return
}
