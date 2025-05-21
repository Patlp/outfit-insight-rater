
import React from 'react';
import { AlertCircle } from 'lucide-react';

const RoastModeExplanation: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
      <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-gray-700">
        <p className="font-medium">What is Roast Mode?</p>
        <p className="mt-1">It's a special feedback mode that gives you brutally honest, no-holds-barred critique of your outfits. Perfect when you want the unfiltered truth about your style.</p>
      </div>
    </div>
  );
};

export default RoastModeExplanation;
