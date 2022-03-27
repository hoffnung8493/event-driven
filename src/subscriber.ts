import { createEventError, Event } from './backend/models'
import { Types } from 'mongoose'
import { JsMsg, JetStreamClient, StringCodec, AckPolicy } from 'nats'

const sc = StringCodec()

type EventHandler<ParentEvent extends Event<string>> = (event: {
  input: ParentEvent['data']
  config: {
    js: JetStreamClient
    clientGroup: string
    parentId: Types.ObjectId
    operationId: Types.ObjectId
  }
}) => Promise<any>

export const Subscriber = async (clientGroup: string, js: JetStreamClient) => {
  return async <ParentEvent extends Event<string>>({
    subject,
    eventHandlers,
  }: {
    subject: ParentEvent['subject']
    eventHandlers: EventHandler<ParentEvent>[]
  }) => {
    for (let i = 0; i < eventHandlers.length; i++) {
      const durable_name = `${clientGroup}=${subject.replace(/\./g, '-')}=${i}`
      try {
        const psub = await js.pullSubscribe(subject, {
          config: {
            durable_name,
            max_ack_pending: 30,
            ack_wait: 10000000000,
          },
          mack: true,
        })

        const done = (async () => {
          for await (const m of psub) await processEvent(m, js, clientGroup, eventHandlers[i])
        })()

        psub.pull({ batch: 10, expires: 10000 })
        setInterval(() => {
          psub.pull({ batch: 10, expires: 10000 })
        }, 10000)
      } catch (err) {
        console.error(`clientGroup: ${clientGroup}, index: ${i}, subject: ${subject}`)
        throw err
      }
    }
  }
}

const processEvent = async <ParentEvent extends Event<string>>(
  jsMsg: JsMsg,
  js: JetStreamClient,
  clientGroup: string,
  eventHandler: EventHandler<ParentEvent>
) => {
  const headers = jsMsg.headers
  const eventId = headers?.get('eventId')
  const operationId = new Types.ObjectId(headers?.get('operationId'))
  const parentId = new Types.ObjectId(eventId)
  const msgData = JSON.parse(sc.decode(jsMsg.data))
  const retryingClientGroup = headers?.get('retryingClientGroup')
  if (retryingClientGroup && retryingClientGroup !== clientGroup) {
    jsMsg.ack()
    return
  }
  const fail = async (error: Error) => {
    const eventError = await createEventError({ operationId, parentId, clientGroup, error })
    const { errorCount } = eventError
    console.error(`Failed ${errorCount} times, clientGroup: ${clientGroup}, errMsg: ${error.message} eventId:${parentId}`)
    if (errorCount > 4) {
      console.log(`Error added to dead letter queue`)
      jsMsg.ack()
    }
  }
  try {
    await eventHandler({
      input: msgData,
      config: {
        js,
        clientGroup,
        operationId,
        parentId,
      },
    })
    jsMsg.ack()
  } catch (error) {
    await fail(error as Error)
  }
}
