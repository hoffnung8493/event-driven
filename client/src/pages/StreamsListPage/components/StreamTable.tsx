import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { useNavigate } from 'react-router-dom'
import { StreamInfo } from 'nats'

const StreamTable: React.FC<{ streams: StreamInfo[] }> = ({ streams }) => {
  const navigate = useNavigate()
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>messages</TableCell>
            <TableCell>Size(MB)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {streams.map((stream) => (
            <TableRow
              key={stream.config.name}
              hover
              sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer' }}
              onClick={() => navigate(`/streams/${stream.config.name}`)}
            >
              <TableCell component="th" scope="row">
                {stream.config.name}
              </TableCell>
              <TableCell component="th" scope="row">
                {stream.state.messages}
              </TableCell>
              <TableCell component="th" scope="row">
                {stream.state.bytes / 1000000}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default StreamTable
