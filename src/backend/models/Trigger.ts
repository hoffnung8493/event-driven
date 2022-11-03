import { Schema, Document, Types, model } from 'mongoose'
import { TriggerError } from './TriggerError'

export interface TriggerDoc extends Document {
  _id: Types.ObjectId
  name: string
  variables?: any
  query?: string
  userId?: Types.ObjectId
  createdAt: Date
}

const TriggerSchema = new Schema({}, { strict: false })

export const Trigger = model<TriggerDoc>('Trigger', TriggerSchema)

export interface TriggerInput {
  name: string
  variables?: any
  query?: string
  userId?: Types.ObjectId
}
export const createTrigger = (data: TriggerInput) => {
  const trigger = new Trigger({ ...data, createdAt: new Date() })
  // trigger.save().catch(console.log)
  return {
    trigger,
    catchTriggerError: catchTriggerError(trigger._id),
  }
}

const catchTriggerError = (triggerId: Types.ObjectId) => (error: Error) => {
  new TriggerError({
    triggerId,
    message: error.message ? JSON.stringify(error.message) : undefined,
    stack: error.stack ? JSON.stringify(error.stack) : undefined,
    isConfirmed: false,
  })
    .save()
    .catch(console.log)
  return
}
