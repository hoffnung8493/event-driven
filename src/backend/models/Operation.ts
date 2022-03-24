import { Schema, Document, Types, model } from 'mongoose'

export interface OperationDoc extends Document {
  type: OperationType
  name: string
  variables: any
  query: string
  userId?: Types.ObjectId
  createdAt: Date
}

export enum OperationType {
  Query = 'Query',
  Mutation = 'Mutation',
  CronJob = 'CronJob',
  ExternalSource = 'ExternalSource',
}

const OperationSchema = new Schema(
  {
    type: { type: String, required: true, enum: Object.values(OperationType) },
    name: { type: String, required: true },
    variables: Schema.Types.Mixed,
    query: { type: String, required: true },
    userId: Types.ObjectId,
  },
  { timestamps: true }
)

export const Operation = model<OperationDoc>('Operation', OperationSchema)

export const createOperation = async (data: {
  _id: Types.ObjectId
  type: OperationType
  name: string
  variables: any
  query: string
  userId?: Types.ObjectId
}) => new Operation(data).save()
