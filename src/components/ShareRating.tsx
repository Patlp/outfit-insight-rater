
import React, { useRef } from 'react';
import { useRating } from '@/context/RatingContext';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Twitter, Share2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

const ShareRating: React.FC = () => {
  const { ratingResult, feedbackMode } = useRating();
  const shareCardRef = useRef<HTMLDivElement>(null);
  
  if (!ratingResult) return null;
  
  const { score, feedback } = ratingResult;
  
  // Get summarized feedback (first couple of sentences)
  const getSummaryText = () => {
    const sentences = feedback.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 2).join('. ') + '.';
  };
  
  // Generate image from the share card div
  const generateImage = async () => {
    if (!shareCardRef.current) return;
    
    try {
      // Show toast for processing
      toast.info('Generating shareable image...');
      
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2, // Higher resolution
        backgroundColor: null,
      });
      
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Error generating image:', err);
      toast.error('Failed to generate image');
      return null;
    }
  };
  
  // Download the generated image
  const handleDownload = async () => {
    const imageData = await generateImage();
    if (!imageData) return;
    
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `ratemyfit-${feedbackMode === 'roast' ? 'roast' : 'rating'}-${score}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Image downloaded!');
  };
  
  // Share the generated image
  const handleShare = async (platform?: string) => {
    const imageData = await generateImage();
    if (!imageData) return;
    
    // Check if native sharing is available
    if (navigator.share && navigator.canShare) {
      try {
        // Convert base64 to blob for sharing
        const blob = await fetch(imageData).then(res => res.blob());
        const file = new File([blob], 'ratemyfit.png', { type: 'image/png' });
        
        // Prepare share data
        const shareData: any = {
          title: `My outfit rated ${score}/10 on RateMyFit${feedbackMode === 'roast' ? ' (Roasted!)' : ''}`,
          text: `Check out my outfit rating on RateMyFit.app!`,
        };
        
        // Add files if they can be shared
        const fileArray = [file];
        if (navigator.canShare({ files: fileArray })) {
          shareData.files = fileArray;
        }
        
        // Use platform-specific sharing if provided, otherwise use native
        if (platform) {
          let shareUrl;
          
          switch (platform) {
            case 'twitter':
              shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.title)}`;
              window.open(shareUrl, '_blank');
              break;
            case 'facebook':
              shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://ratemyfit.app')}&quote=${encodeURIComponent(shareData.title)}`;
              window.open(shareUrl, '_blank');
              break;
            case 'instagram':
              // Instagram doesn't support direct sharing via URL
              // Just download and instruct user
              toast.info('Image ready! Open Instagram and share this image from your gallery.', {
                duration: 5000
              });
              handleDownload();
              break;
            default:
              await navigator.share(shareData);
          }
        } else {
          await navigator.share(shareData);
        }
        
        toast.success('Shared successfully!');
      } catch (err) {
        console.error('Error sharing:', err);
        toast.error('Failed to share');
      }
    } else {
      // Fallback for browsers without native sharing
      toast.info('Downloading image that you can share manually');
      handleDownload();
    }
  };
  
  return (
    <div className="mt-6 pt-6 border-t border-fashion-200">
      {/* Visible buttons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-fashion-600 text-center">
          Show off your rating
        </h3>
        
        <div className="flex flex-wrap justify-center gap-3">
          <Button 
            onClick={() => handleShare('twitter')}
            variant="outline" 
            className="flex items-center gap-2 text-gray-800"
          >
            <Twitter size={18} className="text-[#1DA1F2]" />
            <span>X / Twitter</span>
          </Button>
          
          <Button 
            onClick={() => handleShare('instagram')}
            variant="outline" 
            className="flex items-center gap-2 text-gray-800"
          >
            <Instagram size={18} className="text-[#E4405F]" />
            <span>Instagram</span>
          </Button>
          
          <Button 
            onClick={() => handleShare('facebook')}
            variant="outline" 
            className="flex items-center gap-2 text-gray-800"
          >
            <Facebook size={18} className="text-[#1877F2]" />
            <span>Facebook</span>
          </Button>
          
          <Button 
            onClick={() => handleShare()}
            variant="outline" 
            className="flex items-center gap-2 text-gray-800"
          >
            <Share2 size={18} />
            <span>Share</span>
          </Button>
          
          <Button 
            onClick={handleDownload}
            variant="outline" 
            className="flex items-center gap-2 text-gray-800"
          >
            <Download size={18} />
            <span>Download</span>
          </Button>
        </div>
      </div>
      
      {/* Hidden div that will be converted to image */}
      <div className="fixed left-[-9999px]">
        <div 
          ref={shareCardRef}
          className={`w-[1080px] h-[1920px] p-16 flex flex-col ${
            feedbackMode === 'roast' 
              ? 'bg-gradient-to-br from-orange-500 to-red-600' 
              : 'bg-gradient-to-br from-fashion-200 to-fashion-400'
          }`}
        >
          {/* Rating card content */}
          <div className="bg-white rounded-3xl shadow-xl p-12 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full text-center mb-10">
                <h1 className="text-8xl font-bold mb-6">{
                  feedbackMode === 'roast' ? 'ROASTED!' : 'MY FIT RATING'
                }</h1>
                
                <div className="mb-10 flex items-center justify-center">
                  <span className={`text-[200px] font-bold ${
                    score >= 8 ? 'text-green-500' : 
                    score >= 6 ? 'text-yellow-500' : 'text-red-500'
                  }`}>{score}</span>
                  <span className="text-[100px] font-medium text-gray-400">/10</span>
                </div>
                
                <div className="text-4xl text-gray-800 mb-12">
                  {getSummaryText()}
                </div>
              </div>
            </div>
            
            <div className="mt-auto text-center">
              <div className="text-5xl font-medium mb-6">
                {feedbackMode === 'roast' ? 'Savagely Roasted' : 'Rated'} by AI on
              </div>
              <div className="text-7xl font-bold">RateMyFit.app</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareRating;
