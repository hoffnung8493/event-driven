export * from './operationInit'
export * from './publisher'
export * from './subscriber'
export * from './backend'
import { EventSummary } from './backend/models'
import mongoose from 'mongoose'

export const eventAdminInit = async (Subjects: string[], MONGO_URI: string, dbName: string) => {
  try {
    await mongoose.connect(MONGO_URI, { dbName })
    mongoose.connection.on('error', (err) => {
      console.error('mongoose connection error - ', err)
      process.exit()
    })
    mongoose.connection.on('disconnected', (err) => {
      console.error('mongoose connection disconnected - ', err)
      process.exit()
    })
    const subjectSummaries = await EventSummary.find({ subject: { $in: Object.values(Subjects) } }).select({ subject: 1 })
    await Promise.all(
      Object.values(Subjects).map(async (subject) => {
        if (!subjectSummaries.find((v) => v.subject === subject))
          await new EventSummary({ subject, childClientGroups: [] }).save()
      })
    )
  } catch (err) {
    console.error(err)
    throw err
  }
}
