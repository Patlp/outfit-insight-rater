
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { createOutfitInspiration } from '@/services/inspirations/inspirationService';

interface InspirationImportDialogProps {
  onInspirationAdded?: () => void;
}

const InspirationImportDialog: React.FC<InspirationImportDialogProps> = ({
  onInspirationAdded
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState('pinterest');

  const handlePinterestImport = async () => {
    if (!user || !pinterestUrl.trim()) {
      toast.error('Please enter a Pinterest URL');
      return;
    }

    setIsLoading(true);
    try {
      // For now, we'll use the Pinterest URL as the image URL
      // In a real implementation, you would extract the actual image URL from Pinterest
      const result = await createOutfitInspiration(user.id, {
        source_type: 'pinterest',
        source_url: pinterestUrl,
        image_url: pinterestUrl, // This would be the extracted image URL
        title: title || 'Pinterest Inspiration',
        description
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Pinterest inspiration imported successfully!');
        resetForm();
        setOpen(false);
        onInspirationAdded?.();
      }
    } catch (error) {
      toast.error('Failed to import Pinterest inspiration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!user || !uploadedImage) {
      toast.error('Please select an image');
      return;
    }

    setIsLoading(true);
    try {
      // Create a temporary URL for the uploaded image
      const imageUrl = URL.createObjectURL(uploadedImage);
      
      const result = await createOutfitInspiration(user.id, {
        source_type: 'upload',
        image_url: imageUrl,
        title: title || 'Uploaded Inspiration',
        description,
        metadata: {
          fileName: uploadedImage.name,
          fileSize: uploadedImage.size,
          fileType: uploadedImage.type
        }
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Image uploaded successfully!');
        resetForm();
        setOpen(false);
        onInspirationAdded?.();
      }
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPinterestUrl('');
    setUploadedImage(null);
    setTitle('');
    setDescription('');
    setActiveTab('pinterest');
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={16} className="mr-2" />
          Add Inspiration
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Outfit Inspiration</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pinterest">
              <Link size={16} className="mr-2" />
              Pinterest
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload size={16} className="mr-2" />
              Upload
            </TabsTrigger>
          </TabsList>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name this inspiration"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes about this inspiration"
                className="min-h-[60px]"
              />
            </div>
            
            <TabsContent value="pinterest" className="space-y-4">
              <div>
                <Label htmlFor="pinterest-url">Pinterest URL</Label>
                <Input
                  id="pinterest-url"
                  value={pinterestUrl}
                  onChange={(e) => setPinterestUrl(e.target.value)}
                  placeholder="https://pinterest.com/pin/..."
                />
              </div>
              
              <Button 
                onClick={handlePinterestImport}
                disabled={isLoading || !pinterestUrl.trim()}
                className="w-full"
              >
                {isLoading ? 'Importing...' : 'Import from Pinterest'}
              </Button>
            </TabsContent>
            
            <TabsContent value="upload" className="space-y-4">
              <div>
                <Label htmlFor="image-upload">Upload Image</Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
                {uploadedImage && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {uploadedImage.name}
                  </p>
                )}
              </div>
              
              <Button 
                onClick={handleImageUpload}
                disabled={isLoading || !uploadedImage}
                className="w-full"
              >
                {isLoading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InspirationImportDialog;
