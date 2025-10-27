import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

interface ExpoDetailsProps {
  expo_id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  location: string;
  featured: boolean;
}

const fetchExpoDetails = async (expo_id: string): Promise<ExpoDetailsProps> => {
  const response = await axios.get<ExpoDetailsProps>(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/expos/${expo_id}`
  );
  return response.data;
};

const UV_ExpoDetails: React.FC = () => {
  const { expo_id } = useParams<{ expo_id: string }>();
  const authStatus = useAppStore((state) => state.authentication_state.authentication_status);

  const { data: expoDetails, error, isLoading } = useQuery(
    ['expoDetails', expo_id],
    () => fetchExpoDetails(expo_id ?? ''),
    { enabled: !!expo_id, staleTime: 60000 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-red-600 text-xl font-semibold">An error occurred while fetching the expo details.</p>
        <div className="mt-4">
          <Link to="/expos" className="text-blue-600 hover:text-blue-500 font-medium">
            Go back to Expo Discovery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {expoDetails && (
        <div className="min-h-screen flex flex-col px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900">{expoDetails.title}</h1>
          <div className="mt-4 text-gray-600">
            <p><strong>Date:</strong> {new Date(expoDetails.date).toLocaleDateString()}</p>
            <p><strong>Category:</strong> {expoDetails.category}</p>
            <p><strong>Location:</strong> {expoDetails.location}</p>
            <p className="mt-4">{expoDetails.description}</p>
          </div>
          <div className="mt-8 flex items-center space-x-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100">
              Register
            </button>
            <button className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-100">
              Add to Calendar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_ExpoDetails;