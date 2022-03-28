import { Container, Box, CircularProgress, Button } from '@mui/material'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import useQuery from '../../hooks/useQuery'
import AddSubject from './components/AddSubject'
import SubjectsTable from './components/SubjectsTable'
import { StreamInfo, ConsumerInfo } from 'nats'
import ReactJson from 'react-json-view'
import useMutation from '../../hooks/useMutation'
import { useContext, useEffect } from 'react'
import { BackendConnectionContext } from '../../contexts/backendConnection'

export default function StreamPage() {
  const navigate = useNavigate()
  const { setTitle } = useContext(BackendConnectionContext)
  const { stream } = useParams()
  useEffect(() => {
    setTitle(`Streams - ${stream}`)
  }, [stream, setTitle])
  const { mutate } = useMutation('delete', `/api/streams/${stream}`)
  const { data: subjectData, loading: subjectLoading, mutate: subjectMutate } = useMutation('post', `/api/streams/${stream}`)
  const { data, loading, reload } = useQuery<{ streamInfo: StreamInfo; consumers: ConsumerInfo[] }>(
    'get',
    `/api/streams/${stream}`
  )
  useEffect(() => {
    if (subjectData) reload()
  }, [subjectData, reload])
  if (!stream) return <Navigate to="/" />
  if (loading || !data)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 600 }}>
        <CircularProgress />
      </Box>
    )
  return (
    <Container component="main" maxWidth="xl">
      <Box sx={{ my: 3 }}>
        <Button
          color="error"
          fullWidth
          variant="contained"
          sx={{ mt: 1, mb: 5 }}
          onClick={async () => {
            await mutate({})
            navigate(`/`)
          }}
        >
          Remove Stream
        </Button>
        <AddSubject loading={subjectLoading} mutate={subjectMutate} />
        <SubjectsTable subjects={data.streamInfo.config.subjects} />
        <ReactJson src={data} name={false} />
      </Box>
    </Container>
  )
}
