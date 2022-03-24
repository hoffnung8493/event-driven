import { createEventError, Event } from './backend/models'
import { Types } from 'mongoose'
import { RedisClientType } from 'redis'
import { getValue } from './redisParser'

// This is used to prevent duplicate messages from being processed, when retries occur
// processingMessage string format: `${parentId}-${clientGroup}`
let processingEvents: string[] = []

type EventHandler<ParentEvent extends Event<string>> = (event: {
  args: ParentEvent['data']
  config: {
    client: RedisClientType<any, any>
    clientGroup: string
    parentId: Types.ObjectId
    operationId: Types.ObjectId
  }
  ack: () => Promise<void>
  fail: (error: Error) => Promise<void>
}) => Promise<void>

export const Subscriber = async (redisOriginal: RedisClientType<any, any>, clientGroup: string, consumerName: string) => {
  const redis = redisOriginal.duplicate()
  await redis.connect()
  return async <ParentEvent extends Event<string>>({
    subject,
    eventHandler,
  }: {
    subject: ParentEvent['subject']
    eventHandler: EventHandler<ParentEvent>
  }) => {
    try {
      const cfg = await configureEventProcessingFunctions<ParentEvent>(redis, clientGroup, consumerName, subject, eventHandler)
      await cfg.processUnackedPendingEvents()
      cfg.listenToNewEvents()
      setInterval(() => cfg.retryEventsThatAreIdleFor(10 * 1000), 10 * 1000)
    } catch (err) {
      throw err
    }
  }
}

const configureEventProcessingFunctions = async <ParentEvent extends Event<string>>(
  redis: RedisClientType<any, any>,
  clientGroup: string,
  consumerName: string,
  subject: string,
  eventHandler: EventHandler<ParentEvent>
) => {
  await redis.sendCommand(['XGROUP', 'CREATE', subject, clientGroup, '$', 'MKSTREAM']).catch((err) => {
    if (!err.message.includes('Consumer Group name already exists')) throw err
  })
  console.log(`${clientGroup} listening to ${subject}`)
  const processUnackedPendingEvents = async () => {
    const result = (await redis.sendCommand(['XREADGROUP', 'GROUP', clientGroup, consumerName, 'STREAMS', subject, '0'])) as any
    if (result) processEvents(result[0][1], redis, subject, clientGroup, eventHandler)
  }
  const processNewEvents = async () => {
    const result = (await redis.sendCommand([
      'XREADGROUP',
      'BLOCK',
      '500',
      'COUNT',
      '5',
      'GROUP',
      clientGroup,
      consumerName,
      'STREAMS',
      subject,
      '>',
    ])) as any

    if (result) await processEvents(result[0][1], redis, subject, clientGroup, eventHandler)
  }

  const retryEventsThatAreIdleFor = async (ms: number) => {
    try {
      const result = (await redis.sendCommand([
        'XAUTOCLAIM',
        subject,
        clientGroup,
        consumerName,
        ms.toString(),
        '0',
        'COUNT',
        '10',
      ])) as string[][][]
      if (!result || result.length < 2) return
      await processEvents(result[1], redis, subject, clientGroup, eventHandler)
      retryEventsThatAreIdleFor(ms)
    } catch (err) {}
  }

  const listenToNewEvents = async () => {
    while (true) await processNewEvents()
  }
  return {
    processUnackedPendingEvents,
    listenToNewEvents,
    retryEventsThatAreIdleFor,
  }

  //upsert client group
}

const processEvents = async <ParentEvent extends Event<string>>(
  events: any,
  redis: RedisClientType<any, any>,
  subject: ParentEvent['subject'],
  clientGroup: string,
  eventHandler: EventHandler<ParentEvent>
) => {
  await Promise.all(
    events.map(async (event: string[][]) => {
      const eventId = event[0].toString()
      const operationId = new Types.ObjectId(getValue('operationId', event[1]))
      const parentId = new Types.ObjectId(getValue('eventId', event[1]))
      const processingEvent = `${parentId.toString()}-${clientGroup}`
      processingEvents.push(processingEvent)
      const msgData = JSON.parse(getValue('data', event[1]))
      const ack = async () => {
        await redis.sendCommand(['XACK', subject, clientGroup, eventId])
      }

      const retryingClientGroup = getValue('retryingClientGroup', event[1])
      if (retryingClientGroup && retryingClientGroup !== clientGroup) {
        await ack()
        return
      }
      const fail = async (error: Error) => {
        const eventError = await createEventError({ operationId, parentId, clientGroup, error })
        const { errorCount } = eventError
        console.error(`Failed ${errorCount} times, clientGroup: ${clientGroup}, errMsg: ${error.message} eventId:${parentId}`)
        if (errorCount > 4) {
          console.log(`Error added to dead letter queue`)
          await ack()
        }
      }
      try {
        await eventHandler({
          args: msgData,
          config: {
            client: redis,
            clientGroup,
            operationId,
            parentId,
          },
          ack,
          fail,
        })
      } catch (error) {
        console.warn('[WARNING] errors not handled in subscribers')
        throw error
      } finally {
        processingEvents = processingEvents.filter((pmsg) => pmsg !== processingEvent)
      }
    })
  )
}
