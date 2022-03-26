import express from 'express'
import { JetStreamManager } from 'nats'
import { Config } from '../models'

export const moudleRouter = (jsm: JetStreamManager) => {
  const router = express.Router()

  router.get('/', async (req, res) => {
    const config = await Config.findOne({})
    if (config) return res.send(config.modules)
    const newConfig = await new Config({ modules: [] }).save()
    return res.send(newConfig.modules)
  })

  router.post('/', async (req, res) => {
    try {
      const { module } = req.body
      const config = await Config.findOne({})
      if (!config) throw new Error('Config is not initialized')
      if (config.modules.find((v) => v === module)) throw new Error('This module already exists')
      config.modules.push(module)
      // const streams = await jsm.streams.list().next()
      // await Promise.all(
      //   streams.map((stream) =>
      //     jsm.consumers.add(stream.config.name, {
      //       durable_name: module,
      //       ack_policy: AckPolicy.Explicit,
      //     })
      //   )
      // )
      await config.save()
      res.send({ module })
    } catch (err) {}
  })

  return router
}
