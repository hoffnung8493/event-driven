import express from 'express'
import { Event, EventError, EventSummary } from '../models'
import { Types } from 'mongoose'
import { JetStreamClient } from 'nats'

export const subjectRouter = (js: JetStreamClient) => {
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

  return router
}
