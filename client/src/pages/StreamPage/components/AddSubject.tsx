import { Button, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'

const AddSubject: React.FC<{ mutate: (input: any) => Promise<any>; loading: boolean }> = ({ mutate, loading }) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    mutate({ subject: data.get('subject') })
  }

  return (
    <>
      <Typography component="h1" variant="h6">
        Add Subject
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="subject"
          label="subject"
          name="subject"
          autoComplete="Subject"
          autoFocus
        />
        <Button type="submit" disabled={loading} fullWidth variant="contained" sx={{ mt: 1, mb: 5 }}>
          Create Subject
        </Button>
      </Box>
    </>
  )
}
export default AddSubject
