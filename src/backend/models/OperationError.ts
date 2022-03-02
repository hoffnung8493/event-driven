import { Schema, Document, Types, model } from 'mongoose'
import { OperationDoc, OperationSummaryDoc } from '.'

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

export const operationErrorCreate = async ({ operationId, error }: { operationId: Types.ObjectId; error: any }) => {
  new OperationError({ operationId, errMessage: error.message, errStack: error.stack }).save()
  const operation = await model<OperationDoc>('operation').findById(operationId)
  model<OperationSummaryDoc>('operationsummary')
    .findOneAndUpdate({ operation: operation!.name }, { $inc: { count: 0, unresolvedErrorCount: 1 } }, { upsert: true })
    .exec()
}
