import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ColorAnalysis } from '@/hooks/useStyleProfile';
import { Check, Edit2, Palette } from 'lucide-react';

interface ColorAnalysisConfirmationProps {
  analysis: ColorAnalysis;
  onConfirm: (colorData: ColorAnalysis, isManualOverride: boolean) => void;
  onEdit: () => void;
}

const SEASONAL_TYPES = [
  'Light Spring', 'Warm Spring', 'Clear Spring',
  'Light Summer', 'Cool Summer', 'Soft Summer',
  'Warm Autumn', 'Deep Autumn', 'Soft Autumn',
  'Cool Winter', 'Deep Winter', 'Clear Winter'
];

const SKIN_TONES = ['fair', 'medium', 'olive', 'deep'];
const UNDERTONES = ['cool', 'warm', 'neutral'];

const ColorAnalysisConfirmation: React.FC<ColorAnalysisConfirmationProps> = ({
  analysis,
  onConfirm,
  onEdit
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnalysis, setEditedAnalysis] = useState<ColorAnalysis>(analysis);

  const handleConfirm = () => {
    const isManualOverride = JSON.stringify(editedAnalysis) !== JSON.stringify(analysis);
    onConfirm(editedAnalysis, isManualOverride);
  };

  const handleSliderChange = (field: 'undertoneValue' | 'contrastValue' | 'depthValue') => (value: number[]) => {
    setEditedAnalysis(prev => ({ ...prev, [field]: value[0] }));
  };

  return (
    <Card className="fashion-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Analysis
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="text-fashion-600 hover:text-fashion-800"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Analysis Result */}
        <div className="bg-fashion-50 rounded-lg p-4">
          <h4 className="font-semibold text-fashion-900 mb-2">
            AI Analysis: {analysis.seasonalType}
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-fashion-800">Skin Tone:</span>
              <span className="text-fashion-700 ml-2">{analysis.skinTone}</span>
            </div>
            <div>
              <span className="font-medium text-fashion-800">Undertone:</span>
              <span className="text-fashion-700 ml-2">{analysis.undertone}</span>
            </div>
            <div>
              <span className="font-medium text-fashion-800">Hair:</span>
              <span className="text-fashion-700 ml-2">{analysis.hairColor}</span>
            </div>
            <div>
              <span className="font-medium text-fashion-800">Eyes:</span>
              <span className="text-fashion-700 ml-2">{analysis.eyeColor}</span>
            </div>
          </div>
          <p className="text-sm text-fashion-600 leading-relaxed mt-3">
            {analysis.explanation}
          </p>
        </div>

        {/* Confirmation/Edit Section */}
        {isEditing ? (
          <div className="space-y-6">
            {/* Seasonal Type */}
            <div>
              <label className="text-sm font-medium text-fashion-800 mb-2 block">
                Seasonal Color Type:
              </label>
              <Select value={editedAnalysis.seasonalType} onValueChange={(value) => 
                setEditedAnalysis(prev => ({ ...prev, seasonalType: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEASONAL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Basic Features */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-fashion-800 mb-2 block">
                  Skin Tone:
                </label>
                <Select value={editedAnalysis.skinTone} onValueChange={(value: any) => 
                  setEditedAnalysis(prev => ({ ...prev, skinTone: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SKIN_TONES.map((tone) => (
                      <SelectItem key={tone} value={tone}>{tone.charAt(0).toUpperCase() + tone.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-fashion-800 mb-2 block">
                  Undertone:
                </label>
                <Select value={editedAnalysis.undertone} onValueChange={(value: any) => 
                  setEditedAnalysis(prev => ({ ...prev, undertone: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNDERTONES.map((tone) => (
                      <SelectItem key={tone} value={tone}>{tone.charAt(0).toUpperCase() + tone.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-fashion-800 mb-3 block">
                  Undertone Scale: {editedAnalysis.undertoneValue}% ({editedAnalysis.undertoneValue < 33 ? 'Cool' : editedAnalysis.undertoneValue > 66 ? 'Warm' : 'Neutral'})
                </label>
                <div className="relative">
                  <Slider
                    value={[editedAnalysis.undertoneValue]}
                    onValueChange={handleSliderChange('undertoneValue')}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-fashion-600 mt-1">
                    <span>Cool</span>
                    <span>Neutral</span>
                    <span>Warm</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-fashion-800 mb-3 block">
                  Contrast Level: {editedAnalysis.contrastValue}% ({editedAnalysis.contrastValue < 33 ? 'Low' : editedAnalysis.contrastValue > 66 ? 'High' : 'Medium'})
                </label>
                <div className="relative">
                  <Slider
                    value={[editedAnalysis.contrastValue]}
                    onValueChange={handleSliderChange('contrastValue')}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-fashion-600 mt-1">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-fashion-800 mb-3 block">
                  Depth Level: {editedAnalysis.depthValue}% ({editedAnalysis.depthValue < 33 ? 'Light' : editedAnalysis.depthValue > 66 ? 'Deep' : 'Medium'})
                </label>
                <div className="relative">
                  <Slider
                    value={[editedAnalysis.depthValue]}
                    onValueChange={handleSliderChange('depthValue')}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-fashion-600 mt-1">
                    <span>Light</span>
                    <span>Medium</span>
                    <span>Deep</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfirm} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Confirm Analysis
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Analysis Display */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-green-900">
                  {editedAnalysis.seasonalType}
                </h4>
                <Check className="h-5 w-5 text-green-600" />
              </div>
              
              {/* Color Scales */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm text-green-800 mb-1">
                    <span>Undertone</span>
                    <span>{editedAnalysis.undertoneValue}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-gradient-to-r from-blue-400 via-gray-400 to-orange-400 relative">
                    <div 
                      className="absolute top-0 w-3 h-3 bg-white border-2 border-green-600 rounded-full transform -translate-x-1/2"
                      style={{ left: `${editedAnalysis.undertoneValue}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-green-800 mb-1">
                    <span>Contrast</span>
                    <span>{editedAnalysis.contrastValue}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-gradient-to-r from-gray-300 to-gray-900 relative">
                    <div 
                      className="absolute top-0 w-3 h-3 bg-white border-2 border-green-600 rounded-full transform -translate-x-1/2"
                      style={{ left: `${editedAnalysis.contrastValue}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-green-800 mb-1">
                    <span>Depth</span>
                    <span>{editedAnalysis.depthValue}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-gradient-to-r from-yellow-200 to-indigo-900 relative">
                    <div 
                      className="absolute top-0 w-3 h-3 bg-white border-2 border-green-600 rounded-full transform -translate-x-1/2"
                      style={{ left: `${editedAnalysis.depthValue}%` }}
                    />
                  </div>
                </div>
              </div>

              {JSON.stringify(editedAnalysis) !== JSON.stringify(analysis) && (
                <div className="text-xs text-green-700 mt-2">
                  (Manually edited from AI suggestion)
                </div>
              )}
            </div>

            <Button onClick={handleConfirm} className="w-full">
              Proceed with This Color Analysis
            </Button>
          </div>
        )}

        {/* Option to re-analyze */}
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={onEdit} className="text-fashion-600">
            Re-analyze from Different Image
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ColorAnalysisConfirmation;