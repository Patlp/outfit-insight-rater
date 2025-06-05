
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, Database, Brain, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';

const TaggingFlowDiagram: React.FC = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain size={20} />
          Live Tagging Function Flow Diagram
        </CardTitle>
        <p className="text-sm text-gray-600">
          Real-time visualization of the wardrobe tagging process with primary taxonomy priority
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Step 1: Input */}
          <div className="flex flex-col items-center space-y-2">
            <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 w-full max-w-md text-center">
              <h3 className="font-semibold text-blue-800">1. User Input</h3>
              <p className="text-sm text-blue-600">Feedback text + Style suggestions</p>
            </div>
            <ArrowDown className="text-gray-400" size={24} />
          </div>

          {/* Step 2: Primary Taxonomy Check */}
          <div className="flex flex-col items-center space-y-2">
            <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-4 w-full max-w-md text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Database size={16} className="text-purple-600" />
                <h3 className="font-semibold text-purple-800">2. Primary Taxonomy Check</h3>
                <Badge variant="outline" className="text-xs bg-purple-50">PRIORITY #1</Badge>
              </div>
              <p className="text-sm text-purple-600">Search uploaded taxonomy data first</p>
              <div className="mt-2 text-xs text-purple-500">
                Confidence boost: +10% for matches
              </div>
            </div>
            <ArrowDown className="text-gray-400" size={24} />
          </div>

          {/* Step 3: Enhanced Dataset Matching */}
          <div className="flex flex-col items-center space-y-2">
            <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 w-full max-w-md text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles size={16} className="text-green-600" />
                <h3 className="font-semibold text-green-800">3. Enhanced Dataset Matching</h3>
              </div>
              <div className="space-y-1 text-sm text-green-600">
                <p>• Kaggle clothing dataset</p>
                <p>• Fashionpedia categories</p>
                <p>• Academic paper references</p>
              </div>
            </div>
            <ArrowDown className="text-gray-400" size={24} />
          </div>

          {/* Step 4: AI Extraction */}
          <div className="flex flex-col items-center space-y-2">
            <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-4 w-full max-w-md text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Brain size={16} className="text-orange-600" />
                <h3 className="font-semibold text-orange-800">4. AI Extraction (Fallback)</h3>
              </div>
              <p className="text-sm text-orange-600">OpenAI GPT-4o-mini with structured prompts</p>
              <div className="mt-2 text-xs text-orange-500">
                Used only if primary sources fail
              </div>
            </div>
            <ArrowDown className="text-gray-400" size={24} />
          </div>

          {/* Step 5: Strict Validation */}
          <div className="flex flex-col items-center space-y-2">
            <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 w-full max-w-md text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle size={16} className="text-red-600" />
                <h3 className="font-semibold text-red-800">5. Strict Validation</h3>
              </div>
              <div className="space-y-1 text-xs text-red-600">
                <p>✓ 90% minimum confidence</p>
                <p>✓ Maximum 2 words</p>
                <p>✓ No prepositions</p>
                <p>✓ Style section cross-validation</p>
                <p>✓ Primary taxonomy validation</p>
              </div>
            </div>
            <ArrowDown className="text-gray-400" size={24} />
          </div>

          {/* Step 6: Final Output */}
          <div className="flex flex-col items-center space-y-2">
            <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 w-full max-w-md text-center">
              <h3 className="font-semibold text-gray-800">6. Tagged Wardrobe Item</h3>
              <p className="text-sm text-gray-600">Validated clothing items with confidence scores</p>
              <div className="mt-2 flex justify-center space-x-2">
                <Badge variant="secondary" className="text-xs">High Confidence</Badge>
                <Badge variant="outline" className="text-xs">Primary Source</Badge>
              </div>
            </div>
          </div>

          {/* Data Sources Priority */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-3">Data Source Priority (Live)</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">1. Primary Taxonomy (Uploaded CSV)</span>
                <Badge className="bg-purple-500">HIGHEST</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">2. Whitelist (Auto-synced)</span>
                <Badge className="bg-blue-500">HIGH</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">3. Kaggle Dataset</span>
                <Badge className="bg-green-500">MEDIUM</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">4. AI Extraction</span>
                <Badge className="bg-orange-500">FALLBACK</Badge>
              </div>
            </div>
          </div>

          {/* Real-time Stats */}
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              <CheckCircle size={16} />
              Current System Status
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Primary Taxonomy:</span>
                <span className="ml-2 text-green-600">Active & Prioritized</span>
              </div>
              <div>
                <span className="font-medium">Auto-Sync:</span>
                <span className="ml-2 text-green-600">Enabled</span>
              </div>
              <div>
                <span className="font-medium">Validation:</span>
                <span className="ml-2 text-green-600">Strict Mode</span>
              </div>
              <div>
                <span className="font-medium">Confidence Threshold:</span>
                <span className="ml-2 text-green-600">90%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaggingFlowDiagram;
