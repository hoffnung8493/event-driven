import { EventError, Event } from '../models'
import express from 'express'
import { RedisClientType } from 'redis'

export const errorRouter = (redis: RedisClientType<any, any>) => {
  const router = express.Router()

  router.put('/:errorId/retry', async (req, res) => {
    try {
      const { errorId } = req.params
      const msgError = await EventError.findById(errorId)
      if (!msgError) throw new Error('Cannot find msgError')
      if (msgError.resolvedBy.eventId) throw new Error('This error is already resolved')
      const message = await Event.findById(msgError.parentId)
      if (!message) throw new Error('Cannot find message')

      await redis.sendCommand([
        'XADD',
        message.subject,
        '*',
        'operationId',
        msgError.operationId.toHexString(),
        'eventId',
        msgError.parentId.toHexString(),
        'data',
        JSON.stringify(message.data),
        'retryingClientGroup',
        msgError.clientGroup,
      ])
      await msgError
        .updateOne(
          { _id: msgError._id },
          { $push: { republish: { targetClientGroup: msgError.clientGroup, createdAt: new Date() } } }
        )
        .exec()
      return res.json({})
    } catch (err) {
      console.error(err)
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  return router
}
