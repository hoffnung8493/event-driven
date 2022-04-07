import { Schema, Document, Types, model } from 'mongoose'
import { catchTriggerError } from './TriggerError'
import { createBatchError } from './BatchError'

export enum LogType {
  Event = 'Event',
  Batch = 'Batch',
  Trigger = 'Trigger',
}

export interface EventDoc extends Document {
  _id: Types.ObjectId
  type: LogType.Event
  parentId: Types.ObjectId
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

export interface BatchDoc extends Document {
  _id: Types.ObjectId
  type: LogType.Batch
  parentEventIds: Types.ObjectId[]
  durableName: string
  clientGroup: string
  subject: string
  processTime?: number
  createdAt: Date
}

export interface TriggerDoc extends Document {
  _id: Types.ObjectId
  type: LogType.Trigger
  name: string
  variables?: any
  query?: string
  userId?: Types.ObjectId
  createdAt: Date
}

const LogSchema = new Schema({}, { strict: false })

export const Log = model<TriggerDoc | EventDoc | BatchDoc>('Log', LogSchema)

export interface Event<Subjects> {
  subject: Subjects
  data: any
}

export const createEvent = <T extends Event<string>>(data: {
  parentId: Types.ObjectId
  durableName?: string
  clientGroup: string
  subject: T['subject']
  data: T['data']
}) => {
  const event = new Log({ ...data, republish: [], type: LogType.Event, createdAt: new Date() }) as EventDoc
  event.save()
  return event
}

export interface BatchInput {
  parentEventIds: Types.ObjectId[]
  durableName: string
  clientGroup: string
  subject: string
}

export const createBatch = (data: BatchInput) => {
  const batch = new Log({ ...data, type: LogType.Batch, createdAt: new Date() }) as BatchDoc
  return {
    batch,
    catchError: createBatchError(batch._id),
  }
}

export interface TriggerInput {
  name: string
  variables?: any
  query?: string
  userId?: Types.ObjectId
}
export const createTrigger = (data: TriggerInput) => {
  const trigger = new Log({ ...data, type: LogType.Trigger, createdAt: new Date() }) as TriggerDoc
  trigger.save()
  return {
    trigger,
    catchTriggerError: catchTriggerError(trigger._id),
  }
}
