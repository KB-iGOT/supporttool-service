import React from 'react';
import { Stepper, Step, StepLabel } from '@mui/material';

interface ContentStepperProps {
  activeStep: number;
  steps: string[];
}

const ContentStepper: React.FC<ContentStepperProps> = ({ activeStep, steps }) => {
  return (
    <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
      {steps.map((label) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

export default ContentStepper;