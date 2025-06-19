
import React from 'react';
import { Shirt, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BulkUploadDialog from './BulkUploadDialog';

interface EmptyWardrobeStateProps {
  onAddItem?: () => void;
  onBulkUploadComplete?: () => void;
}

const EmptyWardrobeState: React.FC<EmptyWardrobeStateProps> = ({
  onAddItem = () => {},
  onBulkUploadComplete = () => {}
}) => {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-6">
        <Shirt size={64} className="text-gray-300" />
      </div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        No clothing items found
      </h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">
        Your individual clothing items will appear here once you save outfits with AI-extracted tags.
      </p>
      <div className="flex gap-3 justify-center">
        <Button onClick={onAddItem} className="flex items-center gap-2">
          <Plus size={16} />
          Add Custom Item
        </Button>
        <BulkUploadDialog onUploadComplete={onBulkUploadComplete}>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus size={16} />
            Bulk Upload
          </Button>
        </BulkUploadDialog>
      </div>
    </div>
  );
};

export default EmptyWardrobeState;
