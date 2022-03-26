import { Types } from 'mongoose'
import { createEvent, Event, EventError } from './backend/models'
import { JetStreamClient, StringCodec, headers } from 'nats'

const sc = StringCodec()

export interface PublisherInput {
  config: {
    js: JetStreamClient
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
    js: JetStreamClient
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
        const h = headers()
        h.append('eventId', eventId.toString())
        h.append('operationId', config.operationId.toString())
        await config.js.publish(subject, sc.encode(JSON.stringify(data)), { headers: h })

        // await config.client.sendCommand([
        //   'XADD',
        //   subject,
        //   '*',
        //   'operationId',
        //   config.operationId.toHexString(),
        //   'eventId',
        //   eventId.toHexString(),
        //   'data',
        //   JSON.stringify(data),
        // ])
        // //@ts-ignore
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
