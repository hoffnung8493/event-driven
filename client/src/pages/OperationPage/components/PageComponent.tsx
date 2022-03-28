import React, { useContext, useEffect } from 'react'
import { Container, Box, Grid, CircularProgress } from '@mui/material'
import EventChain from './EventChain'
import Operation from './Operation'
import ErrorDetail from './ErrorDetail'
import EventDetail from './EventDetail'
import { MessageDataContext } from '../context/MessageData'
import { BackendConnectionContext } from '../../../contexts/backendConnection'

const PageComponent: React.FC = () => {
  const { messageData, operationId, data, loading } = useContext(MessageDataContext)
  const { setTitle } = useContext(BackendConnectionContext)
  useEffect(() => {
    setTitle(`Operation(Command) - ${operationId}`)
  }, [operationId, setTitle])
  if (loading || !data)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 600 }}>
        <CircularProgress />
      </Box>
    )
  return (
    <Container component="main" style={{ maxWidth: '100%' }}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Grid container sx={{ height: '100%' }} spacing={4}>
          <Grid item xs={6}>
            {data && <EventChain {...data} />}
          </Grid>
          <Grid item xs={6}>
            {messageData &&
              (messageData.query ? (
                <Operation {...messageData} />
              ) : messageData.error ? (
                <ErrorDetail {...messageData} />
              ) : (
                <EventDetail {...messageData} />
              ))}
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

export default PageComponent
