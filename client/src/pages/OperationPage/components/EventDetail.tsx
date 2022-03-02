import { Table, TableContainer, Paper, TableBody, TableRow, TableCell, Typography, Toolbar } from '@mui/material'
import React from 'react'
import { MessageDoc } from '../../../../../src/backend/models'
import ReactJson from 'react-json-view'
import moment from 'moment'

const EventDetail: React.FC<MessageDoc> = (message) => {
  const formatDate = (date: Date) => moment(date).format('YY/MM/DD HH:mm:ss')
  return (
    <Paper variant="outlined">
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
        }}
      >
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
          Message | {message.subject}
        </Typography>
      </Toolbar>
      <TableContainer>
        <Table aria-label="simple table">
          <TableBody>
            <TableRow>
              <TableCell>Id</TableCell>
              <TableCell>{message._id}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>{message.subject}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Client Group</TableCell>
              <TableCell>{message.clientGroup}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>ParentID</TableCell>
              <TableCell>
                <pre>{message.parentId}</pre>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>
                <ReactJson src={message.data} name={false} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Received At</TableCell>
              <TableCell>{formatDate(message.receivedAt)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Published At</TableCell>
              <TableCell>{formatDate(message.publishedAt)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default EventDetail
