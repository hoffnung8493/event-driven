import { Container, Box, CircularProgress } from '@mui/material'
import { Navigate, useParams } from 'react-router-dom'
import useQuery from '../../hooks/useQuery'
import SubjectsTable from './components/SubjectsTable'
import { StreamInfo, ConsumerInfo } from 'nats'
import ReactJson from 'react-json-view'
import { useContext, useEffect } from 'react'
import { BackendConnectionContext } from '../../contexts/backendConnection'
import { StreamSummaryDoc } from '../../../../src/backend/models'

export default function StreamPage() {
  const { setTitle } = useContext(BackendConnectionContext)
  const { stream } = useParams()
  useEffect(() => {
    setTitle(`Streams - ${stream}`)
  }, [stream, setTitle])
  const { data, loading } = useQuery<{ streamSummary: StreamSummaryDoc; streamInfo: StreamInfo; consumers: ConsumerInfo[] }>(
    'get',
    `/api/streams/${stream}`
  )

  if (!stream) return <Navigate to="/" />
  if (loading || !data)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 600 }}>
        <CircularProgress />
      </Box>
    )

  return (
    <Container component="main" maxWidth="xl">
      <Box>
        <SubjectsTable stream={stream} subjects={data.streamSummary.subjects} />
        <ReactJson src={data} name={false} />
      </Box>
    </Container>
  )
}
