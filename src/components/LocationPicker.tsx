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
  const containerRef = useRef<HTMLDivElement>(null);
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    if (!placesLib || !containerRef.current) return;

    // Use PlaceAutocompleteElement (Web Component)
    const autocomplete = new (placesLib as any).PlaceAutocompleteElement({
      componentRestrictions: { country: 'ng' }
    });
    
    // Clear existing to avoid duplicates on strict mode recreation
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(autocomplete);

    autocomplete.addEventListener('gmp-placeselect', (event: any) => {
      const place = event.place;
      
      if (place && place.location) {
        onLocationSelect({
          address: place.formattedAddress || place.displayName || '',
          lat: place.location.lat(),
          lng: place.location.lng(),
          placeId: place.id || ''
        });
      }
    });

  }, [placesLib, onLocationSelect]);

  return (
    <div className="relative group">
      <MapPin className="absolute left-4 top-[18px] w-4 h-4 text-slate-300 pointer-events-none group-focus-within:text-primary-500 transition-colors z-10" />
      <div 
        ref={containerRef}
        className="w-full"
      />
      
      {!placesLib && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
