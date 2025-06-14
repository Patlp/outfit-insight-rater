
import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AIGenerationStatusProps {
  isGenerating: boolean;
  hasRenderImage: boolean;
  itemName: string;
  error?: string;
}

const AIGenerationStatus: React.FC<AIGenerationStatusProps> = ({
  isGenerating,
  hasRenderImage,
  itemName,
  error
}) => {
  if (error) {
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertCircle size={12} className="mr-1" />
        Generation Failed
      </Badge>
    );
  }

  if (hasRenderImage) {
    return (
      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
        <CheckCircle size={12} className="mr-1" />
        AI Generated
      </Badge>
    );
  }

  if (isGenerating) {
    return (
      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
        <Loader2 size={12} className="mr-1 animate-spin" />
        Generating...
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs">
      Pending Generation
    </Badge>
  );
};

export default AIGenerationStatus;
