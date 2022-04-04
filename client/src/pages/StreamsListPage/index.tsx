import { Container, Box, CircularProgress } from '@mui/material'
import StreamTable from './components/StreamTable'
import useQuery from '../../hooks/useQuery'
import { StreamInfo } from 'nats'
import { useContext, useEffect } from 'react'
import { BackendConnectionContext } from '../../contexts/backendConnection'

const StreamsListPage = () => {
  const { data, loading } = useQuery<StreamInfo[]>('get', '/api/streams')
  const { setTitle } = useContext(BackendConnectionContext)

  useEffect(() => {
    setTitle('Streams')
  }, [setTitle])

  if (loading || !data)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 600 }}>
        <CircularProgress />
      </Box>
    )

  return (
    <Container component="main" maxWidth="xl">
      <Box sx={{ my: 3 }}>
        <StreamTable streams={data} />
      </Box>
    </Container>
  )
}

export default StreamsListPage
