
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, 
  Search, 
  Tags, 
  Palette, 
  Shirt,
  Info,
  BookOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FashionTerm {
  id: string;
  term: string;
  category: string;
  definition?: string;
  synonyms?: string[];
  confidence_score: number;
  source_papers?: string[];
}

interface StylingPrinciple {
  id: string;
  principle_name: string;
  description: string;
  category: string;
  applicable_items: string[];
  confidence_score: number;
}

const EnhancedTaggingPreview: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fashionTerms, setFashionTerms] = useState<FashionTerm[]>([]);
  const [stylingPrinciples, setStylingPrinciples] = useState<StylingPrinciple[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadFashionKnowledge();
  }, []);

  const loadFashionKnowledge = async () => {
    try {
      setIsLoading(true);

      // Load fashion terminology
      const { data: terms, error: termsError } = await supabase
        .from('fashion_terminology')
        .select('*')
        .order('confidence_score', { ascending: false })
        .limit(50);

      if (termsError) {
        console.error('Error loading fashion terms:', termsError);
      } else {
        setFashionTerms(terms || []);
      }

      // Load styling principles
      const { data: principles, error: principlesError } = await supabase
        .from('fashion_styling_principles')
        .select('*')
        .order('confidence_score', { ascending: false })
        .limit(20);

      if (principlesError) {
        console.error('Error loading styling principles:', principlesError);
      } else {
        setStylingPrinciples(principles || []);
      }

    } catch (error) {
      console.error('Error loading fashion knowledge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'clothing_item': 'bg-blue-100 text-blue-800',
      'descriptor': 'bg-green-100 text-green-800',
      'material': 'bg-purple-100 text-purple-800',
      'color': 'bg-red-100 text-red-800',
      'style': 'bg-yellow-100 text-yellow-800',
      'technique': 'bg-indigo-100 text-indigo-800',
      'color_theory': 'bg-pink-100 text-pink-800',
      'fit_guidelines': 'bg-teal-100 text-teal-800',
      'occasion_matching': 'bg-orange-100 text-orange-800',
      'body_type': 'bg-cyan-100 text-cyan-800',
      'seasonal': 'bg-lime-100 text-lime-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const filteredTerms = fashionTerms.filter(term => {
    const matchesSearch = searchTerm === '' || 
      term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.definition?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(fashionTerms.map(term => term.category)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-amber-500" size={24} />
          Enhanced Fashion Knowledge Preview
        </CardTitle>
        <p className="text-sm text-gray-600">
          Preview of extracted fashion terminology and styling principles from academic papers
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <span className="ml-2">Loading fashion knowledge...</span>
          </div>
        ) : (
          <>
            {/* Knowledge Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Tags className="mx-auto text-blue-500 mb-2" size={20} />
                <div className="text-2xl font-bold text-blue-700">{fashionTerms.length}</div>
                <div className="text-xs text-blue-600">Fashion Terms</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <BookOpen className="mx-auto text-green-500 mb-2" size={20} />
                <div className="text-2xl font-bold text-green-700">{stylingPrinciples.length}</div>
                <div className="text-xs text-green-600">Styling Principles</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Palette className="mx-auto text-purple-500 mb-2" size={20} />
                <div className="text-2xl font-bold text-purple-700">{categories.length}</div>
                <div className="text-xs text-purple-600">Categories</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <Sparkles className="mx-auto text-amber-500 mb-2" size={20} />
                <div className="text-2xl font-bold text-amber-700">
                  {fashionTerms.reduce((sum, term) => sum + (term.confidence_score || 0), 0) / fashionTerms.length || 0}
                </div>
                <div className="text-xs text-amber-600">Avg. Confidence</div>
              </div>
            </div>

            {fashionTerms.length === 0 && stylingPrinciples.length === 0 ? (
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="text-blue-500" size={16} />
                <AlertDescription>
                  No fashion knowledge has been extracted yet. Process some academic papers to see enhanced tagging capabilities.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      placeholder="Search fashion terms..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fashion Terms */}
                {filteredTerms.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Tags size={16} />
                      Fashion Terminology ({filteredTerms.length})
                    </h3>
                    <div className="grid gap-3">
                      {filteredTerms.slice(0, 20).map((term) => (
                        <div key={term.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{term.term}</span>
                                <Badge className={getCategoryColor(term.category)}>
                                  {term.category.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {Math.round((term.confidence_score || 0) * 100)}% confidence
                                </span>
                              </div>
                              {term.definition && (
                                <p className="text-sm text-gray-600 mb-2">{term.definition}</p>
                              )}
                              {term.synonyms && term.synonyms.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-xs text-gray-500">Synonyms:</span>
                                  {term.synonyms.map((synonym, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {synonym}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Styling Principles */}
                {stylingPrinciples.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <Shirt size={16} />
                        Styling Principles ({stylingPrinciples.length})
                      </h3>
                      <div className="grid gap-3">
                        {stylingPrinciples.slice(0, 10).map((principle) => (
                          <div key={principle.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{principle.principle_name}</h4>
                              <div className="flex items-center gap-2">
                                <Badge className={getCategoryColor(principle.category)}>
                                  {principle.category.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {Math.round((principle.confidence_score || 0) * 100)}%
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{principle.description}</p>
                            {principle.applicable_items.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-gray-500">Applies to:</span>
                                {principle.applicable_items.map((item, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTaggingPreview;
