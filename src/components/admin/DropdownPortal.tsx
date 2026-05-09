import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

interface DropdownPortalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
  children: React.ReactNode;
  width?: number;
  openUpwards?: boolean;
}

const DropdownPortal: React.FC<DropdownPortalProps> = ({
  isOpen,
  onClose,
  anchorRect,
  children,
  width = 192, // default 48 * 4 (w-48)
  openUpwards = false
}) => {
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !anchorRect) return null;

  const top = openUpwards 
    ? anchorRect.top - 8 // space for the menu
    : anchorRect.bottom + 8;

  const left = anchorRect.right - width;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="dropdown-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998]" 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        />
      )}
      {isOpen && (
        <motion.div
          key="dropdown-menu"
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: openUpwards ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: openUpwards ? 10 : -10 }}
            style={{ 
              position: 'fixed',
              top: openUpwards ? 'auto' : top,
              bottom: openUpwards ? window.innerHeight - anchorRect.top + 8 : 'auto',
              left: left,
              width: width,
            }}
            className="z-[9999] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none shadow-2xl overflow-hidden"
          >
            {children}
          </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default DropdownPortal;
