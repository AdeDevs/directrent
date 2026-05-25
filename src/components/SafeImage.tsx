import React, { useState } from 'react';
import { Home } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'house' | 'avatar' | 'room';
}

const SafeImage: React.FC<SafeImageProps> = React.memo(({ 
  src, 
  alt, 
  className, 
  fallbackType = 'house',
  ...props 
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleImageError = () => {
    setError(true);
    setLoading(false);
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  if (error || !src) {
    return (
      <div className={`${className} bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600`}>
        <Home className="w-8 h-8 opacity-20" />
      </div>
    );
  }

  return (
    <div className={`relative ${className} overflow-hidden bg-slate-50 dark:bg-slate-900`}>
      {loading && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
          <Home className="w-8 h-8 text-slate-200 dark:text-slate-700" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        referrerPolicy="no-referrer"
        loading="lazy"
        {...props}
      />
    </div>
  );
});

export default SafeImage;
