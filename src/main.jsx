import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import { AuthProvider } from '@/lib/auth';
import { SignInWelcome } from '@/features/auth/WelcomeSplash';
import { ToastProvider } from '@/components/ui';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (count, error) => {
        // Never retry client errors; retry transient failures once.
        if (error?.status && error.status < 500) return false;
        return count < 1;
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      basename={
        import.meta.env.DEV ? import.meta.env.BASE_URL.replace(/\/$/, '') : '/'
      }
    >
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            {/* Covers the redirect that follows a sign-in; renders nothing otherwise. */}
            <SignInWelcome />
            <App />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
