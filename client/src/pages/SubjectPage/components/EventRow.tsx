import React from 'react'
import { TableRow, TableCell } from '@mui/material'
import moment from 'moment'
import { MessageDoc } from '../../../../../src/backend/models'
import { useNavigate } from 'react-router-dom'

const EventRow: React.FC<{ event: MessageDoc }> = ({ event }) => {
  const navigate = useNavigate()
  return (
    <>
      <TableRow
        hover
        sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer' }}
        onClick={() => navigate(`/operations/${event.operationId}?event-id=${event._id}`)}
      >
        <TableCell component="th" scope="row">
          {event.subject}
        </TableCell>
        <TableCell align="right">{event.clientGroup}</TableCell>
        <TableCell align="right">{moment(event.receivedAt).format('YY-MM-DD HH:mm')}</TableCell>
        <TableCell align="right">{moment(event.publishedAt).format('YY-MM-DD HH:mm')}</TableCell>
        <TableCell align="right">{event.republish.length}</TableCell>
      </TableRow>
    </>
  )
}

export default EventRow
