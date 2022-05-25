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
