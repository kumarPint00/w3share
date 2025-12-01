import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api.service';

const Login: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('API Key is required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Validate API key by making a test request
      const isValid = await apiService.validateApiKey(apiKey);
      
      if (isValid) {
        // Store API key and set authenticated state
        await login(apiKey);
        navigate('/');
      } else {
        setError('Invalid API Key. Please check and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" sx={{ mb: 4 }}>
          DogeGift Contract Admin
        </Typography>
        
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
          }}
        >
          <Typography component="h2" variant="h5" sx={{ mb: 3 }}>
            Sign In
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="apiKey"
              label="API Key"
              name="apiKey"
              autoComplete="off"
              autoFocus
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>
        </Paper>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            You need an API key to access the admin panel.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Contact the platform administrator to get access.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
