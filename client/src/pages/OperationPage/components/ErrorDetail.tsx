import {
  Table,
  TableContainer,
  Paper,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Toolbar,
  Button,
  Snackbar,
  Alert,
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { MessageErrorDoc } from '../../../../../src/backend/models'
import moment from 'moment'
import ErrorTable from './ErrorTable'
import useMutation from '../../../hooks/useMutation'

const ErrorDetail: React.FC<MessageErrorDoc> = (msgError) => {
  const formatDate = (date: Date) => moment(date).format('YY/MM/DD HH:mm:ss')
  const { loading, error, mutate } = useMutation('put', `/errors/${msgError._id}/retry`)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setOpen(!!error)
  }, [error])
  return (
    <Paper variant="outlined">
      <Snackbar open={open} onClose={() => setOpen(false)} autoHideDuration={6000}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
        }}
      >
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
          Error | {msgError.publishingSubject}{' '}
          <Button color="warning" variant="contained" onClick={() => mutate({})} disabled={loading}>
            retry
          </Button>
        </Typography>
      </Toolbar>
      <TableContainer>
        <Table aria-label="simple table">
          <caption>
            <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
              Error Details
            </Typography>
            <ErrorTable msgErrors={msgError.error} />
          </caption>
          <TableBody>
            <TableRow>
              <TableCell>Id</TableCell>
              <TableCell>{msgError._id}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>{msgError.publishingSubject}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Client Group</TableCell>
              <TableCell>{msgError.clientGroup}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>ParentId</TableCell>
              <TableCell>{msgError.parentId}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Created At</TableCell>
              <TableCell>{formatDate(msgError.createdAt)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default ErrorDetail
