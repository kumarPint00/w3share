import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  FormHelperText
} from '@mui/material';
import apiService from '../../services/api.service';

interface TimerControlProps {
  onStatusChange: () => void;
}

const TimerControl: React.FC<TimerControlProps> = ({ onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // For extending timer
  const [extendDays, setExtendDays] = useState<number>(30);
  
  // For setting specific end date
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  const handleExtendTimer = async () => {
    try {
      if (extendDays <= 0) {
        setError('Extension days must be greater than 0');
        return;
      }
      
      setLoading(true);
      await apiService.extendContractTimer(extendDays);
      setSuccess(`Contract timer extended by ${extendDays} days`);
      onStatusChange();
    } catch (err: any) {
      setError(err.message || 'Failed to extend contract timer');
    } finally {
      setLoading(false);
    }
  };

  const handleSetEndDate = async () => {
    try {
      const timestamp = Math.floor(new Date(endDate).getTime() / 1000);
      const now = Math.floor(Date.now() / 1000);
      
      if (timestamp <= now) {
        setError('End date must be in the future');
        return;
      }
      
      setLoading(true);
      await apiService.setContractEndDate(timestamp);
      setSuccess('Contract end date set successfully');
      onStatusChange();
    } catch (err: any) {
      setError(err.message || 'Failed to set contract end date');
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
          Contract Timer Controls
        </Typography>

        <Grid container spacing={4}>
          {/* Extend Timer Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Extend Active Timer
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="days-label">Days to Extend</InputLabel>
              <Select
                labelId="days-label"
                value={extendDays}
                label="Days to Extend"
                onChange={(e) => setExtendDays(Number(e.target.value))}
              >
                <MenuItem value={7}>7 days</MenuItem>
                <MenuItem value={30}>30 days</MenuItem>
                <MenuItem value={90}>90 days</MenuItem>
                <MenuItem value={180}>180 days</MenuItem>
                <MenuItem value={365}>365 days</MenuItem>
              </Select>
              <FormHelperText>
                Add more time to the current contract active period
              </FormHelperText>
            </FormControl>
            <Button
              variant="contained"
              fullWidth
              onClick={handleExtendTimer}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Extend Timer'}
            </Button>
          </Grid>

          {/* Set End Date Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Set Specific End Date
            </Typography>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{
                shrink: true,
              }}
              helperText="Set a specific date when the contract will cease operations"
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleSetEndDate}
              disabled={loading}
              color="secondary"
            >
              {loading ? <CircularProgress size={24} /> : 'Set End Date'}
            </Button>
          </Grid>
        </Grid>

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

export default TimerControl;
