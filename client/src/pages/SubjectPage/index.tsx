import { Container, Box } from '@mui/material'
import EventTable from './components/EventTable'
import ErrorTable from './components/ErrorTable'
import { Navigate, useParams } from 'react-router-dom'
import { useContext, useEffect } from 'react'
import { BackendConnectionContext } from '../../contexts/backendConnection'

export default function SubjectPage() {
  const { subject } = useParams()
  const { setTitle } = useContext(BackendConnectionContext)
  useEffect(() => {
    setTitle(`Subject - ${subject}`)
  }, [setTitle, subject])
  if (!subject) return <Navigate to="/" />
  return (
    <Container component="main" maxWidth="lg">
      <Box sx={{ my: 3 }}>
        <ErrorTable subject={subject} />
      </Box>
      <Box sx={{ my: 3 }}>
        <EventTable subject={subject} />
      </Box>
    </Container>
  )
}
