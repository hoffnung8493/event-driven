// import { Log, LogType } from '../models'
import express from 'express'
import { JetStreamClient, StringCodec, headers } from 'nats'

const sc = StringCodec()

export const eventRouter = (js: JetStreamClient) => {
  const router = express.Router()

  router.put('/:eventId/retry', async (req, res) => {
    try {
      // const { eventId } = req.params
      // const { durableName } = req.body
      // const event = await Log.findById(eventId)
      // if (!event) throw new Error('Cannot find event')
      // if (event.type !== LogType.Event) throw new Error('This log is not an event')

      // const h = headers()
      // h.append('eventId', eventId)
      // h.append('retryingDurableName', durableName)
      // await js.publish(event.subject, sc.encode(JSON.stringify(event.data)))

      return res.json({})
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  return router
}
