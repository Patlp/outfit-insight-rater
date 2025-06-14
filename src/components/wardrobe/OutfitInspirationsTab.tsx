
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Link, Image } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import PinterestImport from './PinterestImport';
import PhotoUpload from './PhotoUpload';
import InspirationGallery from './InspirationGallery';

const OutfitInspirationsTab: React.FC = () => {
  const { user } = useAuth();
  const [activeImportType, setActiveImportType] = useState<'pinterest' | 'upload' | null>(null);

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please sign in to access outfit inspirations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Outfit Inspirations</h2>
        <p className="text-gray-600">Import Pinterest boards or upload photos of outfits you love</p>
      </div>

      {/* Import Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeImportType === 'pinterest' ? 'ring-2 ring-fashion-500' : ''
          }`}
          onClick={() => setActiveImportType(activeImportType === 'pinterest' ? null : 'pinterest')}
        >
          <CardHeader className="text-center">
            <Link className="w-12 h-12 mx-auto mb-2 text-fashion-500" />
            <CardTitle>Import from Pinterest</CardTitle>
            <CardDescription>
              Import outfit inspiration from Pinterest boards or individual pins
            </CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeImportType === 'upload' ? 'ring-2 ring-fashion-500' : ''
          }`}
          onClick={() => setActiveImportType(activeImportType === 'upload' ? null : 'upload')}
        >
          <CardHeader className="text-center">
            <Upload className="w-12 h-12 mx-auto mb-2 text-fashion-500" />
            <CardTitle>Upload Photo</CardTitle>
            <CardDescription>
              Upload photos of outfits from influencers, editorials, or lookbooks
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Import Forms */}
      {activeImportType === 'pinterest' && (
        <Card>
          <CardHeader>
            <CardTitle>Import from Pinterest</CardTitle>
            <CardDescription>
              Enter a Pinterest board URL or individual pin URL to import outfit inspiration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PinterestImport onImportComplete={() => setActiveImportType(null)} />
          </CardContent>
        </Card>
      )}

      {activeImportType === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Outfit Photo</CardTitle>
            <CardDescription>
              Upload a photo of an outfit you want to recreate or get inspired by
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoUpload onUploadComplete={() => setActiveImportType(null)} />
          </CardContent>
        </Card>
      )}

      {/* Inspiration Gallery */}
      <InspirationGallery />
    </div>
  );
};

export default OutfitInspirationsTab;
