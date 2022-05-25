import { JetStreamClient, JsMsg, StringCodec } from 'nats'
import { Types } from 'mongoose'
import { Event, getFail, __NO_ACK__ } from '../backend'

export interface EventConfig2 {
  js: JetStreamClient
  clientGroup: string
  parentIds: Types.ObjectId[]
  durableName?: string
}

export interface SubscriberConfig {
  clientGroup: string
  js: JetStreamClient
  batch: number
  expires: number
}

const sc = StringCodec()
interface ConvertedMsg<ParentEvent extends Event<string>> {
  jsMsg: JsMsg
  parentId: Types.ObjectId
  msgData: ParentEvent['data']
  retryingDurableName: string | undefined
  //   fail: (error: Error) => Promise<void>
}

export const convertJsMsg = <ParentEvent extends Event<string>>(jsMsg: JsMsg): ConvertedMsg<ParentEvent> => {
  jsMsg.info
  const headers = jsMsg.headers
  const eventId = headers?.get('eventId')
  const parentId = new Types.ObjectId(eventId)
  const msgData = JSON.parse(sc.decode(jsMsg.data)) as ParentEvent['data']
  const retryingDurableName = headers?.get('retryingDurableName')

  return { jsMsg, parentId, msgData, retryingDurableName }
}

export const filterConvertedMsgs =
  (
    clientGroup: string,
    subject: string,
    eventHandlerOrder: number,
    showError: boolean,
    durableName: string,
    maxRetryCount: number
  ) =>
  <ParentEvent extends Event<string>>(args: ConvertedMsg<ParentEvent>) => {
    if (args.retryingDurableName && args.retryingDurableName !== durableName) {
      args.jsMsg.ack()
      return false
    } else if (args.jsMsg.info.redeliveryCount > maxRetryCount) {
      getFail({
        ack: args.jsMsg.ack,
        nak: args.jsMsg.nak,
        parentIds: [args.parentId],
        durableName,
        clientGroup,
        subject,
        eventHandlerOrder,
        maxRetryCount,
        showError,
      })(new Error(__NO_ACK__))
      return false
    } else return true
  }

export const groupByFn = <T, K extends keyof any>(list: T[], getKey: (item: T) => K) =>
  Object.values<T[]>(
    list.reduce((previous, currentItem) => {
      const group = getKey(currentItem)
      if (!previous[group]) previous[group] = []
      previous[group].push(currentItem)
      return previous
    }, {} as Record<K, T[]>)
  )
