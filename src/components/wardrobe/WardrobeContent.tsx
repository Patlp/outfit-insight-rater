
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getWardrobeItems } from '@/services/wardrobe';
import { WardrobeItem } from '@/services/wardrobe';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WardrobeHeader from './WardrobeHeader';
import DigitalWardrobeTab from './DigitalWardrobeTab';
import OutfitHistoryTab from './OutfitHistoryTab';
import InspirationsTab from '../inspirations/InspirationsTab';
import { Shirt, Image, Star } from 'lucide-react';

const WardrobeContent: React.FC = () => {
  const { user } = useAuth();
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWardrobeItems = async () => {
    if (!user) return;

    try {
      const result = await getWardrobeItems(user.id);
      if (result.items) {
        setWardrobeItems(result.items);
      }
    } catch (error) {
      console.error('Error fetching wardrobe items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWardrobeItems();
  }, [user]);

  return (
    <div className="min-h-screen bg-warm-cream">
      <WardrobeHeader itemCount={wardrobeItems.length} isLoading={isLoading} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="wardrobe" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="wardrobe" className="flex items-center gap-2">
              <Shirt size={16} />
              My Wardrobe
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Star size={16} />
              Outfit History
            </TabsTrigger>
            <TabsTrigger value="inspirations" className="flex items-center gap-2">
              <Image size={16} />
              Inspirations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="wardrobe">
            <DigitalWardrobeTab 
              wardrobeItems={wardrobeItems}
              isLoading={isLoading}
              onItemsUpdated={fetchWardrobeItems}
            />
          </TabsContent>
          
          <TabsContent value="history">
            <OutfitHistoryTab 
              wardrobeItems={wardrobeItems}
              onItemsUpdated={fetchWardrobeItems}
            />
          </TabsContent>
          
          <TabsContent value="inspirations">
            <InspirationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WardrobeContent;
