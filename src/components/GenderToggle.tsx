
import React from 'react';
import { useRating } from '@/context/RatingContext';
import { Male, Female } from 'lucide-react';

const GenderToggle: React.FC = () => {
  const { selectedGender, setSelectedGender, imageFile } = useRating();
  
  const handleGenderChange = (gender: 'male' | 'female') => {
    if (!imageFile) {
      setSelectedGender(gender);
    }
  };

  return (
    <div className="flex flex-col items-center mb-6">
      <p className="text-fashion-800 font-medium mb-3">Select fashion style guide:</p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => handleGenderChange('male')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${
            selectedGender === 'male'
              ? 'fashion-gradient text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${imageFile ? 'opacity-60 cursor-not-allowed' : ''}`}
          disabled={!!imageFile}
        >
          <Male size={18} />
          <span>Male</span>
        </button>
        
        <button
          onClick={() => handleGenderChange('female')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${
            selectedGender === 'female'
              ? 'fashion-gradient text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${imageFile ? 'opacity-60 cursor-not-allowed' : ''}`}
          disabled={!!imageFile}
        >
          <Female size={18} />
          <span>Female</span>
        </button>
      </div>
      {imageFile && (
        <p className="text-sm text-gray-500 mt-2">
          To change style guide, reset and upload a new photo
        </p>
      )}
    </div>
  );
};

export default GenderToggle;
