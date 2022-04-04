import { EventError, Event } from '../models'
import express from 'express'
import { JetStreamClient, StringCodec, headers } from 'nats'

const sc = StringCodec()

export const errorRouter = (js: JetStreamClient) => {
  const router = express.Router()

  router.get('/', async (req, res) => {
    const errors = await EventError.find({ isResolved: false })
    return res.json(errors)
  })

  router.put('/:errorId/retry', async (req, res) => {
    try {
      const { errorId } = req.params
      const eventError = await EventError.findOneAndUpdate(
        { _id: errorId, isResolved: false },
        { isResolved: true },
        { new: true }
      )
      if (!eventError) throw new Error('Cannot find eventError')
      const event = await Event.findById(eventError.parentId)
      if (!event) throw new Error('Cannot find event')

      const h = headers()
      h.append('eventId', eventError.parentId.toString())
      h.append('operationId', eventError.operationId.toString())
      h.append('retryingDurableName', eventError.durableName)
      await js.publish(event.subject, sc.encode(JSON.stringify(event.data)))

      return res.json({})
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  return router
}
