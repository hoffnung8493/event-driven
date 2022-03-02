import express from 'express'
import { RedisClientType } from 'redis'
import { getValue, getEntry } from '../../redisParser'
import { Event, EventError, EventSummary } from '../models'
import { Types } from 'mongoose'

export const subjectRouter = (redis: RedisClientType<any, any>) => {
  const router = express.Router()

  router.get('/', async (req, res) => {
    try {
      const subjectSummaries = await EventSummary.find({}).sort({ subject: 1 })
      return res.json(subjectSummaries)
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  router.get('/:subject', async (req, res) => {
    try {
      const { subject } = req.params
      const sDate = req.query.sDate as string | undefined
      const eDate = req.query.eDate as string | undefined
      if (!sDate || !eDate) throw new Error('sDate, eDate are required')
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20
      const cursor = req.query.cursor ? new Types.ObjectId(req.query.offset as string) : new Types.ObjectId()
      const query = { subject, createdAt: { $gte: new Date(sDate), $lte: new Date(eDate) }, _id: { $lt: cursor } }
      const [events, count] = await Promise.all([Event.find(query).limit(limit), Event.find(query).countDocuments()])
      res.json({ events, count })
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  router.get('/:subject/errors', async (req, res) => {
    try {
      const { subject } = req.params
      const sDate = req.query.sDate as string | undefined
      const eDate = req.query.eDate as string | undefined
      if (!sDate || !eDate) throw new Error('sDate, eDate are required')
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20
      const cursor = req.query.cursor ? new Types.ObjectId(req.query.offset as string) : new Types.ObjectId()
      const query = {
        subject,
        createdAt: { $gte: new Date(sDate), $lte: new Date(eDate) },
        _id: { $lt: cursor },
        resolvedAt: { $exists: false },
      }
      const [errors, count] = await Promise.all([EventError.find(query).limit(limit), EventError.find(query).countDocuments()])
      return res.json({ errors, count })
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  router.get('/:subject/stream', async (req, res) => {
    try {
      const { subject } = req.params
      const streamInfo = await getFullStreamInfo(subject, redis)
      res.json(streamInfo)
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  return router
}

const getFullStreamInfo = async (subject: string, redis: RedisClientType<any, any>) => {
  try {
    const [streamInfo, clientGroupInfo] = (await Promise.all([
      redis.sendCommand(['XINFO', 'STREAM', subject]),
      redis.sendCommand(['XINFO', 'GROUPS', subject]),
    ])) as [string[], string[][]]
    const subscribedClientGroups = await Promise.all(
      clientGroupInfo.map(async (data: string[]) => {
        const clientGroupName = getValue('name', data)
        const consumers = (await redis.sendCommand(['XINFO', 'CONSUMERS', subject, clientGroupName])) as string[][]
        return {
          name: getValue('name', data),
          pendingMessagesCount: getValue('pending', data),
          lastDeliveredId: getValue('last-delivered-id', data),
          consumers: consumers.map((cData: string[]) => ({
            name: getValue('name', cData),
            pendingMessagesCount: getValue('pending', cData),
            idle: getValue('idle', cData),
          })),
        }
      })
    )
    return {
      subject,
      messagesCount: getValue('length', streamInfo),
      lastGeneratedId: getValue('last-generated-id', streamInfo),
      subscribedClientGroups,
      firstEntry: getEntry(getValue('first-entry', streamInfo)),
      lastEntry: getEntry(getValue('last-entry', streamInfo)),
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'ERR no such key') return null
    console.error(err)
  }
}
