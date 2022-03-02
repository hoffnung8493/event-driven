import { RedisClientType } from 'redis'
import { Types } from 'mongoose'
import { createEvent, Event, EventError, EventSummary } from './backend/models'

export interface PublisherInput<ClientGroups extends string> {
  client: RedisClientType<any, any>
  clientGroup: ClientGroups
  parentId: Types.ObjectId
  operationId: Types.ObjectId
}

export const Publisher = <Subjects extends string, ClientGroups extends string, T extends Event<Subjects>>({
  client,
  clientGroup,
  operationId,
  parentId,
  subject,
}: {
  client: RedisClientType<any, any>
  clientGroup: ClientGroups
  operationId: Types.ObjectId
  parentId: Types.ObjectId
  subject: T['subject']
}) => {
  const receivedAt = new Date()
  return (data: T['data']) =>
    new Promise(async (resolve, reject) => {
      try {
        const eventId = new Types.ObjectId()

        await client.sendCommand([
          'XADD',
          subject,
          '*',
          'operationId',
          operationId.toHexString(),
          'eventId',
          eventId.toHexString(),
          'data',
          JSON.stringify(data),
        ])
        //@ts-ignore
        console.log(`Event! - [${subject}]`)
        const event = await createEvent<ClientGroups, Subjects, T>({
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
        EventError.updateOne({ operationId, parentId, clientGroup }, { 'resolvedBy.messageId': event._id }).exec()
        EventSummary.updateOne({ subject }, { $inc: { count: 1 } }).exec()
        resolve({ eventId })
      } catch (err) {
        console.error(err)
        reject(err)
      }
    })
}
