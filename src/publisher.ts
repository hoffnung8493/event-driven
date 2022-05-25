import { Types } from 'mongoose'
import { createEvent, Event } from './backend/models'
import { JetStreamClient, StringCodec, headers } from 'nats'
import { _showEventPublishes as showeEventPublishes } from './index'

const sc = StringCodec()

export interface PublisherInput {
  config: {
    js: JetStreamClient
    clientGroup: string
    parentIds: Types.ObjectId[]
    durableName?: string
  }
}

export interface PublisherConfig {
  js: JetStreamClient
  clientGroup: string
  parentIds: Types.ObjectId[]
  durableName?: string
}

export const Publisher = <T extends Event<string>>({ config, subject }: { config: PublisherConfig; subject: T['subject'] }) => {
  return (data: T['data'], uniqueId?: string) =>
    new Promise(async (resolve, reject) => {
      const { parentIds, clientGroup, durableName } = config
      try {
        const event = createEvent<T>({
          parentIds,
          durableName,
          clientGroup,
          subject,
          data,
        })
        const eventId = event._id
        const h = headers()
        h.append('eventId', eventId.toString())
        if (uniqueId) h.append('Nats-Msg-Id', uniqueId)
        const result = await config.js.publish(subject, sc.encode(JSON.stringify(data)), { headers: h })
        if (result.duplicate) return
        if (showeEventPublishes) console.log(`Event! - [${subject}]`)
        resolve({ eventId })
      } catch (err) {
        console.error('###PUBLISHER ERROR###', err, parentIds, clientGroup, durableName, data)
        reject(err)
      }
    })
}
