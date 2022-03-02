import { createContext, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessageDoc, MessageErrorDoc, OperationDoc } from '../../../../../src/backend/models'
import useQuery from '../../../hooks/useQuery'

export const MessageDataContext = createContext(
  {} as {
    operationId: string
    messageData: any
    setMessageData: React.Dispatch<any>
    loading: boolean
    data?: {
      operation: OperationDoc
      messages: MessageDoc[]
      messageErrors: MessageErrorDoc[]
    }
  }
)

export const MessageDataProvider = ({ children, operationId }: { children: React.ReactNode; operationId: string }) => {
  const [messageData, setMessageData] = useState<any>()
  const { data, loading } = useQuery<{
    operation: OperationDoc
    messages: MessageDoc[]
    messageErrors: MessageErrorDoc[]
  }>('get', `/messages/operations/${operationId}`)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (data?.operation) {
      const errorId = searchParams.get('error-id')
      if (errorId) {
        const msgError = data.messageErrors
          .filter((msgErr) => !msgErr.resolvedBy.messageId)
          .find((e) => e._id.toString() === errorId)
        if (msgError) return setMessageData(msgError)
      }
      const eventId = searchParams.get('event-id')
      if (eventId) {
        const event = data.messages.find((m) => m._id.toString() === eventId)
        if (event) return setMessageData(event)
      }
      setMessageData(data.operation)
    }
  }, [data, searchParams])
  return (
    <MessageDataContext.Provider
      value={{
        operationId,
        messageData,
        setMessageData,
        data: data
          ? {
              operation: data.operation,
              messages: data.messages,
              messageErrors: data.messageErrors.filter((msgErr) => !msgErr.resolvedBy.messageId),
            }
          : undefined,
        loading,
      }}
    >
      {children}
    </MessageDataContext.Provider>
  )
}
