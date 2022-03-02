import express from 'express'
import { Types } from 'mongoose'
import { RedisClientType } from 'redis'
import { Message, MessageError, Operation } from '../models'

export const messageRouter = (redis: RedisClientType<any, any>) => {
  const router = express.Router()

  router.get('/subjects/:subject', async (req, res) => {
    try {
      const { subject } = req.params
      const sDate = req.query.sDate as string | undefined
      const eDate = req.query.eDate as string | undefined
      if (!sDate || !eDate) throw new Error('sDate, eDate are required')
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20
      const cursor = req.query.cursor ? new Types.ObjectId(req.query.offset as string) : new Types.ObjectId()
      const query = { subject, createdAt: { $gte: new Date(sDate), $lte: new Date(eDate) }, _id: { $lt: cursor } }
      const [messages, count] = await Promise.all([Message.find(query).limit(limit), Message.find(query).countDocuments()])
      res.json({ messages, count })
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  router.get('/operations/:operationId', async (req, res) => {
    try {
      const { operationId } = req.params
      const [messages, operation, messageErrors] = await Promise.all([
        Message.find({ operationId }),
        Operation.findOne({ _id: operationId }),
        MessageError.find({ operationId }),
      ])
      res.json({ operation, messages, messageErrors })
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  return router
}
