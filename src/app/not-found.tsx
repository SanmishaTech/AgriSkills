'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        <div className="space-y-4">
          <Link 
            href="/" 
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Go Home
          </Link>
          <div>
            <button 
              onClick={() => window.history.back()}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
