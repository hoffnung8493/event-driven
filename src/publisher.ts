import { Types } from 'mongoose'
import { createEvent, Event } from './backend/models'
import { JetStreamClient, StringCodec, headers } from 'nats'
import { _showEventPublishes as showeEventPublishes } from './index'

const sc = StringCodec()

export interface PublisherInput {
  config: {
    js: JetStreamClient
    clientGroup: string
    parentId: Types.ObjectId
    operationId: Types.ObjectId
    subscribedTo?: {
      durableName: string
      subject: string
      eventHandlerOrder: number
    }
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
    subscribedTo?: {
      durableName: string
      subject: string
      eventHandlerOrder: number
    }
  }
  subject: T['subject']
}) => {
  const receivedAt = new Date()
  return (data: T['data'], uniqueId?: string) =>
    new Promise(async (resolve, reject) => {
      try {
        const eventId = new Types.ObjectId()
        const h = headers()
        h.append('eventId', eventId.toString())
        h.append('operationId', config.operationId.toString())
        if (uniqueId) h.append('Nats-Msg-Id', uniqueId)
        const result = await config.js.publish(subject, sc.encode(JSON.stringify(data)), { headers: h })
        if (result.duplicate) return
        if (showeEventPublishes) console.log(`Event! - [${subject}]`)
        const { operationId, parentId, clientGroup, subscribedTo } = config
        await createEvent<T>({
          _id: eventId,
          operationId,
          parentId,
          clientGroup,
          subject,
          data,
          receivedAt,
          publishedAt: new Date(),
          republish: [],
          subscribedTo,
        })
        resolve({ eventId })
      } catch (err) {
        console.error(err)
        reject(err)
      }
    })
}
