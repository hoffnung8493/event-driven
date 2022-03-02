import * as React from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import CssBaseline from '@mui/material/CssBaseline'
import useScrollTrigger from '@mui/material/useScrollTrigger'
import { TextField } from '@mui/material'
import { BackendConnectionContext } from '../contexts/backendConnection'

interface Props {
  children: React.ReactElement
}

function ElevationScroll(props: Props) {
  const { children } = props

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  })

  return React.cloneElement(children, {
    elevation: trigger ? 4 : 0,
  })
}

const Header: React.FC<{ title: string }> = (props) => {
  const { backendUrl, setBackendUrl } = React.useContext(BackendConnectionContext)
  return (
    <React.Fragment>
      <CssBaseline />
      <ElevationScroll {...props}>
        <AppBar color="transparent" sx={{ backgroundColor: '#bae8ff' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {props.title}
            </Typography>
            <TextField
              label="BACKEND URL"
              variant="outlined"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              size="small"
              sx={{ width: '300px' }}
            />
          </Toolbar>
        </AppBar>
      </ElevationScroll>
      <Toolbar />
    </React.Fragment>
  )
}

export default Header
