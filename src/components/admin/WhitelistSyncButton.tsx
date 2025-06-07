
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { syncWhitelistWithPrimaryTaxonomy } from '@/services/fashionWhitelistService';
import { useToast } from '@/hooks/use-toast';

const WhitelistSyncButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsLoading(true);
    
    try {
      const result = await syncWhitelistWithPrimaryTaxonomy();
      
      if (result.success) {
        toast({
          title: "Sync successful",
          description: `Updated whitelist with ${result.count} items from primary taxonomy`,
        });
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isLoading}
      className="flex items-center gap-2"
      variant="outline"
    >
      <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
      {isLoading ? 'Syncing...' : 'Sync Whitelist with Primary Taxonomy'}
    </Button>
  );
};

export default WhitelistSyncButton;
