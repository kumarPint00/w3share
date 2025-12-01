import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  Snackbar,
  Divider
} from '@mui/material';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api.service';

const Settings: React.FC = () => {
  const { apiKey, login, logout } = useAuth();
  const [newApiKey, setNewApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleUpdateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newApiKey.trim()) {
      setError('New API key is required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Validate the new API key
      const isValid = await apiService.validateApiKey(newApiKey);
      
      if (isValid) {
        // Update the stored API key
        await login(newApiKey);
        setSuccess('API Key updated successfully');
        setNewApiKey('');
      } else {
        setError('Invalid API Key. Please check and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update API key');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            API Key Management
          </Typography>
          
          <Typography variant="body1" paragraph>
            Your API key is used to authenticate with the Contract Admin Service.
          </Typography>

          {apiKey && (
            <Alert severity="info" sx={{ mb: 3 }}>
              You currently have an API key configured.
            </Alert>
          )}

          <Box component="form" onSubmit={handleUpdateApiKey} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="New API Key"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              margin="normal"
              sx={{ mb: 2 }}
              autoComplete="off"
            />
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Update API Key'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Account
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default Settings;
