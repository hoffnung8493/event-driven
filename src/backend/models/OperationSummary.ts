import { Schema, Document, model } from 'mongoose'

export interface OperationSummaryDoc extends Document {
  operation: string
  count: number
  unresolvedErrorCount: number
}

const OperationSummarySchema = new Schema(
  {
    operation: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    unresolvedErrorCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
)

export const OperationSummary = model<OperationSummaryDoc>('operationsummary', OperationSummarySchema)
