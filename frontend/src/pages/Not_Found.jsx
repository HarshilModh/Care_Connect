import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';

const Not_Found = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full text-center space-y-8">
        
        <div className="relative flex justify-center">
          <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
            <FileQuestion className="w-16 h-16 text-blue-600" />
          </div>
          <div className="absolute top-0 right-1/4 w-4 h-4 bg-orange-400 rounded-full animate-bounce delay-100"></div>
          <div className="absolute bottom-4 left-1/4 w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-300"></div>
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-extrabold text-gray-900 tracking-tight">404</h1>
          <h2 className="text-2xl font-bold text-gray-800">Page not found</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
           

          <Link
            to="/home"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 text-sm text-gray-400">
        CareConnect Help Center
      </div>
    </div>
  )
}

export default Not_Found