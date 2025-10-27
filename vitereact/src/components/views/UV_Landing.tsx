import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// TypeScript Interface for Expo
interface Expo {
  expo_id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  location: string;
  featured: boolean;
}

const fetchFeaturedExpos = async (): Promise<Expo[]> => {
  const response = await axios.get<Expo[]>(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/expos`,
    { 
      params: { featured: true } 
    }
  );
  return response.data;
};

const UV_Landing: React.FC = () => {
  const { data: featuredExpos, isLoading, isError } = useQuery(['featured_expos'], fetchFeaturedExpos);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">Welcome to Exp-20</h1>
          <p className="text-base text-gray-600 mb-12 leading-relaxed">
            Discover, interact with, and explore expo events with ease. Join us and explore the world of virtual expos!
          </p>
          <div className="space-x-4">
            <Link to="/register" className="px-6 py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              Register
            </Link>
            <Link to="/register" className="px-6 py-3 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 shadow-lg transition-all duration-200">
              Log In
            </Link>
          </div>
        </div>
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Featured Expos</h2>
          {isLoading && <p>Loading featured expos...</p>}
          {isError && <p className="text-red-600">Failed to load expos. Please try again later.</p>}
          {!isLoading && featuredExpos && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredExpos.map((expo) => (
                <div key={expo.expo_id} className="bg-white shadow-lg border border-gray-100 rounded-xl p-6 transition transform hover:scale-105 hover:shadow-xl">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{expo.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{expo.description}</p>
                  <div className="text-sm text-gray-800">
                    <p><strong>Date:</strong> {expo.date}</p>
                    <p><strong>Category:</strong> {expo.category}</p>
                    <p><strong>Location:</strong> {expo.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_Landing;
