import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip
} from '@mui/material';
import { formatDate, formatTimeRemaining } from '../../utils/format.utils';

interface ContractStatusCardProps {
  isPaused: boolean;
  activeUntil: number;
  isActive: boolean;
  activeTimeRemaining: number;
  owner?: string;
}

const ContractStatusCard: React.FC<ContractStatusCardProps> = ({
  isPaused,
  activeUntil,
  isActive,
  activeTimeRemaining,
  owner
}) => {
  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Contract Status
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1">Current State:</Typography>
            <Chip
              label={isPaused ? 'PAUSED' : 'ACTIVE'}
              color={isPaused ? 'error' : 'success'}
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1">Contract Timer:</Typography>
            <Chip
              label={isActive ? 'ACTIVE' : 'EXPIRED'}
              color={isActive ? 'success' : 'error'}
              sx={{ fontWeight: 'bold' }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1">Time Remaining:</Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatTimeRemaining(activeTimeRemaining)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1">Active Until:</Typography>
            <Typography variant="body1">
              {formatDate(activeUntil)}
            </Typography>
          </Box>

          {owner && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">Contract Owner:</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {owner}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ContractStatusCard;
