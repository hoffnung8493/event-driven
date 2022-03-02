import { Container, Box } from '@mui/material'
import Header from '../components/Header'
import SubjectsTable from '../components/SubjectsTable'

export default function MainPage() {
  return (
    <Container component="main" maxWidth="lg">
      <Header title="Subjects" />
      <Box sx={{ my: 3 }}>
        <SubjectsTable />
      </Box>
    </Container>
  )
}
