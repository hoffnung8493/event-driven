import { Schema, Document, model } from 'mongoose'

export interface EventSummaryDoc extends Document {
  subject: string
  count: number
  unresolvedErrorCount: number
}

const EventSummarySchema = new Schema(
  {
    subject: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    unresolvedErrorCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
)

export const EventSummary = model<EventSummaryDoc>('EventSummary', EventSummarySchema)
