import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main'; // Zustand hook

const GV_Footer: React.FC = () => {
  const currentUser = useAppStore(state => state.authentication_state.current_user);

  return (
    <>
      <footer className="bg-white shadow-lg px-4 sm:px-6 lg:px-8 py-6 fixed bottom-0 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="md:flex md:justify-between">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
              <Link to="/footer-related?page=contact" className="text-gray-700 hover:text-blue-600">
                Contact Us
              </Link>
              <Link to="/footer-related?page=terms" className="text-gray-700 hover:text-blue-600">
                Terms & Conditions
              </Link>
              <Link to="/footer-related?page=privacy" className="text-gray-700 hover:text-blue-600">
                Privacy Policy
              </Link>
            </div>

            <div className="mt-4 md:mt-0 flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <span className="text-gray-700 hover:text-blue-600">
                  {/* Assuming some kind of Icon component usage here; replace with actual icon library */}
                  FB
                </span>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <span className="text-gray-700 hover:text-blue-600">
                  {/* Assuming some kind of Icon component usage here; replace with actual icon library */}
                  TW
                </span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <span className="text-gray-700 hover:text-blue-600">
                  {/* Assuming some kind of Icon component usage here; replace with actual icon library */}
                  IG
                </span>
              </a>
            </div>
          </div>
          {currentUser && (
            <div className="mt-4 text-gray-500 text-sm">
              {/* Display personalized message for logged-in user */}
              Logged in as: {currentUser.name}
            </div>
          )}
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;