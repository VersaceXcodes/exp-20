import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

interface Expo {
  expo_id: string;
  title: string;
  date: string;
  category: string;
  location: string;
}

const fetchFeaturedExpos = async (): Promise<Expo[]> => {
  const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/expos`, {
    params: { featured: 'true' }
  });
  return response.data.map((item: any) => ({
    expo_id: item.expo_id,
    title: item.title,
    date: item.date,
    category: item.category,
    location: item.location,
  }));
};

const UV_HomePage: React.FC = () => {
  const authenticationState = useAppStore(state => state.authentication_state);

  const { data: featuredExpos = [], isLoading, isError } = useQuery<Expo[]>({
    queryKey: ['featured-expos'],
    queryFn: fetchFeaturedExpos,
    staleTime: 60000,
    retry: 1,
  });

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto py-16">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            Welcome to Your Expo Dashboard
          </h1>
          <p className="mt-4 text-gray-600">
            Discover top expos tailored just for you.
          </p>

          <div className="mt-12">
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : isError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-center">
                Failed to load featured expos. Please try again.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredExpos.map((expo) => (
                  <Link key={expo.expo_id} to={`/expos/${expo.expo_id}`} className="transition hover:scale-105">
                    <div className="bg-white shadow-lg rounded-xl p-6">
                      <h2 className="text-xl font-semibold text-gray-900">{expo.title}</h2>
                      <p className="text-gray-600 mt-2">{expo.category}</p>
                      <p className="text-gray-500">{new Date(expo.date).toLocaleDateString()}</p>
                      <p className="text-gray-500">{expo.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_HomePage;