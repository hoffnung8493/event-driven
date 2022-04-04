import express from 'express'
import { JetStreamManager } from 'nats'
import { StreamSummary } from '../models'

export const streamRouter = (jsm: JetStreamManager) => {
  const router = express.Router()

  router.get('/', async (req, res) => {
    const streams = await jsm.streams.list().next()
    res.send(streams)
  })

  // router.delete('/:streamName', async (req, res) => {
  //   try {
  //     // prevent stream delete if consumers, messages exist
  //     const result = await jsm.streams.delete(req.params.streamName)
  //     res.json(result)
  //   } catch (err) {
  //     res.status(500).send(err)
  //   }
  // })

  router.get('/:stream', async (req, res) => {
    const { stream } = req.params
    const [streamSummary, streamInfo, consumers] = await Promise.all([
      StreamSummary.findOne({ stream }),
      jsm.streams.info(stream),
      jsm.consumers.list(stream).next(),
    ])
    res.send({ streamSummary, streamInfo, consumers })
  })

  // router.post('/:streamName', async (req, res) => {
  //   const { streamName } = req.params
  //   const streamInfo = await jsm.streams.info(streamName)
  //   streamInfo.config.subjects.push(req.body.subject)
  //   await jsm.streams.update(streamName, streamInfo.config)
  //   res.json(streamInfo)
  // })

  // router.delete('/:streamName/subject/:subject', async (req, res) => {
  //   const { streamName, subject } = req.params
  //   const streamInfo = await jsm.streams.info(streamName)
  //   streamInfo.config.subjects = streamInfo.config.subjects!.filter((s) => s !== subject)
  //   await jsm.streams.update(streamName, streamInfo.config)
  //   res.json(streamInfo)
  // })

  return router
}
