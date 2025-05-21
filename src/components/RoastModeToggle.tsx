
import React from 'react';
import { useRating } from '@/context/RatingContext';
import { Flame } from 'lucide-react';
import InviteWall from '@/components/InviteWall';

const RoastModeToggle: React.FC = () => {
  const { 
    feedbackMode, 
    setFeedbackMode, 
    hasUnlockedRoastMode, 
    setShowInviteWall 
  } = useRating();
  
  const toggleRoastMode = () => {
    if (!hasUnlockedRoastMode && feedbackMode === 'normal') {
      // Show the invite wall if roast mode is not unlocked
      setShowInviteWall(true);
      return;
    }
    
    // Toggle the mode if already unlocked
    setFeedbackMode(feedbackMode === 'normal' ? 'roast' : 'normal');
  };
  
  return (
    <div className="w-full max-w-md mx-auto mb-6">
      <button
        onClick={toggleRoastMode}
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg w-full 
          ${feedbackMode === 'roast' 
            ? 'bg-orange-500 hover:bg-orange-600 text-white border-2 border-orange-600' 
            : 'bg-white hover:bg-gray-100 text-gray-800 border-2 border-gray-300'
          } 
          transition-all duration-300`}
      >
        <Flame className={`h-5 w-5 ${feedbackMode === 'roast' ? 'text-white' : 'text-orange-500'}`} />
        <span className="font-medium">
          {feedbackMode === 'roast' ? 'Roast Mode: ON' : 'Roast Mode: OFF'}
          {!hasUnlockedRoastMode && feedbackMode === 'normal' && " (Locked)"}
        </span>
      </button>
      {feedbackMode === 'roast' && (
        <p className="text-sm text-orange-600 mt-2 text-center">
          Warning: Prepare for brutally honest, possibly offensive feedback!
        </p>
      )}
    </div>
  );
};

export default RoastModeToggle;
