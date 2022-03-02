import React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { MessageDataProvider } from './context/MessageData'
import PageComponent from './components/PageComponent'

const OperationPage: React.FC = () => {
  const { operationId } = useParams()
  if (!operationId) return <Navigate to="/" />

  return (
    <MessageDataProvider operationId={operationId}>
      <PageComponent />
    </MessageDataProvider>
  )
}

export default OperationPage
