import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';

// Import views
import GV_TopNav from '@/components/views/GV_TopNav.tsx';
import GV_Footer from '@/components/views/GV_Footer.tsx';
import UV_Landing from '@/components/views/UV_Landing.tsx';
import UV_HomePage from '@/components/views/UV_HomePage.tsx';
import UV_ExpoDiscovery from '@/components/views/UV_ExpoDiscovery.tsx';
import UV_ExpoDetails from '@/components/views/UV_ExpoDetails.tsx';
import UV_ExhibitorInteraction from '@/components/views/UV_ExhibitorInteraction.tsx';
import UV_Registration from '@/components/views/UV_Registration.tsx';
import UV_VirtualBooth from '@/components/views/UV_VirtualBooth.tsx';
import UV_AdminPanel from '@/components/views/UV_AdminPanel.tsx';
import UV_FooterRelatedPages from '@/components/views/UV_FooterRelatedPages.tsx';

const queryClient = new QueryClient();

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return children;
};

const App: React.FC = () => {
  const initializeAuth = useAppStore(state => state.initialize_auth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <div className="App min-h-screen flex flex-col">
          <GV_TopNav />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<UV_Landing />} />
              <Route path="/register" element={<UV_Registration />} />
              <Route path="/footer-related" element={<UV_FooterRelatedPages />} />

              {/* Protected Routes */}
              <Route path="/home" element={<ProtectedRoute><UV_HomePage /></ProtectedRoute>} />
              <Route path="/expos" element={<ProtectedRoute><UV_ExpoDiscovery /></ProtectedRoute>} />
              <Route path="/expos/:expo_id" element={<ProtectedRoute><UV_ExpoDetails /></ProtectedRoute>} />
              <Route path="/exhibitor/:exhibitor_id/interaction" element={<ProtectedRoute><UV_ExhibitorInteraction /></ProtectedRoute>} />
              <Route path="/booth/:booth_id" element={<ProtectedRoute><UV_VirtualBooth /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><UV_AdminPanel /></ProtectedRoute>} />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <GV_Footer />
        </div>
      </QueryClientProvider>
    </Router>
  );
};

export default App;