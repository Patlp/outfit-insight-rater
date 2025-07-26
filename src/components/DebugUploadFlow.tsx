import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUploadSession } from '@/context/UploadSessionContext';
import { useRating } from '@/context/RatingContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, User, FileImage, Settings } from 'lucide-react';

const DebugUploadFlow: React.FC = () => {
  const { user } = useAuth();
  const { currentUpload, analysisResult } = useUploadSession();
  const { 
    selectedGender, 
    feedbackMode, 
    isAnalyzing, 
    ratingResult, 
    imageFile, 
    imageSrc,
    occasionContext
  } = useRating();
  
  const [dbStats, setDbStats] = useState({
    outfitCount: 0,
    lastUpload: null as string | null,
    loading: false
  });

  const fetchDbStats = async () => {
    if (!user) return;
    
    setDbStats(prev => ({ ...prev, loading: true }));
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) {
        setDbStats({
          outfitCount: data.length,
          lastUpload: data[0]?.created_at || null,
          loading: false
        });
      }
    } catch (error) {
      console.error('Debug: Failed to fetch DB stats:', error);
      setDbStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchDbStats();
  }, [user]);

  const getStatusColor = (status: boolean | null | undefined) => {
    if (status === null || status === undefined) return 'secondary';
    return status ? 'default' : 'destructive';
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Settings className="h-5 w-5" />
          Upload Flow Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authentication Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">Authentication</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant={getStatusColor(!!user)}>
                User: {user ? 'Authenticated' : 'Not authenticated'}
              </Badge>
              {user && (
                <Badge variant="outline">
                  ID: {user.id.slice(0, 8)}...
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="font-medium">Database</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchDbStats}
                disabled={dbStats.loading}
              >
                <RefreshCw className={`h-3 w-3 ${dbStats.loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline">
                Outfits: {dbStats.outfitCount}
              </Badge>
              {dbStats.lastUpload && (
                <Badge variant="outline">
                  Last: {new Date(dbStats.lastUpload).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Upload Session Context */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            <span className="font-medium">Upload Session</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge variant={getStatusColor(!!currentUpload)}>
              Current Upload: {currentUpload ? 'Present' : 'None'}
            </Badge>
            <Badge variant={getStatusColor(!!analysisResult)}>
              Analysis Result: {analysisResult ? 'Present' : 'None'}
            </Badge>
            {currentUpload && (
              <>
                <Badge variant="outline">
                  Gender: {currentUpload.gender}
                </Badge>
                <Badge variant="outline">
                  Mode: {currentUpload.feedbackMode}
                </Badge>
                <Badge variant="outline">
                  Time: {new Date(currentUpload.timestamp).toLocaleTimeString()}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Rating Context */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="font-medium">Rating Context</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge variant={getStatusColor(!!imageFile)}>
              Image File: {imageFile ? 'Present' : 'None'}
            </Badge>
            <Badge variant={getStatusColor(!!imageSrc)}>
              Image Src: {imageSrc ? 'Present' : 'None'}
            </Badge>
            <Badge variant={getStatusColor(!!ratingResult)}>
              Rating Result: {ratingResult ? 'Present' : 'None'}
            </Badge>
            <Badge variant={getStatusColor(!isAnalyzing)}>
              Analysis: {isAnalyzing ? 'In Progress' : 'Ready'}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline">
              Gender: {selectedGender}
            </Badge>
            <Badge variant="outline">
              Mode: {feedbackMode}
            </Badge>
            {occasionContext && (
              <Badge variant="outline">
                Occasion: {occasionContext.eventContext || 'Neutral'}
              </Badge>
            )}
          </div>
        </div>

        {/* Analysis Results Summary */}
        {(analysisResult || ratingResult) && (
          <div className="space-y-2">
            <span className="font-medium">Analysis Summary</span>
            <div className="flex flex-wrap gap-1">
              {analysisResult && (
                <>
                  <Badge variant="default">
                    Score: {analysisResult.score}/10
                  </Badge>
                  <Badge variant="outline">
                    Suggestions: {analysisResult.suggestions?.length || 0}
                  </Badge>
                  <Badge variant={getStatusColor(!!analysisResult.styleAnalysis)}>
                    Style Analysis: {analysisResult.styleAnalysis ? 'Present' : 'Missing'}
                  </Badge>
                </>
              )}
              {ratingResult && ratingResult !== analysisResult && (
                <>
                  <Badge variant="secondary">
                    Rating Score: {ratingResult.score}/10
                  </Badge>
                  <Badge variant="outline">
                    Rating Suggestions: {ratingResult.suggestions?.length || 0}
                  </Badge>
                </>
              )}
            </div>
          </div>
        )}

        {/* Timestamp Info */}
        <div className="text-xs text-blue-600 pt-2 border-t border-blue-200">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugUploadFlow;