
import React, { useState, useEffect } from 'react';

// A placeholder image. The user should replace these with base64 encoded versions of their images.
// To convert images to base64, you can use an online tool.
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzIzMjMyMyIgLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzc3NyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2U8L3RleHQ+PC9zdmc+';

// User should replace the placeholder with their own image data URLs.
// The array should contain the base64 data for the main image and its crops.
const imageSources = [
  placeholderImage, // Replace with base64 of original image
  placeholderImage, // Replace with base64 of crop 1
  placeholderImage, // Replace with base64 of crop 2
  placeholderImage, // Replace with base64 of crop 3
  placeholderImage, // Replace with base64 of crop 4
];

interface ImageStyle {
  top: string;
  left: string;
  transform: string;
  opacity: number;
  width: string;
}

const CollageBackground: React.FC = () => {
  const [imageStyles, setImageStyles] = useState<ImageStyle[]>([]);

  useEffect(() => {
    const styles: ImageStyle[] = [];
    const imageCount = 30; // Creates a collage with 30 images
    for (let i = 0; i < imageCount; i++) {
      styles.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        transform: `rotate(${Math.random() * 90 - 45}deg) scale(${Math.random() * 0.4 + 0.2}) translate(-50%, -50%)`,
        opacity: Math.random() * 0.15 + 0.05, // Keep it subtle for the background
        width: `${Math.random() * 250 + 150}px` // Randomize size for a more natural look
      });
    }
    setImageStyles(styles);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden bg-black">
      {imageStyles.map((style, index) => (
        <img
          key={index}
          src={imageSources[index % imageSources.length]}
          alt=""
          aria-hidden="true"
          className="absolute transform-gpu"
          style={style}
        />
      ))}
    </div>
  );
};

export default CollageBackground;
