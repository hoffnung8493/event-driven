import React from 'react'
import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
  IconButton,
  Collapse,
  Typography,
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import { Box } from '@mui/system'
import moment from 'moment'

const formatDate = (date: Date) => moment(date).format('YY/MM/DD HH:mm:ss')

interface MsgError {
  message: string
  stack?: string
  createdAt: Date
}

const ErrorTable: React.FC<{ msgErrors: MsgError[] }> = ({ msgErrors }) => {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Error Message</TableCell>
            <TableCell>Created At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {msgErrors.map((msgErr, index) => (
            <Row key={index} msgError={msgErr} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default ErrorTable

const Row: React.FC<{ msgError: MsgError }> = ({ msgError }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {msgError.message}
        </TableCell>
        <TableCell component="th" scope="row">
          {formatDate(msgError.createdAt)}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Error Stack
              </Typography>
              <pre>{msgError.stack}</pre>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  )
}
