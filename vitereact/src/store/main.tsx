import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { io } from 'socket.io-client';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

interface Notification {
  message: string;
  type: string;
  created_at: string;
}

interface AuthenticationState {
  current_user: User | null;
  auth_token: string | null;
  authentication_status: {
    is_authenticated: boolean;
    is_loading: boolean;
  };
  error_message: string | null;
}

interface AppState {
  authentication_state: AuthenticationState;
  notifications: {
    new_notifications_count: number;
    notification_list: Notification[];
  };
  search_filters: {
    date: string | null;
    category: string | null;
    location: string | null;
  };

  // Actions
  login_user: (email: string, password: string) => Promise<void>;
  logout_user: () => void;
  initialize_auth: () => Promise<void>;
  fetch_notifications: () => Promise<void>;
  set_search_filters: (filters: Partial<AppState['search_filters']>) => void;
}

// Socket setup for realtime features
const socket = io(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}`, {
  autoConnect: false,
  transportOptions: {
    polling: {
      extraHeaders: {
        Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
      },
    },
  },
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      authentication_state: {
        current_user: null,
        auth_token: null,
        authentication_status: {
          is_authenticated: false,
          is_loading: true,
        },
        error_message: null,
      },

      notifications: {
        new_notifications_count: 0,
        notification_list: [],
      },

      search_filters: {
        date: null,
        category: null,
        location: null,
      },
      
      // Actions
      login_user: async (email: string, password: string) => {
        set((state) => ({
          authentication_state: {
            ...state.authentication_state,
            authentication_status: {
              ...state.authentication_state.authentication_status,
              is_loading: true,
            },
            error_message: null,
          },
        }));
        
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/login`,
            { email, password },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const { auth_token } = response.data;
          const userResponse = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/me`,
            { headers: { Authorization: `Bearer ${auth_token}` } }
          );

          set((state) => ({
            authentication_state: {
              current_user: userResponse.data,
              auth_token,
              authentication_status: {
                is_authenticated: true,
                is_loading: false,
              },
              error_message: null,
            },
          }));
          socket.connect(); // Connect socket after successful login
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          
          set((state) => ({
            authentication_state: {
              ...state.authentication_state,
              authentication_status: {
                ...state.authentication_state.authentication_status,
                is_loading: false,
              },
              error_message: errorMessage,
            },
          }));
          throw new Error(errorMessage);
        }
      },

      logout_user: () => {
        set((state) => ({
          authentication_state: {
            current_user: null,
            auth_token: null,
            authentication_status: {
              is_authenticated: false,
              is_loading: false,
            },
            error_message: null,
          },
        }));
        socket.disconnect(); // Disconnect socket on logout
      },

      initialize_auth: async () => {
        const { auth_token } = get().authentication_state;
        
        if (!auth_token) {
          set((state) => ({
            authentication_state: {
              ...state.authentication_state,
              authentication_status: {
                ...state.authentication_state.authentication_status,
                is_loading: false,
              },
            },
          }));
          return;
        }

        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/verify`,
            { headers: { Authorization: `Bearer ${auth_token}` } }
          );

          set((state) => ({
            authentication_state: {
              current_user: response.data,
              auth_token,
              authentication_status: {
                is_authenticated: true,
                is_loading: false,
              },
              error_message: null,
            },
          }));
          socket.connect();
        } catch (error) {
          set((state) => ({
            authentication_state: {
              current_user: null,
              auth_token: null,
              authentication_status: {
                is_authenticated: false,
                is_loading: false,
              },
              error_message: 'Failed to authenticate',
            },
          }));
        }
      },

      fetch_notifications: async () => {
        const { auth_token, current_user } = get().authentication_state;

        if (current_user && auth_token) {
          try {
            const response = await axios.get(
              `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/notifications/${current_user.id}`,
              { headers: { Authorization: `Bearer ${auth_token}` } }
            );

            set((state) => ({
              notifications: {
                new_notifications_count: response.data.length,
                notification_list: response.data,
              },
            }));
          } catch (error) {
            console.error('Failed to fetch notifications:', error);
          }
        }
      },

      set_search_filters: (filters) => {
        set((state) => ({
          search_filters: {
            ...state.search_filters,
            ...filters,
          },
        }));
      },
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        // Adding all persistable states.
        authentication_state: {
          current_user: state.authentication_state.current_user,
          auth_token: state.authentication_state.auth_token,
          authentication_status: {
            is_authenticated: state.authentication_state.authentication_status.is_authenticated,
            is_loading: false,
          },
          error_message: null,
        },
        notifications: state.notifications,
        search_filters: state.search_filters,
      }),
    }
  )
);