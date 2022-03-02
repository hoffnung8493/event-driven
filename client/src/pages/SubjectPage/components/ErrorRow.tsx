import React from 'react'
import { TableRow, TableCell } from '@mui/material'
import moment from 'moment'
import { EventErrorDoc } from '../../../../../src/backend/models'
import { useNavigate } from 'react-router-dom'

const ErrorRow: React.FC<{ eventError: EventErrorDoc }> = ({ eventError }) => {
  const navigate = useNavigate()
  return (
    <>
      <TableRow
        hover
        sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer' }}
        onClick={() => navigate(`/operations/${eventError.operationId}?error-id=${eventError._id}`)}
      >
        <TableCell component="th" scope="row">
          {eventError.publishingSubject}
        </TableCell>
        <TableCell align="right">{eventError.clientGroup}</TableCell>
        <TableCell align="right">{eventError.error[0].message}</TableCell>
        <TableCell align="right">{eventError.errorCount}</TableCell>
        <TableCell align="right">{moment(eventError.createdAt).format('YY-MM-DD HH:mm')}</TableCell>
      </TableRow>
    </>
  )
}

export default ErrorRow
