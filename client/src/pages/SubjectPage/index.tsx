import { Container, Box } from '@mui/material'
import Header from '../../components/Header'
import EventTable from './components/EventTable'
import ErrorTable from './components/ErrorTable'
import { Navigate, useParams } from 'react-router-dom'

export default function SubjectPage() {
  const { subject } = useParams()
  if (!subject) return <Navigate to="/" />
  return (
    <Container component="main" maxWidth="lg">
      <Header title={`Subject - ${subject}`} />
      <Box sx={{ my: 3 }}>
        <ErrorTable subject={subject} />
      </Box>
      <Box sx={{ my: 3 }}>
        <EventTable subject={subject} />
      </Box>
    </Container>
  )
}
