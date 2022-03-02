import React from 'react'
import { TableRow, TableCell } from '@mui/material'
import moment from 'moment'
import { MessageErrorDoc } from '../../../../../src/backend/models'
import { useNavigate } from 'react-router-dom'

const ErrorRow: React.FC<{ msgError: MessageErrorDoc }> = ({ msgError }) => {
  const navigate = useNavigate()
  return (
    <>
      <TableRow
        hover
        sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer' }}
        onClick={() => navigate(`/operations/${msgError.operationId}?error-id=${msgError._id}`)}
      >
        <TableCell component="th" scope="row">
          {msgError.publishingSubject}
        </TableCell>
        <TableCell align="right">{msgError.clientGroup}</TableCell>
        <TableCell align="right">{msgError.error[0].message}</TableCell>
        <TableCell align="right">{msgError.errorCount}</TableCell>
        <TableCell align="right">{moment(msgError.createdAt).format('YY-MM-DD HH:mm')}</TableCell>
      </TableRow>
    </>
  )
}

export default ErrorRow
