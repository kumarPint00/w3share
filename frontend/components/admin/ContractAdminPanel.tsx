import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Alert,
  AlertTitle,
  Snackbar
} from '@mui/material';

// For a real implementation, this would be in a proper config file or environment variable
const CONTRACT_ADMIN_API_URL = 'http://localhost:3001/api/v1';
const API_KEY = 'your_admin_api_key_here';

interface ContractStatus {
  isPaused: boolean;
  activeUntil: number;
  isActive: boolean;
  activeTimeRemaining: number;
  humanReadableTimeRemaining: string;
  activeUntilDate: string;
  owner?: string;
  isCurrentUserOwner?: boolean;
}

const ContractAdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState<ContractStatus | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [endDate, setEndDate] = useState<string>('');

  // Load contract status
  useEffect(() => {
    fetchContractStatus();
  }, []);

  const fetchContractStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CONTRACT_ADMIN_API_URL}/admin/status`, {
        headers: {
          'x-api-key': API_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      setStatus(data.data);
      
      // Initialize end date form field with current active until date + 30 days
      const activeUntilDate = new Date((data.data.activeUntil + 30 * 86400) * 1000);
      setEndDate(activeUntilDate.toISOString().split('T')[0]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contract status');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseContract = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CONTRACT_ADMIN_API_URL}/admin/pause`, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }
      
      setSuccess('Contract paused successfully');
      await fetchContractStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to pause contract');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpauseContract = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CONTRACT_ADMIN_API_URL}/admin/unpause`, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }
      
      setSuccess('Contract unpaused successfully');
      await fetchContractStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to unpause contract');
    } finally {
      setLoading(false);
    }
  };

  const handleExtendTimer = async () => {
    try {
      if (extendDays <= 0) {
        setError('Days must be greater than 0');
        return;
      }
      
      setLoading(true);
      const response = await fetch(`${CONTRACT_ADMIN_API_URL}/admin/extend`, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ days: extendDays })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }
      
      setSuccess(`Contract timer extended by ${extendDays} days`);
      await fetchContractStatus();
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
      const response = await fetch(`${CONTRACT_ADMIN_API_URL}/admin/set-end-date`, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timestamp })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }
      
      setSuccess(`Contract end date set to ${new Date(timestamp * 1000).toDateString()}`);
      await fetchContractStatus();
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

  if (loading && !status) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Contract Administration
        </Typography>
        
        <Divider sx={{ my: 3 }} />

        {/* Status Information */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Contract Status
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1">
                    {status?.isPaused ? (
                      <Box component="span" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                        PAUSED
                      </Box>
                    ) : (
                      <Box component="span" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                        ACTIVE
                      </Box>
                    )}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Contract Owner
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {status?.owner || 'Not available'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Time Remaining
                  </Typography>
                  <Typography variant="body1">
                    {status?.isActive ? (
                      status?.humanReadableTimeRemaining
                    ) : (
                      <Box component="span" sx={{ color: 'error.main' }}>
                        CONTRACT INACTIVE
                      </Box>
                    )}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Active Until
                  </Typography>
                  <Typography variant="body1">
                    {new Date(status?.activeUntil ? status.activeUntil * 1000 : 0).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {status?.isCurrentUserOwner === false && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <AlertTitle>Warning</AlertTitle>
                You are not the contract owner. Your ability to manage the contract is limited.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Contract Controls */}
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Contract Controls
            </Typography>
            
            {/* Pause/Unpause */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Pause/Unpause Contract
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="error" 
                  onClick={handlePauseContract}
                  disabled={status?.isPaused || loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Pause Contract'}
                </Button>
                <Button 
                  variant="contained" 
                  color="success" 
                  onClick={handleUnpauseContract}
                  disabled={!status?.isPaused || loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Unpause Contract'}
                </Button>
              </Box>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Extend Timer */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Extend Active Timer
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
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
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button 
                    variant="contained" 
                    onClick={handleExtendTimer}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={24} /> : 'Extend Timer'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Set End Date */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Set Specific End Date
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button 
                    variant="contained" 
                    onClick={handleSetEndDate}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={24} /> : 'Set End Date'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Paper>
      
      {/* Notifications */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ContractAdminPanel;
