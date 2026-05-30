import React, { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, AlertCircle, Sparkles, Check } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue || '');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<any | null>(null);

  const [manualMode, setManualMode] = useState(() => {
    const saved = localStorage.getItem('directrent_location_manual_mode');
    return saved !== null ? saved === 'true' : true;
  });

  // Keep callback reference updated to prevent stale enclosure closures
  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    if (initialValue !== undefined) {
      setInputValue(initialValue);
    }
  }, [initialValue]);

  // Query Places API (traditional) using AutocompleteService with a debounced handle 
  useEffect(() => {
    if (!placesLib || !inputValue || inputValue.length < 3 || manualMode) {
      setPredictions([]);
      return;
    }

    setLoading(true);

    const debounceTimer = setTimeout(() => {
      try {
        const mapsNamespace = (window as any).google?.maps;
        if (!mapsNamespace?.places) {
          setLoading(false);
          return;
        }

        const autocompleteService = new mapsNamespace.places.AutocompleteService();
        autocompleteService.getPlacePredictions(
          {
            input: inputValue,
            componentRestrictions: { country: 'ng' } // Matches primary deployment context
          },
          (results: any[], status: any) => {
            setLoading(false);
            const ServiceStatus = mapsNamespace.places.PlacesServiceStatus;

            if (status === ServiceStatus.OK && results) {
              setPredictions(results);
              setApiError(null);
            } else if (status === ServiceStatus.REQUEST_DENIED) {
              console.warn("GCP Permission Error: Google Maps Autocomplete service request was denied.");
              setApiError("caller_permissions");
              setPredictions([]);
            } else {
              setPredictions([]);
            }
          }
        );
      } catch (err) {
        console.error("Failed to fetch autocomplete predictions:", err);
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [inputValue, placesLib, manualMode]);

  const cleanAddressString = (rawAddress: string, fallback: string): string => {
    if (!rawAddress) return fallback;
    
    // If the string is purely numeric or only represents a code, fallback to description text
    const cleanNumOnly = rawAddress.trim().replace(/[\s,\-]+/g, '');
    if (/^\d+$/.test(cleanNumOnly)) {
      return fallback;
    }

    // Strip 5 to 7 digit Nigerian postal/zip codes (e.g. 200262, 2021100)
    let cleaned = rawAddress;
    cleaned = cleaned.replace(/\b\d{5,7}\b/g, '');
    
    // Scrub empty duplicates/commas/spaces
    cleaned = cleaned
      .replace(/,\s*,/g, ',')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();
      
    // Strip leading or trailing commas
    cleaned = cleaned.replace(/^,|,$/g, '').trim();

    return cleaned || fallback;
  };

  const handlePredictionSelect = (prediction: any) => {
    const address = prediction.description;
    setInputValue(address);
    setSelectedPrediction(prediction);
    setPredictions([]);
    setIsFocused(false);

    // Resolve detailed coordinates and full formatted address via PlacesService
    try {
      const mapsNamespace = (window as any).google?.maps;
      if (mapsNamespace?.places) {
        const dummyNode = document.createElement('div');
        const placesService = new mapsNamespace.places.PlacesService(dummyNode);
        
        setLoading(true);
        placesService.getDetails(
          {
            placeId: prediction.place_id,
            fields: ['formatted_address', 'geometry', 'name']
          },
          (place: any, status: any) => {
            setLoading(false);
            const ServiceStatus = mapsNamespace.places.PlacesServiceStatus;
            
            if (status === ServiceStatus.OK && place) {
              const rawAddress = place.formatted_address || place.name || address;
              const fullAddress = cleanAddressString(rawAddress, address);
              const lat = place.geometry?.location?.lat() || 0;
              const lng = place.geometry?.location?.lng() || 0;
              
              setInputValue(fullAddress);
              onLocationSelectRef.current({
                address: fullAddress,
                lat,
                lng,
                placeId: prediction.place_id
              });
            } else {
              // Fallback to basic prediction details if full resolution fails
              const cleanedAddress = cleanAddressString(address, address);
              onLocationSelectRef.current({
                address: cleanedAddress,
                lat: 0,
                lng: 0,
                placeId: prediction.place_id
              });
            }
          }
        );
      } else {
        const cleanedAddress = cleanAddressString(address, address);
        onLocationSelectRef.current({
          address: cleanedAddress,
          lat: 0,
          lng: 0,
          placeId: prediction.place_id
        });
      }
    } catch (err) {
      console.error("Places service details query failed, falling back to basic address:", err);
      setLoading(false);
      const cleanedAddress = cleanAddressString(address, address);
      onLocationSelectRef.current({
        address: cleanedAddress,
        lat: 0,
        lng: 0,
        placeId: prediction.place_id
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    // In manual or fallback mode, keep propagating selections upwards instantly
    if (manualMode || !placesLib) {
      onLocationSelectRef.current({
        address: val,
        lat: 0,
        lng: 0,
        placeId: ''
      });
    }
  };

  return (
    <div className="relative group space-y-2 select-none" ref={containerRef}>
      <div className="relative">
        <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors z-10 ${isFocused ? 'text-primary-600' : 'text-slate-400'}`} />
        
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Allow click to execute before closing
          placeholder={manualMode ? "Type property address manually..." : "Search property address..."}
          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400"
        />

        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <div className="w-4 h-4 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Modern custom suggestions dropdown */}
      {isFocused && !manualMode && predictions.length > 0 && (
        <div className="absolute z-50 w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden mt-1 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
          {predictions.map((p) => (
            <div
              key={p.place_id}
              onMouseDown={() => handlePredictionSelect(p)}
              className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
            >
              <MapPin className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {p.structured_formatting?.main_text || p.description}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {p.structured_formatting?.secondary_text || ''}
                </p>
              </div>
              {selectedPrediction?.place_id === p.place_id && (
                <Check className="w-3.5 h-3.5 text-primary-600 shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Control Switch Mode Button */}
      <div className="flex items-center justify-between text-xs px-1 pt-0.5">
        {manualMode ? (
          <button
            type="button"
            onClick={() => {
              setManualMode(false);
              localStorage.setItem('directrent_location_manual_mode', 'false');
            }}
            className="text-primary-600 dark:text-primary-400 font-black hover:underline cursor-pointer flex items-center gap-1.5 uppercase tracking-wider text-[10px]"
          >
            🔍 Enable Map Auto-Suggestions
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setManualMode(true);
              localStorage.setItem('directrent_location_manual_mode', 'true');
            }}
            className="text-amber-600 dark:text-amber-500 font-black hover:underline cursor-pointer flex items-center gap-1.5 uppercase tracking-wider text-[10px]"
          >
            ✏️ Switch to Manual Typing
          </button>
        )}
      </div>

      {/* Informative Guidance Info Cards */}
      {manualMode ? (
        <div className="text-[10px] text-amber-600 dark:text-amber-500 flex items-start gap-2.5 font-semibold bg-amber-500/5 p-3.5 rounded-2xl border border-amber-250/30 dark:border-amber-950/40 leading-normal">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
          <div className="space-y-1">
            <span className="font-bold">Manual Typing Mode is Active</span>
            <p className="text-[9px] font-normal text-slate-600 dark:text-slate-400 leading-tight">
              ⚠️ <strong>Cons:</strong> If you type the address manually, we might not be able to provide potential renters with appropriate "Get Directions" navigation or accurate map routes on your listing page.
            </p>
            <p className="text-[9px] font-normal text-slate-600 dark:text-slate-400 leading-tight">
              💡 <strong>Pros of Auto-Suggestions:</strong> Searching and selecting from the map automatically activates interactive street pins, precise routing directions, and premium neighborhood landmark generation!
            </p>
          </div>
        </div>
      ) : apiError === "caller_permissions" ? (
        <div className="text-[10px] text-amber-600 dark:text-amber-500 flex items-start gap-2 font-semibold bg-amber-500/5 p-3.5 rounded-2xl border border-amber-250/30 dark:border-amber-950/40 leading-normal">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
          <div className="space-y-1">
            <span className="font-bold">Auto-Suggestion Service Paused</span>
            <p className="text-[9px] font-normal text-slate-600 dark:text-slate-400 leading-tight">
              Our automated address verification system could not be reached. Feel free to use <strong>Manual Typing Mode</strong> instead to type your full property street address text directly. Note that manual addresses might skip some interactive direction features.
            </p>
          </div>
        </div>
      ) : (
        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-start gap-2 font-semibold bg-indigo-500/5 p-3 rounded-2xl border border-slate-205 dark:border-slate-800 leading-normal">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-indigo-500" />
          <span>
            <strong>Agent Pro-Tip:</strong> Try searching for the property address first! Auto-suggested listings automatically activate interactive maps and precise "Get Directions" navigation templates for premium visibility.
          </span>
        </div>
      )}
    </div>
  );
};
