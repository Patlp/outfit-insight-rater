
import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface OccasionContextInputProps {
  onNext: (occasionData: { eventContext: string | null; isNeutral: boolean }) => void;
}

const OccasionContextInput: React.FC<OccasionContextInputProps> = ({ onNext }) => {
  const [eventContext, setEventContext] = useState('');
  const [isNeutral, setIsNeutral] = useState(false);

  const isValid = isNeutral || eventContext.trim().length >= 5;

  const handleNext = () => {
    onNext({
      eventContext: isNeutral ? null : eventContext.trim(),
      isNeutral
    });
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Tell us about your outfit
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="occasion-input" className="block text-sm font-medium text-gray-700 mb-2">
              What's the occasion or vibe for this outfit?
            </label>
            <Textarea
              id="occasion-input"
              value={eventContext}
              onChange={(e) => setEventContext(e.target.value)}
              disabled={isNeutral}
              placeholder="e.g. 'Splash City – Afrobeats festival in London', 'First date', 'Streetwear shoot', 'Summer wedding', 'Work meeting'"
              className={`min-h-[80px] resize-none ${
                isNeutral ? 'bg-gray-50 text-gray-400' : ''
              }`}
            />
            {!isNeutral && eventContext.trim().length > 0 && eventContext.trim().length < 5 && (
              <p className="text-sm text-red-500 mt-1">
                Please enter at least 5 characters
              </p>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="neutral-toggle" className="text-sm font-medium text-gray-700">
                Just trying outfits – No specific occasion
              </label>
              <p className="text-xs text-gray-500">
                Get general style feedback instead
              </p>
            </div>
            <Switch
              id="neutral-toggle"
              checked={isNeutral}
              onCheckedChange={setIsNeutral}
            />
          </div>

          <Button
            onClick={handleNext}
            disabled={!isValid}
            className="w-full fashion-button"
          >
            Next: Upload Photo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OccasionContextInput;
