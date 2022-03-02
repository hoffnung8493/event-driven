import React from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import useQuery from '../../../hooks/useQuery'
import { Box, CircularProgress, Toolbar, Typography } from '@mui/material'
import { MessageErrorDoc } from '../../../../../src/backend/models'
import ErrorRow from './ErrorRow'

const ErrorTable: React.FC<{ subject: string }> = ({ subject }) => {
  const { data, loading } = useQuery<MessageErrorDoc[]>('get', `/info/subjects/${subject}/errors`)
  if (loading || !data)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 600 }}>
        <CircularProgress />
      </Box>
    )
  return (
    <Paper>
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
        }}
      >
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
          Errors
        </Typography>
      </Toolbar>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Publishing Subject</TableCell>
              <TableCell align="right">Client Group</TableCell>
              <TableCell align="right">Error Message</TableCell>
              <TableCell align="right">Error Count</TableCell>
              <TableCell align="right">Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((err) => (
              <ErrorRow msgError={err} key={err._id.toString()} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default ErrorTable
