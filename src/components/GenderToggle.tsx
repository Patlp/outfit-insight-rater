
import React from 'react';
import { useRating } from '@/context/RatingContext';
import { UserCircle2, User2 } from 'lucide-react';

const GenderToggle: React.FC = () => {
  const { selectedGender, setSelectedGender, imageFile } = useRating();
  
  const handleGenderChange = (gender: 'male' | 'female') => {
    if (!imageFile) {
      setSelectedGender(gender);
    }
  };

  return (
    <div className="flex flex-col items-center mb-6">
      <p className="text-fashion-500 font-medium mb-3">Select fashion style guide:</p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => handleGenderChange('male')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${
            selectedGender === 'male'
              ? 'bg-fashion-600 text-white'
              : 'bg-fashion-100 text-fashion-500 hover:bg-fashion-200'
          } ${imageFile ? 'opacity-60 cursor-not-allowed' : ''}`}
          disabled={!!imageFile}
        >
          <User2 size={18} />
          <span>Male</span>
        </button>
        
        <button
          onClick={() => handleGenderChange('female')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${
            selectedGender === 'female'
              ? 'bg-fashion-600 text-white'
              : 'bg-fashion-100 text-fashion-500 hover:bg-fashion-200'
          } ${imageFile ? 'opacity-60 cursor-not-allowed' : ''}`}
          disabled={!!imageFile}
        >
          <UserCircle2 size={18} />
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
