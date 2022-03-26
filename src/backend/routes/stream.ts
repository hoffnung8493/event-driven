import express from 'express'
import { JetStreamManager, AckPolicy } from 'nats'
import { Config } from '../models'

export const streamRouter = (jsm: JetStreamManager) => {
  const router = express.Router()

  router.get('/', async (req, res) => {
    const streams = await jsm.streams.list().next()
    res.send(streams)
  })
  router.post('/', async (req, res) => {
    try {
      const { stream } = req.body
      if (!stream) throw new Error('stream must be provided')
      const config = await Config.findOne({})
      if (!config) throw new Error('Config is not initialized')
      const result = await jsm.streams.add({ name: stream, subjects: [`${stream}.*`, `${stream}.*.*`, `${stream}.*.*.*`] })
      // await Promise.all(
      //   config.modules.map((module) => jsm.consumers.add(stream, { durable_name: module, ack_policy: AckPolicy.Explicit,  }))
      // )

      res.json(result)
    } catch (err) {
      res.status(500).send(err)
    }
  })

  router.delete('/:streamName', async (req, res) => {
    try {
      // prevent stream delete if consumers, messages exist
      const result = await jsm.streams.delete(req.params.streamName)
      res.json(result)
    } catch (err) {
      res.status(500).send(err)
    }
  })

  router.get('/:streamName', async (req, res) => {
    const { streamName } = req.params
    const [streamInfo, consumers] = await Promise.all([jsm.streams.info(streamName), jsm.consumers.list(streamName).next()])
    res.send({ streamInfo, consumers })
  })

  router.post('/:streamName', async (req, res) => {
    const { streamName } = req.params
    const streamInfo = await jsm.streams.info(streamName)
    streamInfo.config.subjects.push(req.body.subject)
    await jsm.streams.update(streamName, streamInfo.config)
    res.json(streamInfo)
  })

  router.delete('/:streamName/subject/:subject', async (req, res) => {
    const { streamName, subject } = req.params
    const streamInfo = await jsm.streams.info(streamName)
    streamInfo.config.subjects = streamInfo.config.subjects!.filter((s) => s !== subject)
    await jsm.streams.update(streamName, streamInfo.config)
    res.json(streamInfo)
  })

  return router
}
