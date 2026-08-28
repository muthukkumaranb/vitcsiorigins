import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ThreatCenter } from './pages/ThreatCenter';
import { Identities } from './pages/Identities';
import { Investigation } from './pages/Investigation';
import { Analytics } from './pages/Analytics';
import { Audit } from './pages/Audit';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/threats" element={<ThreatCenter />} />
            <Route path="/identities" element={<Identities />} />
            <Route path="/investigation/:eventId" element={<Investigation />} />
            <Route path="/investigation" element={<Navigate to="/dashboard" replace />} />
            <Route path="/analytics" element={<Analytics />} />

            <Route path="/audit" element={<Audit />} />
            <Route path="/settings" element={<Settings />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
