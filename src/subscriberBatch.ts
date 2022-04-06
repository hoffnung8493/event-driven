import { Event, Batch } from './backend/models'
import { Types } from 'mongoose'
import { JsMsg, JetStreamClient, StringCodec, consumerOpts } from 'nats'
import { _maxRetryCount as maxRetryCount, _showError as showError, _showProcessTimeWarning as showProcessTimeWarning } from '.'
import { getFail } from './subscriber'

const sc = StringCodec()

type BatchEventHandler<ParentEvent extends Event<string>> = (
  events: {
    input: ParentEvent['data']
    config: {
      js: JetStreamClient
      clientGroup: string
      parentId: Types.ObjectId
      operationId: Types.ObjectId
      subscribedTo: {
        durableName: string
        subject: string
        eventHandlerOrder: number
      }
    }
    jsMsg: JsMsg
    fail: (error: Error) => Promise<void>
  }[]
) => Promise<any>

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
      const durableName = `${clientGroup}=${subject.replace(/\./g, '-')}=${i}`

      try {
        let msgs: JsMsg[] = []
        const opts = consumerOpts()
        opts.ackWait(30000)
        opts.manualAck()
        opts.durable(durableName)
        opts.maxAckPending(500)
        // opts.callback(async (err, m) => {
        //   if (m) msgs.push(m)
        // })
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
  const _msgs = msgs
    .map((jsMsg) => {
      jsMsg.info
      const headers = jsMsg.headers
      const eventId = headers?.get('eventId')
      const operationId = new Types.ObjectId(headers?.get('operationId'))
      const parentId = new Types.ObjectId(eventId)
      const msgData = JSON.parse(sc.decode(jsMsg.data))
      const retryingDurableName = headers?.get('retryingDurableName')
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
      return { jsMsg, operationId, parentId, msgData, retryingDurableName, fail }
    })
    .filter((args) => {
      if (args.retryingDurableName && args.retryingDurableName !== durableName) {
        args.jsMsg.ack()
        return false
      } else if (args.jsMsg.info.redeliveryCount >= maxRetryCount) {
        args.jsMsg.ack()
        args.fail(new Error('__NO_ACK__'))
        return false
      } else return true
    })
    .map(({ jsMsg, operationId, parentId, msgData, fail }) => {
      return {
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
        jsMsg,
        fail,
      }
    })
  const batch = new Batch({
    operationIds: [...new Set(_msgs.map((msg) => msg.config.operationId.toString()))],
    parentEventIds: [...new Set(_msgs.map((msg) => msg.config.parentId.toString()))],
    durableName,
    clientGroup,
    subject,
    batchEventHandlerOrder: eventHandlerOrder,
  })
  try {
    let start = new Date()
    await batchEventHandler(_msgs)
    let diff = new Date().getTime() - start.getTime()
    if (showProcessTimeWarning && showProcessTimeWarning < diff)
      console.log('\x1b[33m%s\x1b[0m', `[BATCH-WARNING-TIME] ${diff / 1000}s, durableName: ${durableName}`)
    _msgs.map((msg) => msg.jsMsg.ack())
    batch.processTime = diff
  } catch (error) {
    if (error instanceof Error) {
      batch.error = {
        message: error.message,
        stack: error.stack,
        createdAt: new Date(),
      }
    }
    console.error('\x1b[31m%s\x1b[0m', `UNHANDLED SUBSCRIPTION BATCH ERRROR(${durableName})`, error)
  } finally {
    await batch.save()
  }
}
