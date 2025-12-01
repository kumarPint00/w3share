import React, { useState, useEffect } from 'react';
import { Typography, Grid, Paper, Box, CircularProgress } from '@mui/material';
import Layout from '../components/layout/Layout';
import ContractStatusCard from '../components/dashboard/ContractStatusCard';
import PauseControl from '../components/dashboard/PauseControl';
import TimerControl from '../components/dashboard/TimerControl';
import apiService from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';

interface ContractStatus {
  isPaused: boolean;
  activeUntil: number;
  isActive: boolean;
  activeTimeRemaining: number;
  owner?: string;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);
  const { apiKey } = useAuth();

  useEffect(() => {
    if (apiKey) {
      apiService.setApiKey(apiKey);
    }
    fetchContractStatus();
  }, [apiKey]);

  const fetchContractStatus = async () => {
    try {
      setLoading(true);
      const status = await apiService.getAdminContractStatus();
      setContractStatus(status);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contract status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="50vh"
        >
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !contractStatus) {
    return (
      <Layout>
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light' }}>
          <Typography variant="h5" color="error">
            Error: {error || 'Failed to load contract data'}
          </Typography>
        </Paper>
      </Layout>
    );
  }

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Contract Administration Dashboard
      </Typography>

      {/* Contract Status */}
      <ContractStatusCard {...contractStatus} />

      <Grid container spacing={4}>
        {/* Pause/Unpause Control */}
        <Grid item xs={12} md={6}>
          <PauseControl
            isPaused={contractStatus.isPaused}
            onStatusChange={fetchContractStatus}
          />
        </Grid>

        {/* Timer Controls */}
        <Grid item xs={12} md={6}>
          <TimerControl onStatusChange={fetchContractStatus} />
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Dashboard;
