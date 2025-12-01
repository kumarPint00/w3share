import { Stepper, Step, StepLabel, stepConnectorClasses } from '@mui/material';
import { styled } from '@mui/material/styles';

const ColorConnector = styled('span')(({ theme }) => ({
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
    borderRadius: 1
  }
}));

export default function StepIndicator({ activeStep }: { activeStep: number }) {
  const steps = ['Select', 'Message', 'Seal', 'Confirm'];
  return (
    <Stepper
      alternativeLabel
      activeStep={activeStep}
      connector={<ColorConnector />}
      sx={{ mt: 4, mb: 6 }}
    >
      {steps.map((label) => (
        <Step key={label}>
          <StepLabel
            sx={{
              '& .MuiStepIcon-root.Mui-completed': { color: 'primary.main' },
              '& .MuiStepIcon-root.Mui-active': { color: 'secondary.main' }
            }}
          >
            {label}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
