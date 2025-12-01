import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import apiService from '../../services/api.service';

interface PauseControlProps {
  isPaused: boolean;
  onStatusChange: () => void;
}

const PauseControl: React.FC<PauseControlProps> = ({ isPaused, onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePause = async () => {
    try {
      setLoading(true);
      await apiService.pauseContract();
      setSuccess('Contract paused successfully');
      onStatusChange();
    } catch (err: any) {
      setError(err.message || 'Failed to pause contract');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpause = async () => {
    try {
      setLoading(true);
      await apiService.unpauseContract();
      setSuccess('Contract unpaused successfully');
      onStatusChange();
    } catch (err: any) {
      setError(err.message || 'Failed to unpause contract');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Pause / Unpause Contract
        </Typography>
        
        <Typography variant="body1" paragraph>
          {isPaused 
            ? "The contract is currently paused. All operations except claiming and refunds are disabled."
            : "The contract is currently active. All operations are enabled."}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          {isPaused ? (
            <Button
              variant="contained"
              color="success"
              disabled={loading}
              onClick={handleUnpause}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Resume Contract'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              disabled={loading}
              onClick={handlePause}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Pause Contract'}
            </Button>
          )}
        </Box>

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
      </CardContent>
    </Card>
  );
};

export default PauseControl;
