import { MessageError, Message } from '../models'
import express from 'express'
import { RedisClientType } from 'redis'

export const errorRouter = (redis: RedisClientType<any, any>) => {
  const router = express.Router()

  router.get('/', async (req, res) => {
    try {
      const errors = await MessageError.find({ resolvedAt: { $exists: false } })
      return res.json(errors)
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  router.put('/:errorId/retry', async (req, res) => {
    try {
      const { errorId } = req.params
      const msgError = await MessageError.findById(errorId)
      if (!msgError) throw new Error('Cannot find msgError')
      if (msgError.resolvedBy.messageId) throw new Error('This error is already resolved')
      const message = await Message.findById(msgError.parentId)
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
      await msgError.updateOne(
        { _id: msgError._id },
        { $push: { republish: { targetClientGroup: msgError.clientGroup, createdAt: new Date() } } }
      )
      return res.json({})
    } catch (err) {
      console.error(err)
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  return router
}
