
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Database, Plus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { searchKaggleClothingItems, importKaggleDataSample, KaggleClothingItem } from '@/services/kaggleClothingService';
import { enhancedClothingMatcher } from '@/services/enhancedClothingMatcher';

const KaggleIntegrationTest: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchResults, setSearchResults] = useState<KaggleClothingItem[]>([]);
  const [enhancedResults, setEnhancedResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await searchKaggleClothingItems(searchQuery);
      
      if (error) {
        toast.error('Failed to search Kaggle dataset');
        console.error('Search error:', error);
      } else {
        setSearchResults(data || []);
        toast.success(`Found ${data?.length || 0} items in Kaggle dataset`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search Kaggle dataset');
    } finally {
      setIsSearching(false);
    }
  };

  const handleEnhancedSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const results = await enhancedClothingMatcher(searchQuery);
      setEnhancedResults(results);
      toast.success(`Enhanced matching found ${results.length} items`);
    } catch (error) {
      console.error('Enhanced search error:', error);
      toast.error('Enhanced search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportSampleData = async () => {
    setIsImporting(true);
    try {
      const result = await importKaggleDataSample();
      
      if (result.success) {
        toast.success('Sample data imported successfully');
      } else {
        toast.error(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import sample data');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="text-purple-500" size={24} />
            Kaggle Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for clothing items (e.g., 'blue jeans', 'white shirt')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              variant="outline"
            >
              {isSearching ? 'Searching...' : <Search size={16} />}
            </Button>
            <Button 
              onClick={handleEnhancedSearch} 
              disabled={isSearching}
              className="bg-purple-500 hover:bg-purple-600"
            >
              Enhanced Search
            </Button>
          </div>

          <Button 
            onClick={handleImportSampleData} 
            disabled={isImporting}
            variant="outline"
            className="w-full"
          >
            {isImporting ? 'Importing...' : (
              <>
                <Plus size={16} className="mr-2" />
                Import Sample Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kaggle Dataset Results ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {searchResults.slice(0, 5).map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium">{item.product_name}</h3>
                    {item.rating && (
                      <Badge variant="secondary">★ {item.rating}</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.category && (
                      <Badge variant="outline">{item.category}</Badge>
                    )}
                    {item.color && (
                      <Badge variant="outline">{item.color}</Badge>
                    )}
                    {item.material && (
                      <Badge variant="outline">{item.material}</Badge>
                    )}
                    {item.brand && (
                      <Badge variant="outline">{item.brand}</Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600">{item.description}</p>
                  )}
                  {item.price && (
                    <p className="text-sm font-medium text-green-600">${item.price}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {enhancedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="text-purple-500" size={20} />
              Enhanced Matching Results ({enhancedResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {enhancedResults.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium">{item.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {Math.round(item.confidence * 100)}% confidence
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={
                          item.source === 'kaggle' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          item.source === 'enhanced' ? 'bg-green-50 text-green-700 border-green-200' :
                          item.source === 'hybrid' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }
                      >
                        {item.source}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">{item.category}</Badge>
                    {item.descriptors.map((desc: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {desc}
                      </Badge>
                    ))}
                  </div>
                  {item.kaggleMatch && (
                    <div className="text-sm text-purple-600 bg-purple-50 p-2 rounded">
                      <strong>Kaggle Match:</strong> {item.kaggleMatch.product_name}
                      {item.kaggleMatch.brand && ` by ${item.kaggleMatch.brand}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KaggleIntegrationTest;
