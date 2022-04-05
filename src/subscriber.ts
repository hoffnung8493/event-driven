import { Event, createEventError } from './backend/models'
import { Types } from 'mongoose'
import { JsMsg, JetStreamClient, StringCodec, consumerOpts } from 'nats'
import { _maxRetryCount as maxRetryCount, _showError as showError, _showProcessTimeWarning as showProcessTimeWarning } from '.'

const sc = StringCodec()

type EventHandler<ParentEvent extends Event<string>> = (event: {
  input: ParentEvent['data']
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
}) => Promise<any>

export const Subscriber = ({
  clientGroup,
  js,
  batch,
  expires,
}: {
  clientGroup: string
  js: JetStreamClient
  batch: number
  expires: number
}) => {
  return async <ParentEvent extends Event<string>>({
    subject,
    eventHandlers,
  }: {
    subject: ParentEvent['subject']
    eventHandlers: EventHandler<ParentEvent>[]
  }) => {
    for (let i = 0; i < eventHandlers.length; i++) {
      const durableName = `${clientGroup}=${subject.replace(/\./g, '-')}=${i}`
      try {
        const opts = consumerOpts()
        opts.ackWait(30000)
        opts.manualAck()
        opts.durable(durableName)
        opts.maxAckPending(500)
        opts.callback(async (err, m) => {
          if (m)
            await processEvent(
              m,
              maxRetryCount,
              js,
              clientGroup,
              eventHandlers[i],
              durableName,
              subject,
              i,
              showError,
              showProcessTimeWarning
            )
        })

        const psub = await js.pullSubscribe(subject, opts)

        psub.pull({ batch, expires })
        setInterval(() => {
          psub.pull({ batch, expires })
        }, expires + 1000)
      } catch (err) {
        console.error(`clientGroup: ${clientGroup}, index: ${i}, subject: ${subject}`)
        throw err
      }
    }
  }
}

const processEvent = async <ParentEvent extends Event<string>>(
  jsMsg: JsMsg,
  maxRetryCount: number,
  js: JetStreamClient,
  clientGroup: string,
  eventHandler: EventHandler<ParentEvent>,
  durableName: string,
  subject: string,
  eventHandlerOrder: number,
  showError: boolean,
  showProcessTimeWarning?: number
) => {
  const headers = jsMsg.headers
  const eventId = headers?.get('eventId')
  const operationId = new Types.ObjectId(headers?.get('operationId'))
  const parentId = new Types.ObjectId(eventId)
  const msgData = JSON.parse(sc.decode(jsMsg.data))
  const retryingDurableName = headers?.get('retryingDurableName')
  if (retryingDurableName && retryingDurableName !== durableName) {
    jsMsg.ack()
    return
  }
  const fail = getFail(
    jsMsg,
    operationId,
    parentId,
    durableName,
    clientGroup,
    subject,
    eventHandlerOrder,
    maxRetryCount,
    showError
  )
  try {
    let start = new Date()
    await eventHandler({
      input: msgData,
      config: {
        js,
        clientGroup,
        operationId,
        parentId,
        subscribedTo: {
          durableName,
          subject,
          eventHandlerOrder,
        },
      },
    })
    let diff = new Date().getTime() - start.getTime()
    if (showProcessTimeWarning && showProcessTimeWarning < diff)
      console.log('\x1b[33m%s\x1b[0m', `[WARNING-TIME] durableName: ${durableName} ${diff / 1000}s, eventId:${parentId}`)
    jsMsg.ack()
  } catch (error) {
    await fail(error as Error)
  }
}

export const getFail =
  (
    jsMsg: JsMsg,
    operationId: Types.ObjectId,
    parentId: Types.ObjectId,
    durableName: string,
    clientGroup: string,
    subject: string,
    eventHandlerOrder: number,
    maxRetryCount: number,
    showError: boolean
  ) =>
  async (error: Error) => {
    const eventError = await createEventError({
      operationId,
      parentId,
      durableName,
      clientGroup,
      subject,
      eventHandlerOrder,
      error,
    })

    if (showError) console.error('\x1b[31m%s\x1b[0m', `${durableName}`, error)
    const { errorCount } = eventError
    console.error(
      '\x1b[31m%s\x1b[0m',
      `Failed ${errorCount} times, durableName: ${durableName}, errMsg: ${error.message}, eventId:${parentId}`
    )
    if (errorCount >= maxRetryCount) {
      console.log('\x1b[41m%s\x1b[0m', `Error added to dead letter queue`)
      jsMsg.ack()
    } else jsMsg.nak((errorCount - 1) * 5000)
  }
