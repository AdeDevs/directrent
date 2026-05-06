import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'motion/react';
import { Home as HomeIcon } from 'lucide-react';

const CustomCursor: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement;
      const isInteractive = 
        target.closest('button') || 
        target.closest('a') || 
        target.closest('[role="button"]') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea') ||
        target.classList.contains('cursor-pointer') ||
        target.closest('.cursor-pointer');
      
      setIsHovering(!!isInteractive);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isVisible, mouseX, mouseY]);

  if (!isVisible) return null;

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        x: cursorX,
        y: cursorY,
        pointerEvents: 'none',
        zIndex: 9999,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      <motion.div
        animate={{
          scale: isClicked ? 0.8 : (isHovering ? 1.5 : 1),
          backgroundColor: isHovering ? 'rgba(37, 99, 235, 0.9)' : (isClicked ? 'rgba(37, 99, 235, 1)' : 'rgba(37, 99, 235, 0.2)'),
          borderColor: isHovering ? 'rgba(37, 99, 235, 1)' : 'rgba(37, 99, 235, 0.5)',
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300, mass: 0.5 }}
        className="w-10 h-10 rounded-full border-2 flex items-center justify-center backdrop-blur-[2px]"
      >
        <motion.div
          animate={{
            rotate: isHovering ? 15 : 0,
            opacity: isHovering ? 1 : 0.6,
            color: isHovering || isClicked ? '#fff' : 'rgb(37, 99, 235)',
            scale: isClicked ? 0.9 : 1,
          }}
        >
          <HomeIcon className="w-5 h-5" />
        </motion.div>
      </motion.div>
      
      {/* Click Wave */}
      <AnimatePresence>
        {isClicked && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-full border-2 border-primary-500 pointer-events-none"
          />
        )}
      </AnimatePresence>
      
      {!isHovering && !isClicked && (
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 -m-2 w-14 h-14 rounded-full border border-primary-500/20 pointer-events-none"
        />
      )}
    </motion.div>
  );
};

export default CustomCursor;
