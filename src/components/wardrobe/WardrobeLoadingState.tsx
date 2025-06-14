
import React from 'react';

const WardrobeLoadingState: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-gray-300 h-10 rounded animate-pulse"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(12)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border p-4 animate-pulse">
            <div className="bg-gray-300 h-6 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WardrobeLoadingState;
