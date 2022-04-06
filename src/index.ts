export * from './operationInit'
export * from './publisher'
export * from './subscriber'
export * from './subscriberBatch'
export * from './backend'
import { StreamSummary, EventError } from './backend/models'
import mongoose, { Types } from 'mongoose'
import { JetStreamManager } from 'nats'
export let _showError = false
export let _showProcessTimeWarning: number | undefined
export let _showEventPublishes = false
export let _maxRetryCount = 5
import { CronJob } from 'cron'

export const runEventArbiter = () => {
  new CronJob('0 */15 * * * *', async () => {
    await EventError.updateMany(
      {
        updatedAt: { $lt: new Date(new Date().getTime() - 30 * 60 * 1000) },
        errorCount: { $lt: _maxRetryCount },
        isResolved: false,
      },
      { isResolved: true }
    )
  })
}

export const eventAdminInit = async ({
  subjects,
  MONGO_URI,
  dbName,
  jsm,
  maxRetryCount = 5,
  logs,
}: {
  subjects: string[]
  MONGO_URI: string
  dbName: string
  jsm: JetStreamManager
  maxRetryCount: number
  logs?: {
    showEventPublishes: boolean
    showError: boolean
    showProcessTimeWarning?: number
  }
}) => {
  _maxRetryCount = maxRetryCount
  _showEventPublishes = !!logs?.showEventPublishes
  _showError = !!logs?.showError
  _showProcessTimeWarning = logs?.showProcessTimeWarning
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

    process.on('SIGINT', () => mongoose.connection.close())

    const streamSummaries = await StreamSummary.find({})

    await Promise.all(
      subjects
        .map((subject) => ({ stream: subject.split('.')[0], subject }))
        .reduce<{ stream: string; subjects: string[] }[]>((a, c) => {
          let index = a.findIndex((v) => v.stream === c.stream)
          if (index >= 0) {
            a[index].subjects.push(c.subject)
            return a
          } else return [...a, { stream: c.stream, subjects: [c.subject] }]
        }, [])
        .map(async ({ stream, subjects }) => {
          const exists = streamSummaries.find((s) => s.stream === stream)
          if (exists) {
            const newSubjects = subjects.filter((subject) => !exists.subjects.includes(subject))
            if (newSubjects.length === 0) return
            await StreamSummary.updateOne({ stream }, { $addToSet: { subjects: { $each: newSubjects } } })
          } else {
            await jsm.streams.add({ name: stream, subjects: [`${stream}.*`, `${stream}.*.*`, `${stream}.*.*.*`] })
            await new StreamSummary({ stream, subjects }).save()
            console.log(`New stream created: ${stream}`)
          }
        })
    )
  } catch (err) {
    console.error(err)
    throw err
  }
}
