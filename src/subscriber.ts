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
    durableName?: string
  }
}) => Promise<any>

export const Subscriber = ({
  clientGroup,
  js,
  batch,
  expires,
  interval,
}: {
  clientGroup: string
  js: JetStreamClient
  batch: number
  expires: number
  interval: number
}) => {
  return async <ParentEvent extends Event<string>>({
    subject,
    eventHandlers,
  }: {
    subject: ParentEvent['subject']
    eventHandlers: EventHandler<ParentEvent>[]
  }) => {
    for (let i = 0; i < eventHandlers.length; i++) {
      const durableName = `${clientGroup}=${subject.replace(/\./g, '-')}=0=${i}`
      try {
        const opts = consumerOpts()
        opts.ackWait(30000)
        opts.manualAck()
        opts.durable(durableName)
        opts.maxAckPending(500)

        const psub = await js.pullSubscribe(subject, opts)

        ;(async () => {
          for await (const m of psub)
            processEvent(
              m,
              maxRetryCount,
              js,
              clientGroup,
              eventHandlers[i],
              durableName,
              subject,
              showError,
              showProcessTimeWarning
            )
        })()

        psub.pull({ batch, expires })
        setInterval(() => {
          psub.pull({ batch, expires })
        }, interval)
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
  showError: boolean,
  showProcessTimeWarning?: number
) => {
  const headers = jsMsg.headers
  const eventId = headers?.get('eventId')
  const parentId = new Types.ObjectId(eventId)
  const msgData = JSON.parse(sc.decode(jsMsg.data))
  const retryingDurableName = headers?.get('retryingDurableName')
  if (retryingDurableName && retryingDurableName !== durableName) {
    jsMsg.ack()
    return
  }
  const fail = getFail(jsMsg, parentId, durableName, clientGroup, subject, maxRetryCount, showError)
  try {
    let start = new Date()
    await eventHandler({
      input: msgData,
      config: { js, clientGroup, parentId, durableName },
    })
    let diff = new Date().getTime() - start.getTime()
    if (showProcessTimeWarning && showProcessTimeWarning < diff)
      console.log('\x1b[33m%s\x1b[0m', `[WARNING-TIME] ${diff / 1000}s, eventId:${parentId}, durableName: ${durableName}`)
    jsMsg.ack()
  } catch (error) {
    await fail(error as Error)
  }
}

const getFail =
  (
    jsMsg: JsMsg,
    parentId: Types.ObjectId,
    durableName: string,
    clientGroup: string,
    subject: string,
    maxRetryCount: number,
    showError: boolean
  ) =>
  async (error: Error) => {
    const eventError = await createEventError({
      eventId: parentId,
      durableName,
      clientGroup,
      subject,
      error,
    })

    const { errorCount } = eventError
    console.error(
      '\x1b[31m%s\x1b[0m',
      `Failed ${errorCount} times, durableName: ${durableName}, errMsg: ${error.message}, eventId:${parentId}`
    )
    if (showError) console.error('\x1b[31m%s\x1b[0m', `${durableName}`, error.stack)
    if (errorCount >= maxRetryCount) {
      console.error('\x1b[41m%s\x1b[0m', `Error added to dead letter queue`)
      jsMsg.ack()
    } else jsMsg.nak((errorCount - 1) * 5000)
  }
