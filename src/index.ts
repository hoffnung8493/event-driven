export * from './messages'
export * from './backend'
import { SubjectSummary } from './backend/models'
import mongoose, { startSession } from 'mongoose'

export const eventAdminInit = async (Subjects: string[], MONGO_URI: string) => {
  try {
    await mongoose.connect(MONGO_URI)
    mongoose.connection.on('error', (err) => {
      console.error('mongoose connection error - ', err)
      process.exit()
    })
    mongoose.connection.on('disconnected', (err) => {
      console.error('mongoose connection disconnected - ', err)
      process.exit()
    })

    const subjectSummaries = await SubjectSummary.find({ subject: { $in: Object.values(Subjects) } }).select({ subject: 1 })
    await Promise.all(
      Object.values(Subjects).map(async (subject) => {
        if (!subjectSummaries.find((v) => v.subject === subject))
          await new SubjectSummary({ subject, messageCount: 0, unresolvedErrorCount: 0 }).save()
      })
    )
  } catch (err) {
    console.error(err)
    throw err
  }
}
