import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

const GV_TopNav: React.FC = () => {
  // Local state for search input
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Global authentication state (using Zustand)
  const currentUser = useAppStore((state) => state.authentication_state.current_user);
  const authToken = useAppStore((state) => state.authentication_state.auth_token);
  const newNotificationsCount = useAppStore((state) => state.notifications.new_notifications_count);
  const fetchNotificationsHandler = useAppStore((state) => state.fetch_notifications);

  // Fetch notifications using React Query
  const { data, isLoading } = useQuery(
    ['notifications', currentUser?.id],
    () =>
      axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/notifications/${currentUser?.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }),
    {
      enabled: !!currentUser,
      select: (response) => {
        // Map response for notifications
        return {
          new_notifications_count: response.data.length,
          notification_list: response.data,
        };
      },
      staleTime: 60000,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  const handleNotificationsClick = () => {
    if (currentUser) {
      fetchNotificationsHandler();
    }
  };

  return (
    <>
      <nav className="bg-white shadow-lg fixed top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/home" className="text-lg font-bold text-blue-600">
                Exp-20
              </Link>
              <div className="hidden md:flex space-x-4 ml-6">
                <Link to="/expos" className="text-gray-600 hover:text-blue-700">
                  Explore Expos
                </Link>
              </div>
              <div className="ml-4 flex-shrink-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search expos..."
                  className="block w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-900"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleNotificationsClick}
                className="relative text-gray-600 hover:text-blue-700"
                aria-label="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405a2.032 2.032 0 01-.595-1.367V11a7.5 7.5 0 10-15 0v3.228c0 .51-.202 1-.595 1.367L3 17h5.055m7.89 0a3.5 3.5 0 11-7 0h7z"
                  />
                </svg>
                {newNotificationsCount > 0 && <span className="absolute top-0 right-0 block h-2 w-2 bg-red-500 rounded-full" />}
              </button>
              {currentUser ? (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Welcome, {currentUser.name}</span>
                  <Link to="/" onClick={() => useAppStore.getState().logout_user()} className="text-gray-600 hover:text-blue-700">
                    Logout
                  </Link>
                </div>
              ) : (
                <Link to="/register" className="text-gray-600 hover:text-blue-700">
                  Login/Register
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default GV_TopNav;
