import { Button, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'

const CreateModule: React.FC<{ mutate: (body: any) => Promise<void>; loading: boolean }> = ({ loading, mutate }) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    mutate({ module: data.get('module') })
  }

  return (
    <>
      <Typography component="h1" variant="h6">
        Create module
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField margin="normal" required fullWidth id="module" label="module" name="module" autoComplete="module" autoFocus />
        <Button type="submit" disabled={loading} fullWidth variant="contained" sx={{ mt: 1, mb: 5 }}>
          Create module
        </Button>
      </Box>
    </>
  )
}
export default CreateModule
