import React, { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, AlertCircle } from 'lucide-react';

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
  const [loading, setLoading] = useState(!placesLib);

  // Keep callback reference updated without triggering effects to avoid focus reset
  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    if (placesLib) {
      setLoading(false);
    }
  }, [placesLib]);

  useEffect(() => {
    if (!placesLib || !containerRef.current) return;

    const currentContainer = containerRef.current;
    let autocompleteEl = currentContainer.firstElementChild as any;
    
    const handleSelect = (event: any) => {
      const place = event.target.place;
      if (place) {
        // Safe access of fields on modernized Places API (New) Place object
        const address = place.formattedAddress || place.displayName || '';
        const lat = place.location ? place.location.lat() : 0;
        const lng = place.location ? place.location.lng() : 0;
        const placeId = place.id || '';

        onLocationSelectRef.current({
          address,
          lat,
          lng,
          placeId
        });
      }
    };

    const handleInput = (event: any) => {
      const value = event.target.value || '';
      onLocationSelectRef.current({
        address: value,
        lat: 0,
        lng: 0,
        placeId: ''
      });
    };

    if (!autocompleteEl) {
      // Modern PlaceAutocompleteElement instantiated programmatically to avoid JSX component typing issues
      autocompleteEl = new (placesLib as any).PlaceAutocompleteElement({
        includedRegionCodes: ['ng'],
        requestedLanguage: 'en'
      });
      
      autocompleteEl.placeholder = 'Search property address...';
      
      if (initialValue) {
        autocompleteEl.value = initialValue;
      }
      
      currentContainer.appendChild(autocompleteEl);
      
      autocompleteEl.addEventListener('gmp-select', handleSelect);
      autocompleteEl.addEventListener('input', handleInput);
    }

    return () => {
      if (autocompleteEl) {
        autocompleteEl.removeEventListener('gmp-select', handleSelect);
        autocompleteEl.removeEventListener('input', handleInput);
        currentContainer.innerHTML = '';
      }
    };
  }, [placesLib]);

  useEffect(() => {
    if (containerRef.current && initialValue !== undefined) {
      const autocompleteEl = containerRef.current.firstElementChild as any;
      if (autocompleteEl && autocompleteEl.value !== initialValue) {
        autocompleteEl.value = initialValue;
      }
    }
  }, [initialValue]);

  return (
    <div className="relative group space-y-2">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-primary-500 transition-colors z-10" />
        
        <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-2xl py-2 pl-12 pr-4 text-sm font-medium focus-within:ring-4 focus-within:ring-primary-500/10 focus-within:border-primary-500 outline-none transition-all dark:text-white flex items-center min-h-[56px]">
          <div ref={containerRef} className="w-full flex-1" />
        </div>
        
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <div className="w-4 h-4 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      <p className="text-[10px] text-amber-600 dark:text-amber-500 flex items-start gap-1.5 font-semibold bg-amber-500/5 p-3 rounded-2xl border border-slate-200 dark:border-white/10 leading-normal">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Note:</strong> You can type a custom address. Selecting a map suggestion ensures prospective tenants can use high-precision instant navigation.
        </span>
      </p>

      {/* Modern web component styles conforming to the beautiful application themes */}
      <style>{`
        gmp-place-autocomplete, gmp-basic-place-autocomplete {
          width: 100%;
          --gmp-places-autocomplete-background: transparent;
          --gmp-places-autocomplete-text: inherit;
          --gmp-places-autocomplete-font-family: inherit;
          --gmp-places-autocomplete-dropdown-background: white;
          --gmp-places-autocomplete-item-hover-background: #f8fafc;
        }
        .dark gmp-place-autocomplete, .dark gmp-basic-place-autocomplete {
          --gmp-places-autocomplete-dropdown-background: #0f172a;
          --gmp-places-autocomplete-item-hover-background: #1e293b;
        }
        gmp-place-autocomplete::part(input), gmp-basic-place-autocomplete::part(input) {
          background-color: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          width: 100% !important;
          padding: 8px 0 !important;
          font-family: inherit !important;
          font-size: 0.875rem !important;
          color: inherit !important;
        }
        .dark gmp-place-autocomplete::part(input), .dark gmp-basic-place-autocomplete::part(input) {
          color: white !important;
        }
      `}</style>
    </div>
  );
};
