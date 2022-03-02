import express from 'express'
import { RedisClientType } from 'redis'
import { getValue, getEntry } from '../../redisParser'
import { Message, MessageError, SubjectSummary } from '../models'

export const infoRouter = (redis: RedisClientType<any, any>) => {
  const router = express.Router()

  // router.get('/client-groups', async (req, res) => {
  //   try {
  //     return res.json(Object.values(ClientGroups))
  //   } catch (err) {
  //     if (err instanceof Error) res.status(500).json(err.message)
  //     else res.status(500).json('something went wrong')
  //   }
  // })

  router.get('/subjects', async (req, res) => {
    try {
      const subjectSummaries = await SubjectSummary.find({}).sort({ subject: 1 })
      return res.json(subjectSummaries)
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  router.get('/subjects/:subject', async (req, res) => {
    try {
      const { subject } = req.params
      const messages = await Message.find({ subject }).sort({ _id: -1 }).limit(10)
      res.json(messages)
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  router.get('/subjects/:subject/errors', async (req, res) => {
    try {
      const { subject } = req.params
      const errors = await MessageError.find({ subject, resolvedAt: { $exists: false } })
      return res.json(errors)
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  router.get('/subjects/:subject/stream', async (req, res) => {
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
