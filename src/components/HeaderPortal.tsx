import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface HeaderPortalProps {
  children: React.ReactNode;
}

export const HeaderPortal: React.FC<HeaderPortalProps> = ({ children }) => {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById('desktop-header-portal');
    if (el) {
      setPortalTarget(el);
    }
    
    // Setup listener for window resize in case they resize browser
    const handleResize = () => {
      const target = document.getElementById('desktop-header-portal');
      if (window.innerWidth >= 1024 && target) {
        setPortalTarget(target);
      } else {
        setPortalTarget(null);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tell React to render children in the portal if on desktop & element is mounted
  if (portalTarget && window.innerWidth >= 1024) {
    return createPortal(children, portalTarget);
  }

  return <>{children}</>;
};

export default HeaderPortal;
