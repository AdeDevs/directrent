import React, { useState, useEffect } from 'react';

/**
 * A wrapper to prevent Recharts "The width(-1) and height(-1) of chart should be greater than 0"
 * warning when rendering charts inside hidden tabs, AnimatePresence, or Flex containers
 * before the browser has computed actual dimensions.
 * It waits 2 animation frames to ensure layout is complete before mounting the chart.
 */
const DeferredChart: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let req2: number;
    const req1 = requestAnimationFrame(() => {
      req2 = requestAnimationFrame(() => {
        setReady(true);
      });
    });
    return () => {
      cancelAnimationFrame(req1);
      if (req2) cancelAnimationFrame(req2);
    };
  }, []);

  if (!ready) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex gap-1 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DeferredChart;
