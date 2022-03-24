import { EventError, Event } from '../models'
import express from 'express'
import { RedisClientType } from 'redis'

export const errorRouter = (redis: RedisClientType<any, any>) => {
  const router = express.Router()

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

      await redis.sendCommand([
        'XADD',
        event.subject,
        '*',
        'operationId',
        eventError.operationId.toHexString(),
        'eventId',
        eventError.parentId.toHexString(),
        'data',
        JSON.stringify(event.data),
        'retryingClientGroup',
        eventError.clientGroup,
      ])
      return res.json({})
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  return router
}
