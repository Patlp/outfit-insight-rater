
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Calendar, Users, FileText, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { getAcademicPapers, type AcademicPaper } from '@/services/academicPaperService';
import { toast } from 'sonner';

const AcademicPapersList: React.FC = () => {
  const [papers, setPapers] = useState<AcademicPaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPapers();
  }, []);

  const loadPapers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await getAcademicPapers();
      
      if (error) {
        toast.error('Failed to load academic papers');
        console.error('Error loading papers:', error);
        return;
      }
      
      setPapers(data || []);
    } catch (error) {
      console.error('Error loading papers:', error);
      toast.error('Failed to load academic papers');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'processing':
        return <Clock className="text-yellow-500" size={16} />;
      case 'failed':
        return <XCircle className="text-red-500" size={16} />;
      default:
        return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="text-blue-500" size={24} />
            Academic Papers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <span className="ml-2">Loading papers...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="text-blue-500" size={24} />
          Academic Papers ({papers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {papers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No academic papers uploaded yet.</p>
            <p className="text-sm">Upload papers to start building the knowledge base.</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {papers.map((paper) => (
                <div key={paper.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg leading-tight">{paper.title}</h3>
                      {paper.authors && paper.authors.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                          <Users size={14} />
                          <span>{paper.authors.join(', ')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusIcon(paper.processing_status || 'pending')}
                      <Badge className={getStatusColor(paper.processing_status || 'pending')}>
                        {paper.processing_status || 'pending'}
                      </Badge>
                    </div>
                  </div>

                  {paper.abstract && (
                    <p className="text-sm text-gray-700 line-clamp-2">{paper.abstract}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {paper.journal && (
                      <div className="flex items-center gap-1">
                        <FileText size={14} />
                        <span>{paper.journal}</span>
                      </div>
                    )}
                    {paper.publication_year && (
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{paper.publication_year}</span>
                      </div>
                    )}
                    {paper.doi && (
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs">DOI: {paper.doi}</span>
                      </div>
                    )}
                  </div>

                  {paper.keywords && paper.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {paper.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Uploaded: {new Date(paper.created_at || '').toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AcademicPapersList;
