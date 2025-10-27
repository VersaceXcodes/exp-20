import React, { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';

interface Interaction {
  interaction_id: string;
  user_id: string;
  exhibitor_id: string;
  interaction_type: string;
  created_at: string;
}

const UV_ExhibitorInteraction: React.FC = () => {
  const { exhibitor_id } = useParams<{ exhibitor_id: string }>();
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const [interactionHistory, setInteractionHistory] = useState<Interaction[]>([]);

  const queryClient = useQueryClient();

  const initiateInteraction = useMutation(
    async (interactionType: string) => {
      if (!currentUser || !exhibitor_id) throw new Error('User or exhibitor ID missing');

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user_interactions`,
        {
          user_id: currentUser.id,
          exhibitor_id: exhibitor_id,
          interaction_type: interactionType,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      
      return response.data as Interaction;
    },
    {
      onSuccess: (newInteraction) => {
        setInteractionHistory((prev) => [...prev, newInteraction]);
        queryClient.invalidateQueries(['interactions', exhibitor_id]);
      },
    }
  );

  const handleInitiateChat = useCallback(() => {
    initiateInteraction.mutate('chat');
  }, [initiateInteraction]);

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Interacting with Exhibitor</h1>
          </div>
        </header>
        <main className="flex-1">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="bg-white shadow sm:rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">Interaction History</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Your past interactions with the exhibitor.</p>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  {interactionHistory.map((interaction) => (
                    <div key={interaction.interaction_id} className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">{interaction.interaction_type}</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{new Date(interaction.created_at).toLocaleString()}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={handleInitiateChat}
                disabled={initiateInteraction.isLoading}
                className="disabled:opacity-50 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Start Chat
              </button>
            </div>
            <div className="mt-8">
              <Link to={`/booth/${exhibitor_id}`} className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                Visit Virtual Booth
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default UV_ExhibitorInteraction;
