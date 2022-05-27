export * from './publisher'
export * from './subscribers'
import { __NO_ACK__ } from './backend'
export * from './backend'
import { ObjectId } from 'mongodb'
import { StreamSummary, EventError, Event, TriggerError, SubscriptionError } from './backend/models'
import mongoose from 'mongoose'
import { JetStreamManager } from 'nats'
export let _showError = false
export let _showProcessTimeWarning: number | undefined
export let _showEventPublishes = false
export let _maxRetryCount = 5
import { CronJob } from 'cron'

export const durableNames: string[] = []

export const eventStoreInit = async ({
  subjects,
  MONGO_URI,
  dbName,
  jsm,
  maxRetryCount = 5,
  maxLogAgeSecs = 7 * 24 * 60 * 60,
  logs,
}: {
  subjects: string[]
  MONGO_URI: string
  dbName: string
  jsm: JetStreamManager
  maxRetryCount: number
  maxLogAgeSecs: number
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

    const runEventArbiter = async () => {
      const [streamSummaries, streams] = await Promise.all([StreamSummary.find({}), jsm.streams.list().next()])

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
            if (!streams.find((s) => s.config.name)) {
              await jsm.streams.add({
                name: stream,
                subjects: [`${stream}.*`, `${stream}.*.*`, `${stream}.*.*.*`],
                max_age: 6 * 60 * 60 * 1000 * 1000 * 1000,
              })
              console.log(`New stream created: ${stream}`)
            }

            const exists = streamSummaries.find((s) => s.stream === stream)
            if (exists) {
              const newSubjects = subjects.filter((subject) => !exists.subjects.includes(subject))
              if (newSubjects.length === 0) return
              await StreamSummary.updateOne({ stream }, { $addToSet: { subjects: { $each: newSubjects } } })
              console.log(`stream summary updated: ${stream}`)
            } else {
              await new StreamSummary({ stream, subjects }).save()
              console.log(`stream summary created: ${stream}`)
            }
          })
      )
      new CronJob('0 0 */1 * * *', async () => {
        const _id = ObjectId.createFromTime(Math.floor(new Date().getTime() / 1000) - maxLogAgeSecs)
        await Event.deleteMany({ _id: { $lt: _id } })
        await TriggerError.deleteMany({ _id: { $lt: _id } })
        await EventError.deleteMany({ _id: { $lt: _id } })
        await SubscriptionError.deleteMany({ _id: { $lt: _id } })
      }).start()
      new CronJob('0 */15 * * * *', async () => {
        await EventError.updateMany(
          {
            updatedAt: { $lt: new Date(new Date().getTime() - 60 * 60 * 1000) },
            errorCount: { $lt: _maxRetryCount },
            isResolved: false,
          },
          { isResolved: true }
        )
        await SubscriptionError.updateMany(
          {
            updatedAt: { $lt: new Date(new Date().getTime() - 60 * 60 * 1000) },
            errorCount: { $lt: _maxRetryCount },
            'error.message': { $ne: __NO_ACK__ },
            isResolved: false,
          },
          { isResolved: true }
        )
      }).start()
    }

    process.on('SIGINT', () => mongoose.connection.close())

    return { runEventArbiter }
  } catch (err) {
    console.error(err)
    throw err
  }
}
