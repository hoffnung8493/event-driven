import { RedisClientType } from 'redis'
import { Types } from 'mongoose'
import { createEvent, Event, EventError } from './backend/models'

export interface PublisherInput {
  config: {
    client: RedisClientType<any, any>
    clientGroup: string
    parentId: Types.ObjectId
    operationId: Types.ObjectId
  }
}

export const Publisher = <T extends Event<string>>({
  config,
  subject,
}: {
  config: {
    client: RedisClientType<any, any>
    clientGroup: string
    operationId: Types.ObjectId
    parentId: Types.ObjectId
  }
  subject: T['subject']
}) => {
  const receivedAt = new Date()
  return (data: T['data']) =>
    new Promise(async (resolve, reject) => {
      try {
        const eventId = new Types.ObjectId()

        await config.client.sendCommand([
          'XADD',
          subject,
          '*',
          'operationId',
          config.operationId.toHexString(),
          'eventId',
          eventId.toHexString(),
          'data',
          JSON.stringify(data),
        ])
        //@ts-ignore
        console.log(`Event! - [${subject}]`)
        const { operationId, parentId, clientGroup } = config
        const event = await createEvent<T>({
          _id: eventId,
          operationId,
          parentId,
          clientGroup,
          subject,
          data,
          receivedAt,
          publishedAt: new Date(),
          republish: [],
        })
        EventError.updateOne({ operationId, parentId, clientGroup }, { 'resolvedBy.eventId': event._id }).exec()
        resolve({ eventId })
      } catch (err) {
        console.error(err)
        reject(err)
      }
    })
}
