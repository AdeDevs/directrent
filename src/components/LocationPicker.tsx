import React, { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  }) => void;
  initialValue?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialValue }) => {
  const [inputValue, setInputValue] = useState(initialValue || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const placesLib = useMapsLibrary('places');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const options = {
      fields: ['formatted_address', 'geometry', 'name', 'place_id'],
      componentRestrictions: { country: 'ng' } // Optional: Restrict to Nigeria for better results
    };

    autocompleteRef.current = new placesLib.Autocomplete(inputRef.current, options);

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      
      if (place && place.geometry && place.geometry.location) {
        const address = place.formatted_address || place.name || '';
        setInputValue(address);
        onLocationSelect({
          address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          placeId: place.place_id || ''
        });
      }
    });

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [placesLib, onLocationSelect]);

  // Sync with initialValue if it changes (e.g. when editing)
  useEffect(() => {
    if (initialValue !== undefined) {
      setInputValue(initialValue);
    }
  }, [initialValue]);

  return (
    <div className="relative group">
      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none group-focus-within:text-primary-500 transition-colors z-10" />
      <input
        ref={inputRef}
        type="text"
        required
        placeholder="Search property address..."
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          // If user clears input, we should update parent too
          if (!e.target.value) {
            onLocationSelect({ address: '', lat: 0, lng: 0, placeId: '' });
          }
        }}
        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
      />
      {!placesLib && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}
      
      {/* Global styles for the Google Autocomplete dropdown to match our theme */}
      <style>{`
        .pac-container {
          border-radius: 1rem;
          margin-top: 8px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          font-family: inherit;
          z-index: 9999;
        }
        .dark .pac-container {
          background-color: #0f172a;
          border-color: #1e293b;
          color: white;
        }
        .pac-item {
          padding: 12px 16px;
          border-top: 1px solid #f1f5f9;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dark .pac-item {
          border-color: #1e293b;
          color: #94a3b8;
        }
        .pac-item:first-child {
          border-top: none;
        }
        .pac-item:hover {
          background-color: #f8fafc;
        }
        .dark .pac-item:hover {
          background-color: #1e293b;
        }
        .pac-item-query {
          font-size: 14px;
          color: #0f172a;
          font-weight: 600;
        }
        .dark .pac-item-query {
          color: white;
        }
        .pac-matched {
          color: #4f46e5;
        }
        .pac-icon {
          display: none;
        }
      `}</style>
    </div>
  );
};
