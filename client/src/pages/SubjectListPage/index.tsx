import { Container, Box } from '@mui/material'
import { useContext, useEffect } from 'react'

import { BackendConnectionContext } from '../../contexts/backendConnection'
import SubjectsTable from './components/SubjectsTable'

export default function SubjectListPage() {
  const { setTitle } = useContext(BackendConnectionContext)
  useEffect(() => {
    setTitle('Subjects')
  }, [setTitle])
  return (
    <Container component="main" maxWidth="lg">
      <Box sx={{ my: 3 }}>
        <SubjectsTable />
      </Box>
    </Container>
  )
}
