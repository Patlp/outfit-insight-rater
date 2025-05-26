
import React from 'react';
import { useRating } from '@/context/RatingContext';
import FileUploadZone from '@/components/upload/FileUploadZone';
import ImagePreview from '@/components/upload/ImagePreview';
import AnalyzeButton from '@/components/upload/AnalyzeButton';

const UploadArea: React.FC = () => {
  const {
    imageFile,
    setImageFile,
    imageSrc,
    setImageSrc,
    resetState
  } = useRating();

  const handleFileProcessed = (file: File, src: string) => {
    setImageFile(file);
    setImageSrc(src);
  };

  const handleReset = () => {
    resetState();
  };

  if (imageSrc) {
    return (
      <ImagePreview imageSrc={imageSrc} onReset={handleReset}>
        <AnalyzeButton imageFile={imageFile} imageSrc={imageSrc} />
      </ImagePreview>
    );
  }

  return <FileUploadZone onFileProcessed={handleFileProcessed} />;
};

export default UploadArea;
