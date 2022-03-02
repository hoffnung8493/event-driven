import { Schema, Document, Types, connection } from 'mongoose'
import { database } from './database'

export interface OperationDoc extends Document {
  operationName: string
  variables: any
  query: string
  userId?: Types.ObjectId
  clientGroup?: string
  createdAt: Date
}

const OperationSchema = new Schema(
  {
    operationName: { type: String, required: true },
    variables: Schema.Types.Mixed,
    query: { type: String, required: true },
    userId: Types.ObjectId,
    clientGroup: { type: String, required: true },
  },
  { timestamps: true }
)

export const Operation = connection.useDb(database).model<OperationDoc>('Operation', OperationSchema)

export const createOperation = async (data: {
  _id: Types.ObjectId
  operationName: string
  variables: any
  query: string
  userId?: Types.ObjectId
}) => {
  if (data.query.includes('mutation')) {
    await new Operation(data).save()
  }
}
