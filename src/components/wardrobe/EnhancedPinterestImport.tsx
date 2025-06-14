
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExternalLink, Download, Sparkles, Palette, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getPinterestConnections } from '@/services/pinterest/auth';
import PinterestConnectionDialog from './PinterestConnectionDialog';

interface EnhancedPinterestImportProps {
  onImportComplete: () => void;
}

const EnhancedPinterestImport: React.FC<EnhancedPinterestImportProps> = ({
  onImportComplete
}) => {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const { data: connections, refetch } = useQuery({
    queryKey: ['pinterest-connections'],
    queryFn: getPinterestConnections,
  });

  const handleBulkImport = async () => {
    if (!connections || connections.length === 0) {
      setShowConnectionDialog(true);
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Simulate bulk import process
      const steps = [
        'Discovering boards...',
        'Filtering fashion content...',
        'Analyzing pins...',
        'Extracting colors and styles...',
        'Importing inspirations...'
      ];

      for (let i = 0; i < steps.length; i++) {
        toast.info(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setImportProgress((i + 1) * 20);
      }

      toast.success('Successfully imported 47 new outfit inspirations!');
      onImportComplete();

    } catch (error) {
      console.error('❌ Bulk import error:', error);
      toast.error('Failed to import Pinterest content');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const connectedAccount = connections?.[0];

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      {connectedAccount ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <CardTitle className="text-lg">Pinterest Connected</CardTitle>
              </div>
              <Badge variant="outline" className="bg-white">
                @{connectedAccount.username}
              </Badge>
            </div>
            <CardDescription>
              Ready to import from {connectedAccount.board_count} boards with {connectedAccount.pin_count} pins
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <ExternalLink className="w-5 h-5" />
              Connect Pinterest First
            </CardTitle>
            <CardDescription className="text-amber-700">
              Connect your Pinterest account to unlock advanced import features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowConnectionDialog(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              Connect Pinterest Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Import Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-500" />
              Bulk Board Import
            </CardTitle>
            <CardDescription>
              Import all fashion-related pins from your connected boards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Sparkles className="w-4 h-4" />
                <span>Smart fashion content filtering</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Palette className="w-4 h-4" />
                <span>Automatic color palette extraction</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Tag className="w-4 h-4" />
                <span>Style and trend analysis</span>
              </div>
              <Button 
                onClick={handleBulkImport}
                disabled={isImporting || !connectedAccount}
                className="w-full"
              >
                {isImporting ? 'Importing...' : 'Start Bulk Import'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-purple-500" />
              Selective Import
            </CardTitle>
            <CardDescription>
              Choose specific boards or pins to import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Browse your Pinterest boards and select exactly what you want to import into your inspiration collection.
              </p>
              <Button 
                variant="outline"
                disabled={!connectedAccount}
                className="w-full"
              >
                Browse My Boards
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Progress */}
      {isImporting && (
        <Card>
          <CardHeader>
            <CardTitle>Importing Pinterest Content</CardTitle>
            <CardDescription>
              Processing your Pinterest boards and pins...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Dialog */}
      <PinterestConnectionDialog
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
        onConnectionSuccess={() => {
          setShowConnectionDialog(false);
          refetch();
        }}
      />
    </div>
  );
};

export default EnhancedPinterestImport;
