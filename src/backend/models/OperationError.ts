import { Schema, Document, Types, model } from 'mongoose'

export interface OperationErrorDoc extends Document {
  operationId: Types.ObjectId
  errMessage: string
  errStack?: string
}

const OperationErrorSchema = new Schema({
  operationId: { type: Types.ObjectId, required: true },
  errMessage: { type: String, required: true },
  errStack: String,
})

export const OperationError = model<OperationErrorDoc>('OperationError', OperationErrorSchema)

export const operationErrorCreate = async ({ operationId, error }: { operationId: Types.ObjectId; error: any }) =>
  new OperationError({ operationId, errMessage: error.message, errStack: error.stack }).save()
