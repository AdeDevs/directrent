import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Video, X } from 'lucide-react';
import SafeImage from './SafeImage';

interface FullscreenGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  video?: string;
  initialIndex?: number;
}

const FullscreenGallery: React.FC<FullscreenGalleryProps> = ({ 
  isOpen, 
  onClose, 
  images, 
  video,
  initialIndex = 0 
}) => {
  const [index, setIndex] = useState(initialIndex);

  // Sync index if initialIndex changes and modal is closed
  React.useEffect(() => {
    if (!isOpen) setIndex(initialIndex);
  }, [initialIndex, isOpen]);

  if (!isOpen) return null;

  const totalItems = images.length + (video ? 1 : 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[5000] bg-black flex flex-col items-center justify-center"
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center z-50">
            <div className="text-white/70 font-bold text-xs tracking-widest uppercase bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
              {index + 1} / {totalItems}
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xl border border-white/10 shadow-2xl active:scale-90"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Media Content */}
          <div className="w-full h-full relative group flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div 
                key={`gallery-item-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full h-full flex items-center justify-center p-4 sm:p-20"
              >
                {index < images.length ? (
                  <img 
                    src={images[index]} 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                    alt="" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full max-w-5xl aspect-video flex items-center justify-center">
                    <video 
                      src={video} 
                      className="w-full max-h-full rounded-2xl shadow-2xl border border-white/10" 
                      controls 
                      autoPlay
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows (Desktop) */}
            <div className="absolute inset-y-0 left-0 right-0 hidden sm:flex items-center justify-between px-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <button 
                onClick={() => setIndex(prev => Math.max(0, prev - 1))}
                disabled={index === 0}
                className="w-14 h-14 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all hover:scale-110 disabled:opacity-0 pointer-events-auto cursor-pointer"
              >
                <ArrowLeft className="w-8 h-8" />
              </button>
              <button 
                onClick={() => setIndex(prev => Math.min(totalItems - 1, prev + 1))}
                disabled={index === totalItems - 1}
                className="w-14 h-14 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all hover:scale-110 disabled:opacity-0 pointer-events-auto cursor-pointer"
              >
                <ArrowLeft className="w-8 h-8 rotate-180" />
              </button>
            </div>

            {/* Tap areas for mobile navigation */}
            <div className="absolute inset-y-0 left-0 w-1/4 sm:hidden z-10" onClick={() => setIndex(prev => Math.max(0, prev - 1))} />
            <div className="absolute inset-y-0 right-0 w-1/4 sm:hidden z-10" onClick={() => setIndex(prev => Math.min(totalItems - 1, prev + 1))} />
          </div>

          {/* Bottom Thumbnails Strip */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex justify-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none z-50 bg-gradient-to-t from-black/90 to-transparent">
            {images.map((img, i) => (
              <button 
                key={`gallery-thumb-${i}`}
                onClick={() => setIndex(i)}
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${index === i ? 'border-primary-500 scale-110 shadow-lg shadow-primary-500/30' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'}`}
              >
                <SafeImage src={img} className="w-full h-full object-cover" />
              </button>
            ))}
            {video && (
              <button 
                onClick={() => setIndex(images.length)}
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-slate-800 flex items-center justify-center ${index === images.length ? 'border-primary-500 scale-110' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'}`}
              >
                <Video className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullscreenGallery;
