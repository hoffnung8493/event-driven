import { Button, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'

const CreateStream: React.FC<{ mutate: (body: any) => Promise<void>; loading: boolean }> = ({ loading, mutate }) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    mutate({ stream: data.get('stream') })
  }

  return (
    <>
      <Typography component="h1" variant="h6">
        Create Stream
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField margin="normal" required fullWidth id="stream" label="stream" name="stream" autoComplete="stream" autoFocus />
        <Button type="submit" disabled={loading} fullWidth variant="contained" sx={{ mt: 1, mb: 5 }}>
          Create Stream
        </Button>
      </Box>
    </>
  )
}
export default CreateStream
