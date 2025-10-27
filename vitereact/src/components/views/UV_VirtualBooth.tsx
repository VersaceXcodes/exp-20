import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const fetchBoothDetails = async (booth_id: string, auth_token: string | null) => {
  const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/virtual-booths/${booth_id}`, {
    headers: { Authorization: `Bearer ${auth_token}` }
  });
  return response.data;
};

const UV_VirtualBooth: React.FC = () => {
  const { booth_id } = useParams<{ booth_id: string }>();
  const auth_token = useAppStore(state => state.authentication_state.auth_token);
  const { data: boothDetails, isLoading, error } = useQuery(['boothDetails', booth_id], 
    () => fetchBoothDetails(booth_id as string, auth_token), { enabled: !!booth_id });

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600">{`Error: ${error.message}`}</div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">{boothDetails?.exhibitor_id}'s Booth</h1>
            <p className="text-lg text-gray-600">{boothDetails?.description}</p>

            {boothDetails?.media_urls && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {boothDetails.media_urls.map((url: string, index: number) => (
                  <img key={index} src={url} alt="Booth multimedia" className="rounded-lg shadow-lg" />
                ))}
              </div>
            )}

            {boothDetails?.product_catalog && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Product Catalog</h2>
                <p className="text-gray-700">{boothDetails.product_catalog}</p>
              </div>
            )}

            <Link to={`/interact-with-exhibitor/${boothDetails?.exhibitor_id}`} className="inline-block bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition ease-in-out duration-200">
              Chat with Exhibitor
            </Link>

            <div className="bg-blue-50 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800">Analytics</h3>
              <p className="text-gray-700 mt-2">Visitor insights and booth traffic data will be here.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UV_VirtualBooth;
