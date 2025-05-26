
import React from 'react';
import { X } from 'lucide-react';

interface ImagePreviewProps {
  imageSrc: string;
  onReset: () => void;
  children?: React.ReactNode;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ imageSrc, onReset, children }) => {
  return (
    <div className="max-w-md w-full mx-auto">
      <div className="mb-4 relative rounded-2xl overflow-hidden shadow-lg">
        <img 
          src={imageSrc} 
          alt="Outfit preview" 
          className="w-full h-auto object-cover"
        />
        <button 
          onClick={onReset}
          className="absolute top-3 right-3 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-colors"
        >
          <X size={18} className="text-gray-700" />
        </button>
      </div>
      
      {children}
    </div>
  );
};

export default ImagePreview;
