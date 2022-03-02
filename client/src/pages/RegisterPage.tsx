import React, { useEffect } from 'react'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import CssBaseline from '@mui/material/CssBaseline'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import useMutation from '../hooks/useMutation'
import { Alert, Snackbar } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function RegisterPage() {
  const { data, error, loading, mutate } = useMutation('post', '/auth/register')
  const navigate = useNavigate()
  useEffect(() => {
    if (data) {
      //@ts-ignore
      axios.defaults.headers.common['admin_access_token'] = data.accessToken
      navigate('/')
    }
  }, [data, navigate])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    mutate({ username: data.get('username'), password: data.get('password') })
  }

  return (
    <Container component="main" maxWidth="xs">
      <Snackbar open={!!error} autoHideDuration={6000}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>

      <Snackbar open={!!data} autoHideDuration={6000}>
        <Alert severity="success">Success!</Alert>
      </Snackbar>

      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Register
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
          />
          <Button type="submit" disabled={loading} fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Register
          </Button>
          <Link to="/auth/signin">Already have an account? Sign In</Link>
        </Box>
      </Box>
    </Container>
  )
}
