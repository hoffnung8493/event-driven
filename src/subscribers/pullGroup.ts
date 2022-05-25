import { Event, getFail } from '../backend'
import { JsMsg, JetStreamClient, consumerOpts } from 'nats'
import { _maxRetryCount as maxRetryCount, _showError as showError, _showProcessTimeWarning as showProcessTimeWarning } from '..'
import { SubscriberConfig, EventConfig2, convertJsMsg, filterConvertedMsgs, groupByFn } from './common'

export interface SubscriberGroupedEvent<ParentEvent extends Event<string>> {
  inputs: ParentEvent['data'][]
  ack: () => void
  fail: (error: Error) => Promise<void>
  config: EventConfig2
}

export type PullGroupedEventHandler<ParentEvent extends Event<string>> = ({
  groupedEvents,
}: {
  groupedEvents: SubscriberGroupedEvent<ParentEvent>[]
}) => Promise<any>

export const SubscriberPullGroup = (config: SubscriberConfig) => {
  return async <ParentEvent extends Event<string>>({
    subject,
    batchEventHandlerGroups,
  }: {
    subject: ParentEvent['subject']
    batchEventHandlerGroups: {
      groupBy: (item: ParentEvent['data']) => string | number | symbol
      pullGroupEventHandler: PullGroupedEventHandler<ParentEvent>
      batch?: number
      expires?: number
    }[]
  }) => {
    for (let i = 0; i < batchEventHandlerGroups.length; i++) {
      const { pullGroupEventHandler, groupBy, batch: batchCustom, expires: expiresCustom } = batchEventHandlerGroups[i]
      const durableName = `${config.clientGroup}=${subject.replace(/\./g, '-')}=GROUP=${i}`

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
              pullGroupEventHandler,
              durableName,
              subject,
              eventHandlerOrder: i,
              showError,
              groupBy,
              showProcessTimeWarning,
            })
          }
        }, 100)

        const batch = batchCustom ?? config.batch
        const expires = expiresCustom ?? config.expires

        psub.pull({ batch, expires })
        setInterval(() => psub.pull({ batch, expires }), expires)
      } catch (err) {
        console.error(`clientGroup: ${config.clientGroup}, index: ${i}, subject: ${subject}`)
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
  pullGroupEventHandler: PullGroupedEventHandler<ParentEvent>
  durableName: string
  subject: string
  eventHandlerOrder: number
  showError: boolean
  showProcessTimeWarning?: number
  groupBy: (item: ParentEvent['data']) => string | number | symbol
}

const processEvents = async <ParentEvent extends Event<string>>({
  msgs,
  maxRetryCount,
  js,
  clientGroup,
  pullGroupEventHandler,
  durableName,
  subject,
  eventHandlerOrder,
  showError,
  showProcessTimeWarning,
  groupBy,
}: ProcessEventsInput<ParentEvent>) => {
  const msgFilter = filterConvertedMsgs(clientGroup, subject, eventHandlerOrder, showError, durableName, maxRetryCount)

  const events = msgs.map(convertJsMsg).filter(msgFilter)

  const groupedEvents = groupByFn(events, (e) => groupBy(e.msgData)).map((events) => {
    const parentIds = events.map((event) => event.parentId)
    const ack = () => {
      events.map((event) => event.jsMsg.ack())
    }
    const nak = (delay: number) => {
      events.map((event) => event.jsMsg.nak(delay))
    }
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
      inputs: events.map((event) => event.msgData),
      ack,
      fail,
      config: { js, clientGroup, parentIds, durableName },
    }
  })

  try {
    let start = new Date()
    await pullGroupEventHandler({ groupedEvents })
    let diff = new Date().getTime() - start.getTime()
    //TODO sstore process time
    if (showProcessTimeWarning && showProcessTimeWarning < diff)
      console.log('\x1b[33m%s\x1b[0m', `[WARNING-TIME] ${diff / 1000}s, durableName: ${durableName}`)
  } catch (error) {
    //TODO store unhandled errors
    console.error('\x1b[31m%s\x1b[0m', `UNHANDLED SUBSCRIPTION BATCH ERRROR(${durableName})`, error)
  }
}
