import { Schema, Document, Types, model } from 'mongoose'

export const __NO_ACK__ = '__NO_ACK__'

export interface SubscriptionErrorDoc extends Document {
  parentIds: Types.ObjectId[]
  durableName: string
  clientGroup: string
  subject: string
  errorCount: number
  error: {
    message?: string
    stack?: string
    createdAt: Date
  }[]
  isResolved: boolean
  createdAt: Date
  updatedAt: Date
}

const SubscriptionErrorSchema = new Schema(
  {
    parentIds: [{ type: Types.ObjectId, required: true }],
    durableName: { type: String, required: true },
    clientGroup: { type: String, required: true },
    subject: { type: String, required: true },
    errorCount: { type: Number, required: true },
    error: [
      {
        message: String,
        stack: String,
        createdAt: { type: Date, required: true },
      },
    ],
    isResolved: { type: Boolean, required: true },
  },
  { timestamps: true, strict: false }
)

export const SubscriptionError = model<SubscriptionErrorDoc>('SubscriptionEventError', SubscriptionErrorSchema)

export const createSubscriptionError = async (data: {
  parentIds: Types.ObjectId[]
  durableName: string
  clientGroup: string
  subject: string
  error: {
    message?: string
    stack?: string
  }
}) => {
  const error = { message: JSON.stringify(data.error.message), stack: data.error.stack, createdAt: new Date() }
  const subscriptionError = await SubscriptionError.findOneAndUpdate(
    {
      parentIds: { $in: data.parentIds },
      durableName: data.durableName,
    },
    {
      $push: { error },
      $inc: { errorCount: 1 },
      isResolved: false,
    },
    { new: true }
  )
  if (subscriptionError) return subscriptionError.toObject()

  const newEventError = await new SubscriptionError({
    parentIds: data.parentIds,
    durableName: data.durableName,
    clientGroup: data.clientGroup,
    subject: data.subject,
    errorCount: 1,
    error: [error],
    isResolved: false,
  }).save()

  return newEventError
}
export const getFail =
  ({
    parentIds,
    ack,
    nak,
    durableName,
    clientGroup,
    subject,
    eventHandlerOrder,
    maxRetryCount,
    showError,
  }: {
    parentIds: Types.ObjectId[]
    ack: () => void
    nak: (delay: number) => void
    durableName: string
    clientGroup: string
    subject: string
    eventHandlerOrder: number
    maxRetryCount: number
    showError: boolean
  }) =>
  async (error: Error) => {
    const eventError = await createSubscriptionError({
      parentIds,
      durableName,
      clientGroup,
      subject,
      error,
    })

    const { errorCount } = eventError
    console.error('\x1b[31m%s\x1b[0m', `Failed ${errorCount} times, durableName: ${durableName}, errMsg: ${error.message}`)
    if (showError) console.error('\x1b[31m%s\x1b[0m', `${durableName}`, error.stack)
    if (errorCount >= maxRetryCount || error.message === __NO_ACK__) {
      console.log('\x1b[41m%s\x1b[0m', `Error added to dead letter queue`)
      ack()
    } else nak((errorCount - 1) * 5000)
  }
