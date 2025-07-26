import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const PremiumAccessMessage: React.FC = () => {
  const { user } = useAuth();

  // Only show for logged-in users
  if (!user) {
    return null;
  }

  const premiumFeatures = [
    'Personalized color analysis based on your unique features',
    'Custom wardrobe color guide with specific recommendations',
    'Detailed body type analysis with styling tips',
    'Professional fashion insights beyond basic rating'
  ];

  return (
    <Card className="mb-8 border-green-200 bg-green-50">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
            <Crown className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">
              Premium Access Activated
            </h3>
            <p className="text-sm text-green-700">
              You now have access to all premium features!
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-3">
          {premiumFeatures.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-800">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumAccessMessage;