import React from 'react';
import { render, screen, act } from '@testing-library/react';
import WalletEventsListener from '../WalletEventsListener';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../lib/theme';
import '@testing-library/jest-dom/extend-expect';

describe('WalletEventsListener', () => {
  test('renders incoming notification as filled error (opaque pink) even when type is warning', () => {
    render(
      <ThemeProvider theme={theme}>
        <WalletEventsListener />
      </ThemeProvider>
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent('wallet:notification', {
          detail: { message: 'Transaction canceled', type: 'warning' }
        })
      );
    });

    expect(screen.getByText('Transaction canceled')).toBeInTheDocument();
    const filledError = document.querySelector('.MuiAlert-filledError');
    expect(filledError).not.toBeNull();
  });
});
