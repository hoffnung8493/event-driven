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
            <TableCell align="right">subjects</TableCell>
            <TableCell align="right">retention</TableCell>
            <TableCell align="right">messages</TableCell>
            <TableCell align="right">bytes</TableCell>
            <TableCell align="right">first_ts</TableCell>
            <TableCell align="right">last_ts</TableCell>
            <TableCell align="right">consumer_count</TableCell>
            <TableCell align="right">max_age</TableCell>
            <TableCell align="right">max_msgs_per_subject</TableCell>
            <TableCell align="right">max_msg_size</TableCell>
            <TableCell align="right">discard</TableCell>
            <TableCell align="right">storage</TableCell>
            <TableCell align="right">num_replicas</TableCell>
            <TableCell align="right">duplicate_window</TableCell>
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
                {stream.config.subjects.length}
              </TableCell>
              <TableCell component="th" scope="row">
                {stream.config.retention}
              </TableCell>
              <TableCell component="th" scope="row">
                {stream.state.messages}
              </TableCell>
              <TableCell component="th" scope="row">
                {stream.state.bytes}
              </TableCell>
              <TableCell component="th" scope="row">
                {stream.state.first_ts}
              </TableCell>
              <TableCell component="th" scope="row">
                {stream.state.last_ts}
              </TableCell>
              <TableCell component="th" scope="row">
                {stream.state.consumer_count}
              </TableCell>
              <TableCell component="th" scope="row">
                {stream.config.max_age}
              </TableCell>
              <TableCell component="th" scope="row">
                {stream.config.max_msgs_per_subject}
              </TableCell>
              <TableCell component="th" scope="row">
                {stream.config.max_msg_size}
              </TableCell>
              <TableCell component="th" scope="row">
                {stream.config.discard}
              </TableCell>
              <TableCell component="th" scope="row">
                {stream.config.storage}
              </TableCell>
              <TableCell component="th" scope="row">
                {stream.config.num_replicas}
              </TableCell>
              <TableCell component="th" scope="row">
                {stream.config.duplicate_window}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default StreamTable
