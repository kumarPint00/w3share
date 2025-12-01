import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  styled,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  AutorenewRounded,
  ContentCopy,
  Refresh,
  OpenInNew,
  Celebration,
} from '@mui/icons-material';

const GradientCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg,
    ${alpha(theme.palette.primary.main, 0.1)} 0%,
    ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: 20,
  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: `linear-gradient(90deg,
      ${theme.palette.primary.main},
      ${theme.palette.secondary.main},
      ${theme.palette.primary.main})`,
    backgroundSize: '200% 100%',
    animation: 'gradient-shift 3s ease-in-out infinite',
  },
  '@keyframes gradient-shift': {
    '0%, 100%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
  },
}));

const StyledStepper = styled(Stepper)(({ theme }) => ({
  '& .MuiStepLabel-root': {
    cursor: 'pointer',
  },
  '& .MuiStepIcon-root': {
    fontSize: '1.5rem',
    '&.Mui-completed': {
      color: theme.palette.success.main,
    },
    '&.Mui-active': {
      color: theme.palette.primary.main,
      animation: 'pulse 2s infinite',
    },
  },
  '& .MuiStepLabel-label': {
    fontSize: '0.875rem',
    fontWeight: 500,
    '&.Mui-completed': {
      color: theme.palette.success.main,
    },
    '&.Mui-active': {
      color: theme.palette.primary.main,
      fontWeight: 600,
    },
  },
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.1)' },
    '100%': { transform: 'scale(1)' },
  },
}));

const StatusChip = styled(Chip)<{ status: string }>(({ theme, status }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          bg: alpha(theme.palette.warning.main, 0.1),
          text: theme.palette.warning.main,
          border: theme.palette.warning.main,
        };
      case 'processing':
        return {
          bg: alpha(theme.palette.info.main, 0.1),
          text: theme.palette.info.main,
          border: theme.palette.info.main,
        };
      case 'completed':
      case 'claimed':
        return {
          bg: alpha(theme.palette.success.main, 0.1),
          text: theme.palette.success.main,
          border: theme.palette.success.main,
        };
      case 'failed':
        return {
          bg: alpha(theme.palette.error.main, 0.1),
          text: theme.palette.error.main,
          border: theme.palette.error.main,
        };
      default:
        return {
          bg: alpha(theme.palette.grey[500], 0.1),
          text: theme.palette.grey[700],
          border: theme.palette.grey[400],
        };
    }
  };

  const colors = getStatusColor();
  return {
    backgroundColor: colors.bg,
    color: colors.text,
    border: `1px solid ${alpha(colors.border, 0.3)}`,
    fontWeight: 600,
    fontSize: '0.875rem',
    height: 32,
    '& .MuiChip-icon': {
      color: colors.text,
    },
  };
});

const TaskIdBox = styled(Box)(({ theme }) => ({
  background: alpha(theme.palette.grey[100], 0.8),
  border: `1px solid ${alpha(theme.palette.grey[300], 0.5)}`,
  borderRadius: 12,
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(3),
  backdropFilter: 'blur(10px)',
}));

interface ClaimStatusCardProps {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CLAIMED' | 'FAILED';
  taskId?: string;
  transactionHash?: string;
  onCopy: () => void;
  onStartNewClaim: () => void;
  onRefresh?: () => void;
  onViewTransaction?: () => void;
}

