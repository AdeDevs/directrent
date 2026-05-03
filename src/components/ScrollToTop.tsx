import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const { view } = useAuth(); // Also listen to view switches

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, view]);

  return null;
}
