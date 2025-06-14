
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { importPinterestContent } from '@/services/outfitInspiration';

interface PinterestImportProps {
  onImportComplete: () => void;
}

const PinterestImport: React.FC<PinterestImportProps> = ({ onImportComplete }) => {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('Please sign in to import Pinterest content');
      return;
    }

    if (!url.trim()) {
      toast.error('Please enter a Pinterest URL');
      return;
    }

    // Basic Pinterest URL validation
    if (!url.includes('pinterest.com')) {
      toast.error('Please enter a valid Pinterest URL');
      return;
    }

    setIsImporting(true);

    try {
      console.log('🔄 Starting Pinterest import for URL:', url);
      
      const result = await importPinterestContent({
        userId: user.id,
        sourceUrl: url,
        sourceType: 'pinterest'
      });

      if (result.error) {
        console.error('❌ Pinterest import failed:', result.error);
        toast.error(`Import failed: ${result.error}`);
      } else {
        console.log('✅ Pinterest import successful:', result);
        toast.success('Pinterest content imported successfully!');
        setUrl('');
        onImportComplete();
      }
    } catch (error) {
      console.error('❌ Pinterest import error:', error);
      toast.error('Failed to import Pinterest content. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <form onSubmit={handleImport} className="space-y-4">
      <div>
        <Label htmlFor="pinterest-url">Pinterest URL</Label>
        <Input
          id="pinterest-url"
          type="url"
          placeholder="https://pinterest.com/username/board-name/ or https://pinterest.com/pin/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isImporting}
        />
        <p className="text-sm text-gray-500 mt-1">
          You can import from a Pinterest board or individual pin
        </p>
      </div>

      <Button 
        type="submit" 
        disabled={isImporting || !url.trim()}
        className="w-full"
      >
        {isImporting ? 'Importing...' : 'Import from Pinterest'}
      </Button>
    </form>
  );
};

export default PinterestImport;
