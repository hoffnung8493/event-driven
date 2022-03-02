import React, { useContext } from 'react'
import { Container, Box, Grid, CircularProgress } from '@mui/material'
import Header from '../../../components/Header'
import EventChain from './EventChain'
import GraphqlOperation from './GraphqlOperation'
import ErrorDetail from './ErrorDetail'
import EventDetail from './EventDetail'
import { MessageDataContext } from '../context/MessageData'

const PageComponent: React.FC = () => {
  const { messageData, operationId, data, loading } = useContext(MessageDataContext)
  if (loading || !data)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 600 }}>
        <CircularProgress />
      </Box>
    )
  return (
    <Container component="main" style={{ maxWidth: '100%' }}>
      <Header title={`Operation - ${operationId}`} />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Grid container sx={{ height: '100%' }} spacing={4}>
          <Grid item xs={6}>
            {data && <EventChain {...data} />}
          </Grid>
          <Grid item xs={6}>
            {messageData &&
              (messageData.query ? (
                <GraphqlOperation {...messageData} />
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
