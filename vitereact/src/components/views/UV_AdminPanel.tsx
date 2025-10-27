import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const UV_AdminPanel: React.FC = () => {
  // Access global state managed by Zustand
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const currentUser = useAppStore(state => state.authentication_state.current_user);

  // Fetch expos data for management
  const { data: expos, error: exposError, isLoading: exposLoading } = useQuery(
    ['adminExpos'],
    async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/expos`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return response.data;
    },
    {
      staleTime: 60000,
      refetchOnWindowFocus: false,
      enabled: !!authToken, // only run if authToken is defined
    }
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Panel</h1>

          {/* Expos Management Section */}
          <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Expos Management</h2>
              {exposLoading && <span className="text-sm text-gray-500">Loading expos...</span>}
            </div>
            {exposError && (
              <div className="text-red-600 mb-4">
                Error fetching expos data: {exposError.message}
              </div>
            )}
            <ul className="space-y-3">
              {expos?.map((expo: any) => (
                <li key={expo.expo_id} className="flex justify-between bg-gray-100 p-4 rounded-md">
                  <span>{expo.title}</span>
                  <span className="text-sm text-gray-500">{new Date(expo.date).toDateString()}</span>
                </li>
              )) || <p>No expos data available.</p>}
            </ul>
          </div>

          {/* Additional Sections: Users Management, Reports, etc. */}
          <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Users Management</h2>
            <p className="text-sm text-gray-600 mt-4">Feature to manage user accounts will be integrated soon.</p>
          </div>

          {/* Link to other paths */}
          <div className="mt-6">
            <Link
              to="/home"
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_AdminPanel;
