import { Container, Box, CircularProgress } from '@mui/material'
import Header from '../../components/Header'
import CreateStream from './components/CreateStream'
import StreamTable from './components/StreamTable'
import useQuery from '../../hooks/useQuery'
import useMutation from '../../hooks/useMutation'
import { StreamInfo } from 'nats'
import { useEffect } from 'react'
import ModulesTable from './components/ModulesTable'
import CreateModule from './components/CreateModule'

const StreamsListPage = () => {
  const { data: streamInfo, loading: mutationLoading, mutate } = useMutation<StreamInfo>('post', '/api/streams')
  const { data, loading, reload: reloadStreams } = useQuery<StreamInfo[]>('get', '/api/streams')
  const {
    data: module,
    loading: moduleMutationLoading,
    mutate: mutateModule,
  } = useMutation<{ module: string }>('post', '/api/modules')
  const { data: modules, loading: modulesLoading, reload: reloadModules } = useQuery<string[]>('get', '/api/modules')

  useEffect(() => {
    if (streamInfo || module) {
      reloadStreams()
      reloadModules()
    }
  }, [streamInfo, module, reloadModules, reloadStreams])

  if (loading || modulesLoading || !modules || !data)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 600 }}>
        <CircularProgress />
      </Box>
    )

  return (
    <Container component="main" maxWidth="xl">
      <Header title={`Streams`} />
      <Box sx={{ my: 3 }}>
        <CreateModule loading={moduleMutationLoading} mutate={mutateModule} />
        <ModulesTable modules={modules} />
      </Box>
      <Box sx={{ my: 3 }}>
        <CreateStream loading={mutationLoading} mutate={mutate} />
        <StreamTable streams={data} />
      </Box>
    </Container>
  )
}

export default StreamsListPage
