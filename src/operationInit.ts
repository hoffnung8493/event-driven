import { Types } from 'mongoose'
import { createOperation, OperationType } from './backend/models/Operation'

export const operationInit = (input: {
  type: OperationType
  name: string
  query: string
  variables: any
  userId?: Types.ObjectId
}) => {
  const operationId = new Types.ObjectId()
  createOperation({
    _id: operationId,
    ...input,
  })
  return operationId
}

// if (req.body.operationName === 'IntrospectionQuery') return operationId
//   createOperation({
//     _id: operationId,
//     type,
//     userId,
//     name: req.body.operationName ?? '_NO_OPERATION_NAME_',
//     variables: req.body.variables,
//     query: req.body.query,
//   })
//   return operationId
