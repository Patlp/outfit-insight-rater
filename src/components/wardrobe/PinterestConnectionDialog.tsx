
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, Calendar, Users, Image, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { 
  initiatePinterestAuth, 
  getPinterestConnections, 
  disconnectPinterest,
  type PinterestConnection 
} from '@/services/pinterest/auth';

interface PinterestConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionSuccess?: () => void;
}

const PinterestConnectionDialog: React.FC<PinterestConnectionDialogProps> = ({
  open,
  onOpenChange,
  onConnectionSuccess
}) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: connections, isLoading, refetch } = useQuery({
    queryKey: ['pinterest-connections'],
    queryFn: getPinterestConnections,
    enabled: open,
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await initiatePinterestAuth();
      // In a real implementation, this would be handled by the OAuth callback
      setTimeout(() => {
        refetch();
        setIsConnecting(false);
        onConnectionSuccess?.();
      }, 3000);
    } catch (error) {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    await disconnectPinterest(connectionId);
    refetch();
  };

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-red-500" />
            Pinterest Connections
          </DialogTitle>
          <DialogDescription>
            Connect your Pinterest account to import boards and pins automatically
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Status */}
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : connections && connections.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Connected Accounts</h3>
              {connections.map((connection) => (
                <Card key={connection.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={connection.profile_image_url} />
                          <AvatarFallback>{connection.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">@{connection.username}</CardTitle>
                          {connection.display_name && (
                            <p className="text-sm text-gray-600">{connection.display_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={connection.sync_enabled ? "default" : "secondary"}>
                          {connection.sync_enabled ? 'Auto-sync ON' : 'Auto-sync OFF'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(connection.id)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-gray-500" />
                        <span>{connection.board_count} boards</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                        <span>{connection.pin_count} pins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{connection.follower_count} followers</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>Last sync: {formatLastSync(connection.last_sync_at)}</span>
                      <span>•</span>
                      <span>Sync frequency: {connection.sync_frequency}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ExternalLink className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Pinterest accounts connected
              </h3>
              <p className="text-gray-500 mb-6">
                Connect your Pinterest account to automatically import your fashion boards and pins
              </p>
            </div>
          )}

          {/* Connect New Account */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Connect Pinterest Account</h3>
                <p className="text-sm text-gray-500">
                  Safely connect using Pinterest's official OAuth
                </p>
              </div>
              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isConnecting ? 'Connecting...' : 'Connect Pinterest'}
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">What you get:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                Automatic board discovery and import
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                Smart filtering of fashion-related content
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                Two-way sync to keep inspirations up-to-date
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                Color palette and style analysis
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinterestConnectionDialog;
