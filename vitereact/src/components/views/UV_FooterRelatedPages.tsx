import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const UV_FooterRelatedPages: React.FC = () => {
  const { page } = useParams<{ page: string }>();
  const [currentPage, setCurrentPage] = React.useState(page || 'terms');
  const setFooterPage = useAppStore(state => state.set_current_page);  // Assume you have this action available

  // Update current page based on URL parameter changes
  React.useEffect(() => {
    setCurrentPage(page || 'terms');
    setFooterPage(currentPage);  // Sync with global state if needed
  }, [page, currentPage, setFooterPage]);

  return (
    <>
      <div className="bg-gray-50 min-h-screen flex flex-col">
        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center">
              {currentPage === 'terms' && 'Terms & Conditions'}
              {currentPage === 'privacy' && 'Privacy Policy'}
              {currentPage === 'contact' && 'Contact Us'}
            </h2>

            {currentPage === 'terms' && (
              <p className="text-base text-gray-700 leading-relaxed">
                {/* Sample terms content */}
                Welcome to our Terms and Conditions. Please read them carefully.
                {/* Include real terms here */}
              </p>
            )}

            {currentPage === 'privacy' && (
              <p className="text-base text-gray-700 leading-relaxed">
                {/* Sample privacy content */}
                This is our Privacy Policy. Your privacy is important to us.
                {/* Include real privacy content here */}
              </p>
            )}

            {currentPage === 'contact' && (
              <div className="space-y-4">
                <p className="text-base text-gray-700 leading-relaxed">
                  {/* Sample contact info */}
                  Reach us at: contact@example.com
                </p>
                <p className="text-base text-gray-700 leading-relaxed">
                  Call us: (123) 456-7890
                </p>
              </div>
            )}

            <div className="text-center space-x-4">
              <Link to="/footer-related/terms" className="text-blue-600 hover:text-blue-500 text-xl">
                Terms & Conditions
              </Link>
              <Link to="/footer-related/privacy" className="text-blue-600 hover:text-blue-500 text-xl">
                Privacy Policy
              </Link>
              <Link to="/footer-related/contact" className="text-blue-600 hover:text-blue-500 text-xl">
                Contact Us
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default UV_FooterRelatedPages;
