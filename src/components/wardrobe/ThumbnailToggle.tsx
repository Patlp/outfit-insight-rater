
import React from 'react';
import { Toggle } from '@/components/ui/toggle';
import { Image, Camera } from 'lucide-react';

interface ThumbnailToggleProps {
  showOriginal: boolean;
  onToggle: (showOriginal: boolean) => void;
}

const ThumbnailToggle: React.FC<ThumbnailToggleProps> = ({ showOriginal, onToggle }) => {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
      <div className="flex items-center gap-2">
        <Toggle
          pressed={!showOriginal}
          onPressedChange={(pressed) => onToggle(!pressed)}
          className="flex items-center gap-2 px-3 py-2"
          variant="outline"
        >
          <Image size={16} />
          AI Generated
        </Toggle>
        <Toggle
          pressed={showOriginal}
          onPressedChange={(pressed) => onToggle(pressed)}
          className="flex items-center gap-2 px-3 py-2"
          variant="outline"
        >
          <Camera size={16} />
          Original
        </Toggle>
      </div>
    </div>
  );
};

export default ThumbnailToggle;
