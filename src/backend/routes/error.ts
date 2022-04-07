import { EventError } from '../models'
import express from 'express'
import { JetStreamClient, StringCodec } from 'nats'

const sc = StringCodec()

export const errorRouter = (js: JetStreamClient) => {
  const router = express.Router()

  router.get('/', async (req, res) => {
    const errors = await EventError.find({ isResolved: false })
    return res.json(errors)
  })

  return router
}
