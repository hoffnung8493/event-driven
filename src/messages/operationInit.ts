import { Types } from 'mongoose'
import { createOperation } from '../backend/models/Operation'
import { Request } from 'express'
import { OperationSummary } from '../backend/models'

export const operationInit = (req: Request, userId?: Types.ObjectId) => {
  const operationId = new Types.ObjectId()
  if (req.body.operationName === 'IntrospectionQuery') return operationId

  createOperation({
    _id: operationId,
    userId,
    operationName: req.body.operationName ?? '_NO_OPERATION_NAME_',
    variables: req.body.variables,
    query: req.body.query,
  })
  OperationSummary.updateOne(
    { operation: req.body.operationName },
    { $inc: { messageCount: 1, unresolvedErrorCount: 0 } },
    { upsert: true }
  ).exec()

  return operationId
}
