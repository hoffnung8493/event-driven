import { Schema, Document, model } from 'mongoose'

export interface StreamSummaryDoc extends Document {
  stream: string
  subjects: string[]
}

const StreamSummarySchema = new Schema(
  {
    stream: { type: String, required: true },
    subjects: [{ type: String, required: true }],
  },
  { timestamps: true }
)

export const StreamSummary = model<StreamSummaryDoc>('StreamSummary', StreamSummarySchema)
