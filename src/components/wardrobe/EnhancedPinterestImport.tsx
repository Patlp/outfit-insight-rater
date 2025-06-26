
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExternalLink, Download, Sparkles, Palette, Tag, Image } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getPinterestConnections } from '@/services/pinterest/auth';
import { fetchPinterestBoards, fetchPinterestPins, importPinterestPins, getUserPinterestBoards } from '@/services/pinterest/boards';
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
  const [importStats, setImportStats] = useState<{
    totalBoards: number;
    totalPins: number;
    fashionPins: number;
    imported: number;
  } | null>(null);

  const { data: connections, refetch } = useQuery({
    queryKey: ['pinterest-connections'],
    queryFn: getPinterestConnections,
  });

  const { data: userBoards } = useQuery({
    queryKey: ['user-pinterest-boards'],
    queryFn: getUserPinterestBoards,
    enabled: connections && connections.length > 0,
  });

  const handleBulkImport = async () => {
    if (!connections || connections.length === 0) {
      setShowConnectionDialog(true);
      return;
    }

    const connection = connections[0];
    setIsImporting(true);
    setImportProgress(0);
    setImportStats(null);

    try {
      toast.info('🔍 Discovering Pinterest boards...');
      setImportProgress(10);

      // Fetch all boards
      const boards = await fetchPinterestBoards(connection.id);
      const fashionBoards = boards.filter((board: any) => 
        board.name.toLowerCase().includes('fashion') ||
        board.name.toLowerCase().includes('style') ||
        board.name.toLowerCase().includes('outfit') ||
        board.description?.toLowerCase().includes('fashion') ||
        board.description?.toLowerCase().includes('style')
      );

      console.log(`📋 Found ${fashionBoards.length} fashion-related boards out of ${boards.length} total`);
      toast.info(`Found ${fashionBoards.length} fashion-related boards`);
      setImportProgress(25);

      let totalFashionPins = 0;
      let totalPins = 0;
      const pinsToImport: string[] = [];

      // Process each fashion board
      for (let i = 0; i < Math.min(fashionBoards.length, 10); i++) { // Limit to 10 boards
        const board = fashionBoards[i];
        toast.info(`📌 Processing board: ${board.name}`);
        
        try {
          const { pins, count, totalPins: boardTotalPins } = await fetchPinterestPins(
            connection.id, 
            board.id, 
            { fashionOnly: true }
          );
          
          totalFashionPins += count;
          totalPins += boardTotalPins;
          
          // Add top pins from this board for import (limit 20 per board)
          const topPins = pins.slice(0, 20).map((pin: any) => pin.id);
          pinsToImport.push(...topPins);
          
          console.log(`📌 Board "${board.name}": ${count} fashion pins out of ${boardTotalPins} total`);
          
        } catch (error) {
          console.error(`❌ Error processing board ${board.name}:`, error);
          continue;
        }
        
        setImportProgress(25 + (i + 1) * (50 / Math.min(fashionBoards.length, 10)));
      }

      setImportStats({
        totalBoards: fashionBoards.length,
        totalPins: totalPins,
        fashionPins: totalFashionPins,
        imported: 0
      });

      toast.info(`📥 Importing ${pinsToImport.length} selected pins...`);
      setImportProgress(80);

      // Import selected pins as outfit inspirations
      if (pinsToImport.length > 0) {
        const importResult = await importPinterestPins(connection.id, pinsToImport);
        
        setImportStats(prev => prev ? {
          ...prev,
          imported: importResult.imported
        } : null);
        
        setImportProgress(100);
        
        toast.success(`🎉 Successfully imported ${importResult.imported} outfit inspirations!`);
        
        if (importResult.failed > 0) {
          toast.warning(`Note: ${importResult.failed} pins could not be imported`);
        }
      } else {
        toast.info('No new pins found to import');
        setImportProgress(100);
      }

      onImportComplete();

    } catch (error) {
      console.error('❌ Bulk import error:', error);
      toast.error('Failed to import Pinterest content');
    } finally {
      setIsImporting(false);
      setTimeout(() => {
        setImportProgress(0);
        setImportStats(null);
      }, 3000);
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

      {/* User's Pinterest Stats */}
      {userBoards && userBoards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-purple-500" />
              Your Pinterest Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">{userBoards.length}</span>
                <p className="text-gray-500">Boards synced</p>
              </div>
              <div>
                <span className="font-medium">{userBoards.reduce((sum, board) => sum + board.pin_count, 0)}</span>
                <p className="text-gray-500">Total pins</p>
              </div>
              <div>
                <span className="font-medium">{userBoards.filter(board => !board.is_secret).length}</span>
                <p className="text-gray-500">Public boards</p>
              </div>
              <div>
                <span className="font-medium">{Math.round(userBoards.reduce((sum, board) => sum + board.follower_count, 0) / userBoards.length)}</span>
                <p className="text-gray-500">Avg followers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-500" />
              Smart Fashion Import
            </CardTitle>
            <CardDescription>
              Automatically discover and import fashion-related pins from your boards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Sparkles className="w-4 h-4" />
                <span>AI-powered fashion content detection</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Palette className="w-4 h-4" />
                <span>Color palette and style analysis</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Tag className="w-4 h-4" />
                <span>Automatic tagging and categorization</span>
              </div>
              <Button 
                onClick={handleBulkImport}
                disabled={isImporting || !connectedAccount}
                className="w-full"
              >
                {isImporting ? 'Importing...' : 'Start Smart Import'}
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
              Browse and choose specific boards or pins to import
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
                onClick={() => toast.info('Selective import coming soon!')}
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
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
              
              {importStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">{importStats.totalBoards}</span>
                    <p className="text-gray-500">Fashion boards</p>
                  </div>
                  <div>
                    <span className="font-medium">{importStats.fashionPins}</span>
                    <p className="text-gray-500">Fashion pins found</p>
                  </div>
                  <div>
                    <span className="font-medium">{importStats.totalPins}</span>
                    <p className="text-gray-500">Total pins processed</p>
                  </div>
                  <div>
                    <span className="font-medium">{importStats.imported}</span>
                    <p className="text-gray-500">Inspirations imported</p>
                  </div>
                </div>
              )}
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
