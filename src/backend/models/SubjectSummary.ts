import { Schema, Document, connection } from 'mongoose'
import { database } from './database'

export interface SubjectSummaryDoc extends Document {
  subject: string
  messageCount: number
  unresolvedErrorCount: number
}

const SubjectSummarySchema = new Schema(
  {
    subject: { type: String, required: true },
    messageCount: { type: Number, required: true, default: 0 },
    unresolvedErrorCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
)

export const SubjectSummary = connection.useDb(database).model<SubjectSummaryDoc>('subjectsummary', SubjectSummarySchema)
