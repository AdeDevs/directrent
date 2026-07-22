import React, { Component, ReactNode } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class MapErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error) {
    console.warn('Map Error Boundary caught:', error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] h-full w-full p-6 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <MapPin className="w-10 h-10 text-primary-500 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Map temporarily unavailable
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            The interactive map could not be loaded. You can still view property locations in list view.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export const GoogleMapsGuard: React.FC<Props> = ({ children }) => {
  const apiKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string) || (process.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';

  return (
    <MapErrorBoundary>
      <APIProvider apiKey={apiKey} libraries={['places', 'routes', 'geometry']}>
        {children}
      </APIProvider>
    </MapErrorBoundary>
  );
};

export default GoogleMapsGuard;

