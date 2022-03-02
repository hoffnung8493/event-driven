import React, { useState } from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import useQuery from '../../../hooks/useQuery'
import { Box, CircularProgress, Toolbar, Typography } from '@mui/material'
import { EventErrorDoc } from '../../../../../src/backend/models'
import ErrorRow from './ErrorRow'
import moment from 'moment'

const ErrorTable: React.FC<{ subject: string }> = ({ subject }) => {
  const [sDate] = useState(moment().subtract(7, 'days').toISOString())
  const [eDate] = useState(new Date().toISOString())
  const { data, loading } = useQuery<{ errors: EventErrorDoc[]; count: number }>(
    'get',
    `/subjects/${subject}/errors?sDate=${sDate}&eDate=${eDate}`
  )
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
            {data.errors.map((err) => (
              <ErrorRow eventError={err} key={err._id.toString()} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default ErrorTable
