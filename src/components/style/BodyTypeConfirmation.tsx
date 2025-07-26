import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BodyTypeAnalysis } from '@/hooks/useStyleProfile';
import { Check, Edit2 } from 'lucide-react';

interface BodyTypeConfirmationProps {
  analysis: BodyTypeAnalysis;
  onConfirm: (bodyType: string, isManualOverride: boolean) => void;
  onEdit: () => void;
}

const BODY_TYPE_OPTIONS = [
  { value: 'rectangle', label: 'Rectangle', description: 'Balanced shoulders and hips, minimal waist definition' },
  { value: 'pear', label: 'Pear', description: 'Wider hips than shoulders, defined waist' },
  { value: 'hourglass', label: 'Hourglass', description: 'Balanced shoulders and hips, defined waist' },
  { value: 'inverted_triangle', label: 'Inverted Triangle', description: 'Broader shoulders than hips' },
  { value: 'undefined', label: 'Undefined', description: 'Cannot determine from available image' }
];

const BodyTypeConfirmation: React.FC<BodyTypeConfirmationProps> = ({
  analysis,
  onConfirm,
  onEdit
}) => {
  const [selectedBodyType, setSelectedBodyType] = useState(analysis.bodyType);
  const [isEditing, setIsEditing] = useState(false);

  const handleConfirm = () => {
    const isManualOverride = selectedBodyType !== analysis.bodyType;
    onConfirm(selectedBodyType, isManualOverride);
  };

  const selectedOption = BODY_TYPE_OPTIONS.find(opt => opt.value === selectedBodyType);

  return (
    <Card className="fashion-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Body Type Analysis</span>
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
      <CardContent className="space-y-4">
        {/* AI Analysis Result */}
        <div className="bg-fashion-50 rounded-lg p-4">
          <h4 className="font-semibold text-fashion-900 mb-2">
            AI Analysis: {analysis.bodyType.charAt(0).toUpperCase() + analysis.bodyType.slice(1)}
          </h4>
          <p className="text-sm text-fashion-700 mb-2">
            Confidence: {Math.round(analysis.confidence * 100)}%
          </p>
          <p className="text-sm text-fashion-600 leading-relaxed">
            {analysis.explanation}
          </p>
        </div>

        {/* Confirmation/Edit Section */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-fashion-800 mb-2 block">
                Select Your Body Type:
              </label>
              <Select value={selectedBodyType} onValueChange={(value: any) => setSelectedBodyType(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select body type" />
                </SelectTrigger>
                <SelectContent>
                  {BODY_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-fashion-600">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOption && (
              <div className="bg-fashion-25 border border-fashion-200 rounded-lg p-3">
                <p className="text-sm text-fashion-700">{selectedOption.description}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleConfirm} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Confirm Selection
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
              <div>
                <span className="font-medium text-green-900">
                  Selected: {selectedBodyType.charAt(0).toUpperCase() + selectedBodyType.slice(1)}
                </span>
                {selectedBodyType !== analysis.bodyType && (
                  <span className="text-xs text-green-700 block">
                    (Manually edited from AI suggestion)
                  </span>
                )}
              </div>
              <Check className="h-5 w-5 text-green-600" />
            </div>

            <Button onClick={handleConfirm} className="w-full">
              Proceed with This Body Type
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

export default BodyTypeConfirmation;