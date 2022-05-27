import { Event, getFail } from '../backend'
import { JsMsg, JetStreamClient, consumerOpts } from 'nats'
import { _maxRetryCount as maxRetryCount, _showError as showError, _showProcessTimeWarning as showProcessTimeWarning } from '../'
import { SubscriberConfig, SubscriberEvent, convertJsMsg, filterConvertedMsgs, getDurableName } from './common'

export type PulledEventHandler<ParentEvent extends Event<string>> = (events: SubscriberEvent<ParentEvent>[]) => Promise<any>

const getSubsDetails = <ParentEvent extends Event<string>>(
  subscription:
    | PulledEventHandler<ParentEvent>
    | [
        PulledEventHandler<ParentEvent>,
        {
          batch?: number | undefined
          expires?: number | undefined
        }
      ]
) => {
  if (typeof subscription === 'function') {
    const eventHandler = subscription
    return { eventHandler, batchCustom: undefined, expiresCustom: undefined }
  } else {
    const [eventHandler, { batch: batchCustom, expires: expiresCustom }] = subscription
    return { eventHandler, batchCustom, expiresCustom }
  }
}

export const SubscriberPull = (config: SubscriberConfig) => {
  return async <ParentEvent extends Event<string>>({
    subject,
    subscriptions,
  }: {
    subject: ParentEvent['subject']
    subscriptions: (PulledEventHandler<ParentEvent> | [PulledEventHandler<ParentEvent>, { batch?: number; expires?: number }])[]
  }) => {
    for (let i = 0; i < subscriptions.length; i++) {
      const subscription = subscriptions[i]
      const { eventHandler, batchCustom, expiresCustom } = getSubsDetails(subscription)
      const durableName = getDurableName(config.clientGroup, subject, i, 'PULL')

      try {
        let msgs: JsMsg[] = []
        const opts = consumerOpts()
        opts.ackWait(30000)
        opts.manualAck()
        opts.durable(durableName)
        opts.maxAckPending(500)
        const psub = await config.js.pullSubscribe(subject, opts)

        ;(async () => {
          for await (const m of psub) msgs.push(m)
        })()
        setInterval(() => {
          if (msgs.length > 0) {
            processEvents({
              msgs: msgs.splice(0, 10000),
              maxRetryCount,
              js: config.js,
              clientGroup: config.clientGroup,
              eventHandler,
              durableName,
              subject,
              eventHandlerOrder: i,
              showError,
              showProcessTimeWarning,
            })
          }
        }, 100)

        const batch = batchCustom ?? config.batch
        const expires = expiresCustom ?? config.expires

        psub.pull({ batch, expires })
        setInterval(() => psub.pull({ batch, expires }), expires)
      } catch (err) {
        throw err
      }
    }
  }
}

interface ProcessEventsInput<ParentEvent extends Event<string>> {
  msgs: JsMsg[]
  maxRetryCount: number
  js: JetStreamClient
  clientGroup: string
  eventHandler: PulledEventHandler<ParentEvent>
  durableName: string
  subject: string
  eventHandlerOrder: number
  showError: boolean
  showProcessTimeWarning?: number
}

const processEvents = async <ParentEvent extends Event<string>>({
  msgs,
  maxRetryCount,
  js,
  clientGroup,
  eventHandler,
  durableName,
  subject,
  eventHandlerOrder,
  showError,
  showProcessTimeWarning,
}: ProcessEventsInput<ParentEvent>) => {
  const msgFilter = filterConvertedMsgs(clientGroup, subject, eventHandlerOrder, showError, durableName, maxRetryCount)
  const events = msgs
    .map(convertJsMsg)
    .filter(msgFilter)
    .map(({ jsMsg, parentId, msgData }) => {
      const parentIds = [parentId]
      const ack = jsMsg.ack
      const nak = jsMsg.nak
      const fail = getFail({
        parentIds,
        ack,
        nak,
        durableName,
        clientGroup,
        subject,
        eventHandlerOrder,
        maxRetryCount,
        showError,
      })
      return {
        input: msgData,
        ack,
        fail,
        config: { js, clientGroup, parentIds, durableName },
      }
    })

  try {
    let start = new Date()
    await eventHandler(events)
    let diff = new Date().getTime() - start.getTime()
    //TODO sstore process time
    if (showProcessTimeWarning && showProcessTimeWarning < diff)
      console.log('\x1b[33m%s\x1b[0m', `[WARNING-TIME] ${diff / 1000}s, durableName: ${durableName}`)
  } catch (error) {
    //TODO store unhandled errors
    console.error('\x1b[31m%s\x1b[0m', `UNHANDLED SUBSCRIPTION BATCH ERRROR(${durableName})`, error)
  }
}
