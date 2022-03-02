import { Table, TableContainer, Paper, TableBody, TableRow, TableCell, Toolbar, Typography } from '@mui/material'
import React from 'react'
import { OperationDoc } from '../../../../../src/backend/models'
import ReactJson from 'react-json-view'
import moment from 'moment'

const formatDate = (date: Date) => moment(date).format('YY/MM/DD HH:mm:ss')

const GraphqlOperation: React.FC<OperationDoc> = (operation) => {
  return (
    <Paper variant="outlined">
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
        }}
      >
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
          Mutation | {operation.operationName}
        </Typography>
      </Toolbar>
      <TableContainer>
        <Table aria-label="simple table">
          <TableBody>
            <TableRow>
              <TableCell>Id</TableCell>
              <TableCell>{operation._id}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>{operation.operationName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>userId</TableCell>
              <TableCell>{operation.userId}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Query</TableCell>
              <TableCell>
                <pre>{operation.query}</pre>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Variables</TableCell>
              <TableCell>
                <ReactJson src={operation.variables} name={false} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Created At</TableCell>
              <TableCell>{formatDate(operation.createdAt)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default GraphqlOperation