const ClaimStatusCard: React.FC<ClaimStatusCardProps> = ({
  status,
  taskId,
  transactionHash,
  onCopy,
  onStartNewClaim,
  onRefresh,
  onViewTransaction,
}) => {
  const steps = ['Enter Gift Reference', 'Claim Submitted', 'Processing', 'Complete'];

  const getActiveStep = () => {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'PROCESSING':
        return 2;
      case 'COMPLETED':
      case 'CLAIMED':
        return 3;
      case 'FAILED':
        return 1;
      default:
        return 0;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'PENDING':
        return <AutorenewRounded />;
      case 'PROCESSING':
        return <AutorenewRounded sx={{ animation: 'spin 2s linear infinite' }} />;
      case 'COMPLETED':
      case 'CLAIMED':
        return <Celebration />;
      case 'FAILED':
        return <Refresh />;
      default:
        return <RadioButtonUnchecked />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'PENDING':
        return 'Your claim has been submitted and is waiting to be processed.';
      case 'PROCESSING':
        return 'Your claim is being processed on the blockchain. This may take a few minutes.';
      case 'COMPLETED':
      case 'CLAIMED':
        return 'Congratulations! Your gift has been successfully claimed.';
      case 'FAILED':
        return 'There was an issue processing your claim. Please try again.';
      default:
        return 'Unknown status';
    }
  };

  const displayTaskId = taskId || transactionHash || 'Unknown';

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <GradientCard>
        <CardContent sx={{ p: 4 }}>
          {/* Progress Bar for Pending/Processing */}
          {(status === 'PENDING' || status === 'PROCESSING') && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress
                variant={status === 'PROCESSING' ? 'indeterminate' : 'determinate'}
                value={status === 'PENDING' ? 25 : 75}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha('#000', 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  },
                }}
              />
            </Box>
          )}

          {/* Step Progress */}
          <StyledStepper activeStep={getActiveStep()} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  StepIconComponent={({ active, completed }) => (
                    completed ? (
                      <CheckCircle sx={{ color: 'success.main', fontSize: '1.5rem' }} />
                    ) : active ? (
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.1)' },
                            '100%': { transform: 'scale(1)' },
                          },
                        }}
                      >
                        {index + 1}
                      </Box>
                    ) : (
                      <RadioButtonUnchecked sx={{ color: 'grey.400', fontSize: '1.5rem' }} />
                    )
                  )}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </StyledStepper>

          {/* Status Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              Claim Status
            </Typography>
            <StatusChip
              status={status}
              label={status}
              icon={getStatusIcon()}
              size="medium"
            />
            {onRefresh && (
              <Tooltip title="Refresh Status">
                <IconButton onClick={onRefresh} size="small">
                  <Refresh />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Status Message */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {getStatusMessage()}
          </Typography>

          {/* Task ID */}
          {displayTaskId && displayTaskId !== 'Unknown' && (
            <TaskIdBox>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  {transactionHash ? 'Transaction Hash' : 'Task ID'}
                </Typography>
                <Typography variant="body2" fontFamily="monospace" fontWeight="medium">
                  {displayTaskId}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title={`Copy ${transactionHash ? 'Transaction Hash' : 'Task ID'}`}>
                  <IconButton onClick={onCopy} size="small">
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
                {onViewTransaction && transactionHash && (
                  <Tooltip title="View on Blockchain">
                    <IconButton onClick={onViewTransaction} size="small">
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </TaskIdBox>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            {(status === 'COMPLETED' || status === 'CLAIMED') && (
              <Button
                variant="contained"
                startIcon={<Celebration />}
                sx={{
                  background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
                  color: 'white',
                  fontWeight: 'bold',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #388E3C 30%, #689F38 90%)',
                  },
                }}
                onClick={onStartNewClaim}
              >
                Claim Another Gift
              </Button>
            )}

            {status === 'FAILED' && (
              <Button
                variant="contained"
                startIcon={<Refresh />}
                sx={{
                  background: 'linear-gradient(45deg, #f44336 30%, #ff5722 90%)',
                  color: 'white',
                  fontWeight: 'bold',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #d32f2f 30%, #e64a19 90%)',
                  },
                }}
                onClick={onStartNewClaim}
              >
                Try Again
              </Button>
            )}

            {(status === 'PENDING' || status === 'PROCESSING') && (
              <Button
                variant="outlined"
                startIcon={<AutorenewRounded />}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  fontWeight: 'bold',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: alpha('#667eea', 0.1),
                    borderColor: 'primary.dark',
                  },
                }}
                onClick={onStartNewClaim}
              >
                Start New Claim
              </Button>
            )}
          </Box>
        </CardContent>
      </GradientCard>
    </>
  );
};

export default ClaimStatusCard;
