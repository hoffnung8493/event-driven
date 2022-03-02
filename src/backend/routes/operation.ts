import express from 'express'
import { Event, EventError, Operation, OperationError } from '../models'

export const operationRouter = () => {
  const router = express.Router()

  router.get('/:operationId', async (req, res) => {
    try {
      const { operationId } = req.params
      const [events, eventErrors, operation, operationError] = await Promise.all([
        Event.find({ operationId }),
        EventError.find({ operationId }),
        Operation.findOne({ _id: operationId }),
        OperationError.findOne({ operationId }),
      ])
      res.json({ events, eventErrors, operation, operationError })
    } catch (err) {
      if (err instanceof Error) res.status(500).json(err.message)
      else res.status(500).json('something went wrong')
    }
  })

  return router
}
