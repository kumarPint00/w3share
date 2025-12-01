'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import ContractAdminPanel from '@/components/admin/ContractAdminPanel';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // In a real application, you would check authentication status here
  useEffect(() => {
    // Simulate checking authentication
    const checkAuth = async () => {
      try {
        // This would be a real auth check in production
        // For demo purposes we'll just simulate it
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For demo: change to true to simulate authenticated user
        setIsAuthenticated(false);
      } catch (err) {
        console.error('Authentication check failed', err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4">Loading...</Typography>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>Admin Access Required</Typography>
          <Typography variant="body1" paragraph>
            You need to be authenticated as an administrator to access this page.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            href="/connect-wallet" // In a real app, this would redirect to your auth flow
            sx={{ mt: 2 }}
          >
            Connect Wallet
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, py: 4 }}>
      <ContractAdminPanel />
    </Box>
  );
}
