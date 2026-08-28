import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ThreatCenter } from './pages/ThreatCenter';
import { Identities } from './pages/Identities';
import { RuntimeBehaviour } from './pages/RuntimeBehaviour';
import { BehaviourRisk } from './pages/BehaviourRisk';
import { Investigation } from './pages/Investigation';
import { Analytics } from './pages/Analytics';
import { Audit } from './pages/Audit';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000,
      gcTime: 60000,
    }
  }
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/threats" element={<ThreatCenter />} />
                <Route path="/identities" element={<Identities />} />
                <Route path="/runtime-behaviour" element={<RuntimeBehaviour />} />
                <Route path="/behaviour" element={<BehaviourRisk />} />
                <Route path="/behaviour-risk" element={<BehaviourRisk />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/security-analysis" element={<Analytics />} />
                <Route path="/investigation/:eventId" element={<Investigation />} />
                <Route path="/investigation" element={<Navigate to="/threats" replace />} />
                <Route path="/audit" element={<Audit />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
