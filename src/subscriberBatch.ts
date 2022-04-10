import { Event, createBatch, createEventError } from './backend/models'
import { Types } from 'mongoose'
import { JsMsg, JetStreamClient, StringCodec, consumerOpts } from 'nats'
import { _maxRetryCount as maxRetryCount, _showError as showError, _showProcessTimeWarning as showProcessTimeWarning } from '.'

const sc = StringCodec()

type BatchEventHandler<ParentEvent extends Event<string>> = ({
  config,
  events,
}: {
  config: {
    js: JetStreamClient
    clientGroup: string
    parentId: Types.ObjectId
    durableName?: string
  }
  events: {
    input: ParentEvent['data']
    jsMsg: JsMsg
    fail: (error: Error) => Promise<void>
  }[]
}) => Promise<any>

export type SubscribeBatch = <ParentEvent extends Event<string>>({
  subject,
  batchEventHandlers,
}: {
  subject: ParentEvent['subject']
  batchEventHandlers: BatchEventHandler<ParentEvent>[]
}) => Promise<void>

export const SubscriberBatch = ({
  clientGroup,
  js,
  batch,
  expires,
}: {
  clientGroup: string
  js: JetStreamClient
  batch: number
  expires: number
}): SubscribeBatch => {
  return async <ParentEvent extends Event<string>>({
    subject,
    batchEventHandlers,
  }: {
    subject: ParentEvent['subject']
    batchEventHandlers: BatchEventHandler<ParentEvent>[]
  }) => {
    for (let i = 0; i < batchEventHandlers.length; i++) {
      const durableName = `${clientGroup}=${subject.replace(/\./g, '-')}=1=${i}`

      try {
        let msgs: JsMsg[] = []
        const opts = consumerOpts()
        opts.ackWait(30000)
        opts.manualAck()
        opts.durable(durableName)
        opts.maxAckPending(500)
        const psub = await js.pullSubscribe(subject, opts)

        ;(async () => {
          for await (const m of psub) msgs.push(m)
        })()
        setInterval(() => {
          if (msgs.length > 0) {
            processEvents(
              msgs,
              maxRetryCount,
              js,
              clientGroup,
              batchEventHandlers[i],
              durableName,
              subject,
              i,
              showError,
              showProcessTimeWarning
            )
          }
          msgs = []
        }, 100)

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

const processEvents = async <ParentEvent extends Event<string>>(
  msgs: JsMsg[],
  maxRetryCount: number,
  js: JetStreamClient,
  clientGroup: string,
  batchEventHandler: BatchEventHandler<ParentEvent>,
  durableName: string,
  subject: string,
  eventHandlerOrder: number,
  showError: boolean,
  showProcessTimeWarning?: number
) => {
  const failedParentIds: Types.ObjectId[] = []
  const uniqueSeqs = [...new Set(msgs.map((msg) => msg.seq))]
  if (uniqueSeqs.length !== msgs.length) console.error(`duplicated seq!, ${msgs.map((msg) => msg.seq)}`)

  const events = uniqueSeqs
    .map((seq) => {
      const msg = msgs.find((msg) => msg.seq === seq)
      if (!msg) throw new Error('Something went wrong! cant find msg')
      return msg
    })
    .map((jsMsg) => {
      jsMsg.info
      const headers = jsMsg.headers
      const eventId = headers?.get('eventId')
      const parentId = new Types.ObjectId(eventId)
      const msgData = JSON.parse(sc.decode(jsMsg.data))
      const retryingDurableName = headers?.get('retryingDurableName')
      const fail = getFail({
        failedParentIds,
        jsMsg,
        parentId,
        durableName,
        clientGroup,
        subject,
        eventHandlerOrder,
        maxRetryCount,
        showError,
      })
      return { jsMsg, parentId, msgData, retryingDurableName, fail }
    })
    .filter((args) => {
      if (args.retryingDurableName && args.retryingDurableName !== durableName) {
        args.jsMsg.ack()
        return false
      } else if (args.jsMsg.info.redeliveryCount > maxRetryCount) {
        args.jsMsg.ack()
        args.fail(new Error('__NO_ACK__'))
        return false
      } else return true
    })
    .map(({ jsMsg, parentId, msgData, fail }) => {
      return {
        parentId,
        input: msgData,
        jsMsg,
        fail,
      }
    })
  const log = createBatch({
    parentEventIds: [...new Set(events.map((event) => event.parentId.toString()))].map((id) => new Types.ObjectId(id)),
    durableName,
    clientGroup,
    subject,
  })

  try {
    await batchEventHandler({
      config: {
        js,
        clientGroup,
        parentId: log.batch._id,
        durableName,
      },
      events,
    })
    let diff = new Date().getTime() - log.batch.createdAt.getTime()
    if (showProcessTimeWarning && showProcessTimeWarning < diff)
      console.log('\x1b[33m%s\x1b[0m', `[BATCH-WARNING-TIME] ${diff / 1000}s, durableName: ${durableName}`)
    events.filter((e) => !failedParentIds.find((pId) => pId.toString() === e.parentId.toString())).map((msg) => msg.jsMsg.ack())
    log.batch.processTime = diff
  } catch (error) {
    log.catchError(error as Error)
    console.error('\x1b[31m%s\x1b[0m', `UNHANDLED SUBSCRIPTION BATCH ERRROR(${durableName})`, error)
  } finally {
    await log.batch.save()
  }
}

const getFail =
  ({
    failedParentIds,
    jsMsg,
    parentId,
    durableName,
    clientGroup,
    subject,
    maxRetryCount,
    showError,
  }: {
    failedParentIds: Types.ObjectId[]
    jsMsg: JsMsg
    parentId: Types.ObjectId
    durableName: string
    clientGroup: string
    subject: string
    eventHandlerOrder: number
    maxRetryCount: number
    showError: boolean
  }) =>
  async (error: Error) => {
    failedParentIds.push(parentId)
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
      console.log('\x1b[41m%s\x1b[0m', `Error added to dead letter queue`)
      jsMsg.ack()
    } else jsMsg.nak((errorCount - 1) * 5000)
  }
