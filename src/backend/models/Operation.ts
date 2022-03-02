import { Schema, Document, Types, model } from 'mongoose'

export interface OperationDoc extends Document {
  name: string
  variables: any
  query: string
  userId?: Types.ObjectId
  createdAt: Date
}

const OperationSchema = new Schema(
  {
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
  name: string
  variables: any
  query: string
  userId?: Types.ObjectId
}) => {
  if (data.query.includes('mutation')) {
    await new Operation(data).save()
  }
}
