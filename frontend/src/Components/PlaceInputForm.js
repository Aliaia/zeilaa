import { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';

export default function PlaceInputForm({ onPlaceChange }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const handleBlur = () => {
    const trimmed = value.trim();
    setError(trimmed === '');
    if (trimmed) {
      onPlaceChange(trimmed); // send input to parent
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        mt: 4,
      }}>
      <Box
        component="form"
        sx={{
          display: 'flex',
          alignItems: 'center',
          '& .MuiTextField-root': { m: 1, width: '25ch' },
        }}
        noValidate
        autoComplete="off">
        <TextField
          id="place-input"
          label="Place"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          error={error}
          helperText={error ? "Input a value." : ""}
          variant="filled"/>
        <Button variant="outlined" sx={{ m: 1, height: 'fit-content' }} onClick={handleBlur}>
          Search
        </Button>
      </Box>
    </Box>
  );
}