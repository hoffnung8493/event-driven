import { Schema, Document, connection } from 'mongoose'
import { database } from './database'

export interface OperationSummaryDoc extends Document {
  operation: string
  messageCount: number
  unresolvedErrorCount: number
}

const OperationSummarySchema = new Schema(
  {
    operation: { type: String, required: true },
    messageCount: { type: Number, required: true, default: 0 },
    unresolvedErrorCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
)

export const OperationSummary = connection.useDb(database).model<OperationSummaryDoc>('operationsummary', OperationSummarySchema)
