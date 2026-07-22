import React, { useState, useMemo, useEffect, useRef } from 'react';
import HamburgerButton from '../components/HamburgerButton';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Settings2, MapPin, FilterX, Home as HomeIcon, Trash2, Bell, Map, LayoutGrid, Navigation, Info, Compass, RotateCcw, Building2, Layers, Globe, Heart, MoreHorizontal, ChevronLeft, ChevronRight, Bookmark, Locate, Car, Bus, Plus, Minus } from 'lucide-react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef, useMap } from '@vis.gl/react-google-maps';
import ListingCard from '../components/ListingCard';
import SafeImage from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, doc, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { purgeListingData } from '../utils/adminCleanup';
import { Listing, Notification } from '../types';
import NotificationBadge from '../components/NotificationBadge';
import { GoogleMapsGuard } from '../components/GoogleMapsGuard';
import { HeaderPortal } from '../components/HeaderPortal';
import toast from 'react-hot-toast';

// Standard Google Maps style - light mode uses native full-featured Google Maps vector styling
const LIGHT_MAP_STYLE = undefined;

// Official Google Maps Dark theme - rich feature depth, parks, rivers, roads, labels
const DARK_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#263c3f" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#6b9a76" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#38414e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#212a37" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9ca5b3" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#746855" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#1f2835" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#f3d19c" }]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [{ "color": "#2f3948" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#17263c" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#515c6d" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#17263c" }]
  }
];

const getMarkerIcon = (type: string) => {
  const norm = type?.toLowerCase() || '';
  if (norm.includes('contain') || norm.includes('self')) {
    return <Building2 className="w-3.5 h-3.5" />;
  } else if (norm.includes('shared')) {
    return <Layers className="w-3.5 h-3.5" />;
  } else {
    return <HomeIcon className="w-3.5 h-3.5" />;
  }
};

const MapMarkerWithInfoWindow: React.FC<{ 
  listing: Listing; 
  onClick: (l: Listing) => void;
  isHovered?: boolean;
  activeInfoWindowId?: string | number | null;
  setActiveInfoWindowId?: (id: string | number | null) => void;
  onHover?: (id: string | number | null) => void;
}> = React.memo(({ listing, onClick, isHovered, activeInfoWindowId, setActiveInfoWindowId, onHover }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { favorites, toggleFavorite } = useAuth();
  
  if (!listing.latitude || !listing.longitude) return null;

  const infoWindowShown = activeInfoWindowId === listing.id;
  const active = isHovered || infoWindowShown;
  const images = listing.images?.length ? listing.images : [listing.image];
  const isFav = favorites.includes(listing.id);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: listing.latitude, lng: listing.longitude }}
        onClick={() => {
          setActiveInfoWindowId?.(listing.id);
        }}
      >
        <div 
          onMouseEnter={() => onHover?.(listing.id)}
          onMouseLeave={() => onHover?.(null)}
          className={`group cursor-pointer flex flex-col items-center transition-all duration-300 ${active ? 'z-50 scale-110' : 'z-10'}`}
        >
          {/* Property Price Pill */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-black shadow-xl flex items-center justify-center transition-all duration-300 border-2 ${
            active 
              ? 'bg-primary-600 text-white scale-110 shadow-primary-500/50 border-white dark:border-slate-900 ring-4 ring-primary-500/30' 
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-primary-600 hover:text-white hover:border-white dark:hover:border-slate-900'
          }`}>
            <span>₦{listing.priceValue >= 1000000 ? `${(listing.priceValue / 1000000).toFixed(1)}M` : `${(listing.priceValue / 1000).toFixed(0)}k`}</span>
          </div>
        </div>
      </AdvancedMarker>

      {infoWindowShown && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setActiveInfoWindowId?.(null)}
          headerDisabled={true}
          style={{ padding: 0 }}
        >
          <div 
            className="w-[280px] cursor-pointer group/card bg-white dark:bg-slate-900 overflow-hidden relative"
            onClick={() => onClick(listing)}
          >
            <div className="relative overflow-hidden h-40">
              <SafeImage src={images[currentImageIndex]} fallbackType="house" className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" />
              
              {images.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-white/95 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-full backdrop-blur-md opacity-0 group-hover/card:opacity-100 shadow-md transition-all hover:bg-white dark:hover:bg-slate-900 hover:scale-105 z-10"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-white/95 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-full backdrop-blur-md opacity-0 group-hover/card:opacity-100 shadow-md transition-all hover:bg-white dark:hover:bg-slate-900 hover:scale-105 z-10"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              <div className="absolute top-2.5 right-2.5 z-20">
                <button 
                  className={`p-1.5 rounded-full backdrop-blur-xl shadow-md transition-all cursor-pointer active:scale-95 ${isFav ? 'bg-primary-600 text-white border border-primary-500' : 'bg-white/70 hover:bg-white dark:hover:bg-slate-800 text-slate-800 border border-white/20'}`}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    toggleFavorite(listing.id, listing.agent?.id);
                  }}
                >
                  <Bookmark className={`w-4 h-4 transition-colors ${isFav ? 'fill-current text-white' : 'text-slate-850 dark:text-slate-200'}`} />
                </button>
              </div>

              {images.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10" onClick={e => e.stopPropagation()}>
                  {images.map((_, i) => (
                    <div 
                      key={`dot-${i}`} 
                      onClick={() => setCurrentImageIndex(i)}
                      className={`h-1.5 rounded-full cursor-pointer transition-all ${i === currentImageIndex ? 'w-3 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
              {/* Line 1: Price and Period Label */}
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">
                  {listing.initialPayment ? '1st Pay / Deposit' : (
                    listing.paymentPeriod === 'monthly' ? 'Monthly Rent' :
                    listing.paymentPeriod === 'quarterly' ? 'Quarterly Rent' :
                    listing.paymentPeriod === 'bi-annually' ? 'Semi-Annual Rent' :
                    listing.paymentPeriod === 'custom' ? 'Custom Lease' : 'Annual Rent'
                  )}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-900 dark:text-white font-sans font-black text-sm sm:text-base leading-none tracking-tight">
                    {listing.initialPayment || listing.price}
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-0.5 uppercase">
                      /{listing.paymentPeriod === 'monthly' ? 'mo' :
                        listing.paymentPeriod === 'quarterly' ? 'qt' :
                        listing.paymentPeriod === 'bi-annually' ? '6mo' :
                        listing.paymentPeriod === 'custom' ? 'term' : 'yr'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Line 2: Name / Title */}
              <h3 className="text-slate-900 dark:text-white text-xs sm:text-sm font-display font-extrabold leading-snug tracking-tight line-clamp-1">
                {listing.title}
              </h3>

              {/* Line 3: Location */}
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wide uppercase truncate">
                  {listing.location}
                </span>
              </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
});

const MapSearchBoundary: React.FC<{ listings: Listing[]; searchQuery: string }> = ({ listings, searchQuery }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !searchQuery || listings.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    let hasValidPoints = false;
    listings.forEach(l => {
      if (l.latitude && l.longitude) {
        bounds.extend({ lat: l.latitude, lng: l.longitude });
        hasValidPoints = true;
      }
    });

    if (!hasValidPoints) return;

    const center = bounds.getCenter();
    const ne = bounds.getNorthEast();
    const R = 6371e3; // metres
    const φ1 = center.lat() * Math.PI/180;
    const φ2 = ne.lat() * Math.PI/180;
    const Δφ = (ne.lat()-center.lat()) * Math.PI/180;
    const Δλ = (ne.lng()-center.lng()) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    const circle = new google.maps.Circle({
      map,
      center,
      radius: Math.max(distance * 1.2, 1000), // add 20% padding, minimum 1km
      strokeColor: '#3b82f6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
    });

    // Optionally fit bounds
    // map.fitBounds(bounds);

    return () => {
      circle.setMap(null);
    };
  }, [map, listings, searchQuery]);

  return null;
};

// Custom interactive dashboard overlays for rotation, elevation tilt (3D), and zooming controls
const MapLayersController: React.FC<{
  showTraffic: boolean;
  showTransit: boolean;
}> = ({ showTraffic, showTransit }) => {
  const map = useMap();
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const transitLayerRef = useRef<google.maps.TransitLayer | null>(null);

  useEffect(() => {
    if (!map) return;
    if (showTraffic) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new google.maps.TrafficLayer();
      }
      trafficLayerRef.current.setMap(map);
    } else {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    }
  }, [map, showTraffic]);

  useEffect(() => {
    if (!map) return;
    if (showTransit) {
      if (!transitLayerRef.current) {
        transitLayerRef.current = new google.maps.TransitLayer();
      }
      transitLayerRef.current.setMap(map);
    } else {
      if (transitLayerRef.current) {
        transitLayerRef.current.setMap(null);
      }
    }
  }, [map, showTransit]);

  return null;
};

const UserLocationMarker: React.FC<{ userPos: { lat: number; lng: number } | null }> = ({ userPos }) => {
  if (!userPos) return null;

  return (
    <AdvancedMarker position={userPos}>
      <div className="relative flex items-center justify-center z-50">
        <div className="w-8 h-8 bg-blue-500/30 rounded-full animate-ping absolute" />
        <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      </div>
    </AdvancedMarker>
  );
};

const MapControlsOverlay: React.FC<{
  onRecenter?: () => void;
  isMapExpanded?: boolean;
  onToggleExpand?: () => void;
  mapType: string;
  setMapType: (type: string) => void;
  showTraffic: boolean;
  setShowTraffic: React.Dispatch<React.SetStateAction<boolean>>;
  showTransit: boolean;
  setShowTransit: React.Dispatch<React.SetStateAction<boolean>>;
  userPos: { lat: number; lng: number } | null;
  setUserPos: (pos: { lat: number; lng: number } | null) => void;
}> = ({
  onRecenter,
  isMapExpanded,
  onToggleExpand,
  mapType,
  setMapType,
  showTraffic,
  setShowTraffic,
  showTransit,
  setShowTransit,
  userPos,
  setUserPos,
}) => {
  const map = useMap();
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [is3D, setIs3D] = useState(false);

  useEffect(() => {
    if (!map) return;
    
    const listener = map.addListener('idle', () => {
      const type = map.getMapTypeId() || 'roadmap';
      setMapType(type);
    });

    return () => {
      if (listener) listener.remove();
    };
  }, [map, setMapType]);

  const handleMapTypeChange = (type: string) => {
    if (!map) return;
    map.setMapTypeId(type);
    setMapType(type);
  };

  const handleZoom = (amount: number) => {
    if (!map) return;
    const zoom = map.getZoom() || 12;
    map.setZoom(zoom + amount);
  };

  const handleToggle3D = () => {
    if (!map) return;
    const next3D = !is3D;
    setIs3D(next3D);
    map.setTilt(next3D ? 45 : 0);
    if (next3D && (map.getZoom() || 0) < 15) {
      map.setZoom(16);
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation || !map) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserPos(pos);
        map.panTo(pos);
        map.setZoom(15);
        setIsLocating(false);
        toast.success('Centered on your current location');
      },
      () => {
        setIsLocating(false);
        toast.error('Unable to retrieve your location');
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  return (
    <>
      {/* Google Maps Style Bottom-Left Layers Button & Flyout Panel */}
      <div className="absolute bottom-4 left-4 z-30 pointer-events-auto">
        <div className="relative">
          {/* Flyout Menu */}
          <AnimatePresence>
            {showLayersMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-14 left-0 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl p-3.5 shadow-2xl border border-slate-200/90 dark:border-slate-800/90 space-y-3 z-40 text-slate-900 dark:text-white"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Map Type</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'roadmap', label: 'Default / Street', icon: Map },
                      { id: 'satellite', label: 'Satellite', icon: Globe },
                      { id: 'terrain', label: 'Terrain', icon: Layers },
                      { id: 'hybrid', label: 'Hybrid', icon: Building2 },
                    ].map((type) => {
                      const IconComponent = type.icon;
                      const active = mapType === type.id;
                      return (
                        <button
                          key={type.id}
                          onClick={() => handleMapTypeChange(type.id)}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">Map Details</span>
                  <div className="space-y-1">
                    <button
                      onClick={() => setShowTraffic(!showTraffic)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        showTraffic
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Car className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Real-Time Traffic</span>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-black ${showTraffic ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                        {showTraffic ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <button
                      onClick={() => setShowTransit(!showTransit)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        showTransit
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Bus className="w-3.5 h-3.5 text-blue-500" />
                        <span>Public Transit</span>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-black ${showTransit ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                        {showTransit ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <button
                      onClick={handleToggle3D}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        is3D
                          ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>3D Buildings & Tilt</span>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-black ${is3D ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                        {is3D ? '45°' : '2D'}
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trigger Button */}
          <button
            onClick={() => setShowLayersMenu(!showLayersMenu)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-xl backdrop-blur-md border transition-all cursor-pointer font-extrabold text-xs ${
              showLayersMenu
                ? 'bg-primary-600 text-white border-primary-500 shadow-primary-500/20'
                : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-primary-500" />
            <span>Map Details</span>
          </button>
        </div>
      </div>

      {/* Floating Tool Controls Stack on Right Side */}
      <div className="absolute right-4 bottom-20 sm:bottom-4 z-30 pointer-events-auto flex flex-col gap-2">
        {/* Zoom Controls */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 items-center transition-all duration-300">
          <button 
            onClick={() => handleZoom(1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-5 h-px bg-slate-200 dark:bg-slate-800" />
          <button 
            onClick={() => handleZoom(-1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* My Location GPS Button */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 items-center transition-all duration-300">
          <button
            onClick={handleMyLocation}
            disabled={isLocating}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              userPos ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Center on My Location"
          >
            <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-primary-500' : ''}`} />
          </button>
        </div>

        {/* 3D Tilt Toggle */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 items-center transition-all duration-300">
          <button
            onClick={handleToggle3D}
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-colors cursor-pointer ${
              is3D ? 'bg-primary-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle 3D View"
          >
            3D
          </button>
        </div>

        {/* Recenter All Spaces Button */}
        {onRecenter && (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 items-center transition-all duration-300">
            <button
              onClick={onRecenter}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fit All Spaces"
            >
              <Compass className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// Auto-centers and zooms the map comfortably on the active listings so users aren't left in the Lagoon
const MapCenteringController: React.FC<{ listings: Listing[] }> = React.memo(({ listings }) => {
  const map = useMap();

  const listingsHash = listings.map(l => l.id).join(',');
  useEffect(() => {
    if (!map || listings.length === 0) return;

    // Find first listing with valid lat/lng coordinates
    const firstWithCoords = listings.find(l => 
      typeof l.latitude === 'number' && typeof l.longitude === 'number' && l.latitude !== 0 && l.longitude !== 0
    );

    if (firstWithCoords && firstWithCoords.latitude && firstWithCoords.longitude) {
      map.panTo({ lat: firstWithCoords.latitude, lng: firstWithCoords.longitude });
      if ((map.getZoom() || 0) < 13) {
        map.setZoom(14.5);
      }
    }
  }, [map, listingsHash]);

  return null;
});


const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [maxBudget, setMaxBudget] = useState(1000000000); // Set to max initially
  const [isPriceEditable, setIsPriceEditable] = useState(false);
  const [priceInputVal, setPriceInputVal] = useState("1000000000");
  const [showFilters, setShowFilters] = useState(false);
  const [dbListings, setDbListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [isMapView, setIsMapView] = useState(false);
  const [hoveredListingId, setHoveredListingId] = useState<string | number | null>(null);
  const [activeInfoWindowId, setActiveInfoWindowId] = useState<string | number | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const [showTraffic, setShowTraffic] = useState(false);
  const [showTransit, setShowTransit] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const { user, setCurrentListing, setActiveTab } = useAuth();
  const [logoFailed, setLogoFailed] = useState(false);
  const [itemsLoaded, setItemsLoaded] = useState(12);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  // Auto-seeder removed due to permissions issues and static merge

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setItemsLoaded(12); // Reset when filters change
  }, [searchQuery, activeFilter, maxBudget]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setItemsLoaded(prev => prev + 12);
      }
    }, { rootMargin: '200px' });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const listingsRef = collection(db, 'listings');
    const q = query(listingsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id as any
      } as Listing)).sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setDbListings(fetched);
      setIsLoadingListings(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'listings');
      setIsLoadingListings(false);
    });

    return () => unsubscribe();
  }, []);

  const isAgent = user?.role === 'agent';

  const filters = ['All', 'Self-Contain', '1 Bedroom Flat', 'Shared'];

  const filteredListings = useMemo(() => {
    let baseListings = dbListings.filter(l => l.status !== 'suspended' && l.status !== 'completed');
    
    // Filter based on user role and approval status
    if (isAgent && user) {
      // Agents ONLY see their OWN approved listings on Home
      baseListings = baseListings.filter(l => 
        l.agent?.id && String(l.agent.id) === String(user.id) && (l.isApproved === true || l.isApproved === undefined)
      );
    } else {
      // Tenants see approved DB listings
      // Using a more robust check for isApproved
      baseListings = baseListings.filter(l => {
        const approved = l.isApproved === true || String(l.isApproved) === 'true' || l.isApproved === undefined;
        return approved;
      });
    }

    return baseListings.filter(listing => {
      const queryStr = searchQuery.toLowerCase().trim();
      const matchesSearch = listing.title.toLowerCase().includes(queryStr) || 
                            listing.location.toLowerCase().includes(queryStr) ||
                            (listing.price && listing.price.toLowerCase().includes(queryStr)) ||
                            (listing.area && listing.area.toLowerCase().includes(queryStr)) ||
                            (listing.landmark && listing.landmark.toLowerCase().includes(queryStr)) ||
                            (listing.agent?.name && listing.agent.name.toLowerCase().includes(queryStr)) ||
                            (listing.amenities || []).some(a => a.toLowerCase().includes(queryStr));
      const matchesFilter = activeFilter === 'All' || listing.type === activeFilter;
      const matchesBudget = listing.priceValue <= maxBudget;
      return matchesSearch && matchesFilter && matchesBudget;
    });
  }, [searchQuery, activeFilter, maxBudget, isAgent, user?.id, dbListings]);

  const visibleListings = useMemo(() => filteredListings.slice(0, itemsLoaded), [filteredListings, itemsLoaded]);

  const clearFilters = React.useCallback(() => {
    setSearchQuery('');
    setActiveFilter('All');
    setMaxBudget(1000000000);
  }, []);

  const handleDelete = React.useCallback(async (listingId: string | number) => {
    const idStr = String(listingId);
    try {
      await purgeListingData(idStr);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `listings/${idStr}`);
    }
  }, []);

  const [isSavingSearch, setIsSavingSearch] = useState(false);

  const handleSaveSearch = React.useCallback(async () => {
    if (!user) return;
    setIsSavingSearch(true);
    try {
      await addDoc(collection(db, 'saved_searches'), {
        userId: user.id,
        query: searchQuery,
        type: activeFilter,
        maxPrice: maxBudget,
        createdAt: serverTimestamp()
      });
      // Trigger a local notification or toast
      toast.success('Search alert saved! We will notify you when matching properties are posted.');
    } catch (error) {
      toast.error('Failed to save search alert. Please try again.');
      handleFirestoreError(error, OperationType.WRITE, 'saved_searches');
    } finally {
      setIsSavingSearch(false);
    }
  }, [user, searchQuery, activeFilter, maxBudget]);

  const showSaveSearch = !isAgent && (searchQuery || activeFilter !== 'All' || maxBudget < 1000000000);

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* 1st part: mobile sticky header */}
      <header className={`sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 lg:hidden px-4 h-16 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <HamburgerButton />
          {!logoFailed ? (
            <img 
              src={isDark ? '/logo-dark.png' : '/logo-light.png'} 
              onError={() => setLogoFailed(true)}
              className="h-9 w-auto object-contain max-w-[120px]"
              alt="DirectRent"
              referrerPolicy="no-referrer"
            />
          ) : (
            <>
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <HomeIcon className="text-white w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="text-sm sm:text-base font-display font-bold text-slate-900 dark:text-white tracking-tight">Direct<span className="text-primary-600">Rent</span></span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isAgent && (
            <button 
              onClick={() => setIsMapView(!isMapView)}
              className={`p-2 rounded-full transition-all flex items-center justify-center ${isMapView ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
              title={isMapView ? "Switch to Grid View" : "Switch to Map View"}
            >
              {isMapView ? <LayoutGrid className="w-5 h-5" /> : <Map className="w-5 h-5" />}
            </button>
          )}
          <button 
            onClick={() => setActiveTab('notifications')}
            className="p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors group"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-primary-600 transition-colors" />
            <NotificationBadge />
          </button>
        </div>
      </header>

      {/* 2nd part: desktop portaled header */}
      <HeaderPortal>
        <div className="hidden lg:flex flex-1 items-center justify-between px-6 h-full">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 leading-none">Find Your Space</span>
            <h1 className="text-lg font-display font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              Explore Houses
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {!isAgent && (
              <button 
                onClick={() => setIsMapView(!isMapView)}
                className={`p-2 rounded-full transition-all flex items-center justify-center ${isMapView ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                title={isMapView ? "Switch to Grid View" : "Switch to Map View"}
              >
                {isMapView ? <LayoutGrid className="w-5 h-5" /> : <Map className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </HeaderPortal>

      <main className="px-[14px] pb-[15px] mb-0" style={{ paddingTop: '15px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -10 }} 
          className="w-full space-y-4 sm:space-y-6"
        >
          {/* Search and Advanced Filter Section */}
          <div className="space-y-4 sm:space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-400 group-focus-within:text-primary-500 transition-all" />
          <input 
            type="text" 
            placeholder={isAgent ? "Search by area, landmark, or price..." : "Search by area, landmark, price, or agent name..."} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-10 sm:pl-12 pr-4 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-xs sm:text-sm shadow-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 dark:text-white"
          />
          <button 
            onClick={() => {
              setShowFilters(!showFilters);
              if (!showFilters && window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(10);
              }
            }}
            className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg sm:rounded-2xl transition-all cursor-pointer ${showFilters ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-black/20 space-y-4 sm:space-y-6 overflow-hidden transition-all duration-350"
            >
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Property Type</label>
                  {(searchQuery || activeFilter !== 'All' || maxBudget < 1000000000) && (
                    <button onClick={clearFilters} className="text-[9px] sm:text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1 hover:text-rose-600 transition-colors cursor-pointer">
                      <FilterX className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {filters.map(filter => (
                    <button 
                      key={`filter-${filter}`}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-2xl text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${activeFilter === filter ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-555'}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Price</label>
                  <div className="text-xs sm:text-sm font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                    <span className="text-[9px] opacity-60">UP TO</span>
                    {isPriceEditable ? (
                      <div className="flex items-center gap-1 border-b border-primary-500">
                        <span className="text-xs">₦</span>
                        <input
                          type="number"
                          className="w-24 bg-transparent outline-none text-xs text-primary-605 dark:text-primary-400 font-extrabold focus:ring-0 p-0 border-none"
                          value={priceInputVal}
                          onChange={(e) => setPriceInputVal(e.target.value)}
                          onBlur={() => {
                            setIsPriceEditable(false);
                            const parsed = parseInt(priceInputVal);
                            if (!isNaN(parsed) && parsed >= 0) {
                              setMaxBudget(Math.min(parsed, 1000000000));
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setIsPriceEditable(false);
                              const parsed = parseInt(priceInputVal);
                              if (!isNaN(parsed) && parsed >= 0) {
                                setMaxBudget(Math.min(parsed, 1000000000));
                              }
                            }
                          }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <span 
                        onClick={() => {
                          setPriceInputVal(maxBudget.toString());
                          setIsPriceEditable(true);
                        }}
                        className="cursor-pointer hover:underline underline-offset-2 flex items-center gap-0.5"
                        title="Click to edit value manually"
                      >
                        ₦{maxBudget.toLocaleString()} <span className="text-[8px] font-normal opacity-50 text-slate-400 hover:text-primary-505">(edit)</span>
                      </span>
                    )}
                  </div>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1000000000" 
                  step="500000"
                  value={maxBudget}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setMaxBudget(val);
                    setPriceInputVal(val.toString());
                  }}
                  className="w-full h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-[8px] sm:text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-wider px-1">
                  <span>₦0</span>
                  <span>₦5M</span>
                  <span>₦500M</span>
                  <span>₦1B+</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between pr-0">
        <h1 className="text-base sm:text-xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
          {isAgent ? 'Your Listings' : 'Available Listings'}
        </h1>
        <div className="flex items-center gap-3">
          {showSaveSearch && (
            <button 
              onClick={handleSaveSearch}
              disabled={isSavingSearch}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary-100 dark:border-primary-800/50 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <Bell className="w-3 h-3" /> {isSavingSearch ? 'Saving...' : 'Save Alert'}
            </button>
          )}
          {filteredListings.length > 0 && (
            <button onClick={clearFilters} className="text-[9px] sm:text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline transition-all cursor-pointer">
              Show all
            </button>
          )}
        </div>
      </div>

      {/* Responsive Grid Layout / Map View */}
      <AnimatePresence mode="wait">
        {isMapView && !isAgent ? (
          <motion.div 
            key="map-view"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            className="w-full h-[calc(100vh-170px)] sm:h-[calc(100vh-180px)] flex flex-col lg:flex-row gap-4 relative overflow-hidden"
          >
            {/* Map Canvas Container */}
            <div className={`relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-2xl transition-all duration-300 flex-1 ${isMapExpanded ? 'w-full lg:w-full' : 'w-full lg:flex-1'}`}>
              
              {/* Glass Top Overlay Bar */}
              <div className="absolute top-3 left-3 right-3 z-30 pointer-events-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
                {/* Spaces Badge */}
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-2.5 rounded-full border border-slate-200/80 dark:border-slate-800/80 shadow-lg flex items-center justify-center shrink-0">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-none text-center">
                      {filteredListings.length} {filteredListings.length === 1 ? 'Space' : 'Spaces'}
                    </h4>
                    {searchQuery && (
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-1 text-center">
                        "{searchQuery}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Expand / Collapse Button */}
                <button
                  onClick={() => setIsMapExpanded(!isMapExpanded)}
                  className="hidden lg:flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-2 rounded-full border border-slate-200/80 dark:border-slate-800/80 shadow-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-primary-600" />
                  <span>{isMapExpanded ? 'Show Sidebar' : 'Full Map'}</span>
                </button>
              </div>

              {/* Google Map Instance */}
              <GoogleMapsGuard>
                <GoogleMap 
                  defaultCenter={{ lat: 6.4311, lng: 3.4158 }}
                  defaultZoom={13}
                  defaultTilt={45}
                  defaultHeading={0}
                  gestureHandling={'cooperative'}
                  disableDefaultUI={true}
                  styles={mapType === 'roadmap' ? (isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE) : undefined}
                  mapId={((import.meta as any).env?.VITE_GOOGLE_MAPS_MAP_ID as string) || ''}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  className="w-full h-full min-h-[350px]"
                  onClick={() => setActiveInfoWindowId(null)}
                >
                  <MapLayersController showTraffic={showTraffic} showTransit={showTransit} />
                  <UserLocationMarker userPos={userPos} />
                  <MapSearchBoundary listings={filteredListings} searchQuery={searchQuery} />
                  {filteredListings.map((listing) => (
                    <MapMarkerWithInfoWindow 
                      key={`map-marker-${listing.id}`} 
                      listing={listing}
                      onClick={setCurrentListing}
                      isHovered={hoveredListingId === listing.id}
                      activeInfoWindowId={activeInfoWindowId}
                      setActiveInfoWindowId={setActiveInfoWindowId}
                      onHover={setHoveredListingId}
                    />
                  ))}
                  <MapControlsOverlay 
                    onToggleExpand={() => setIsMapExpanded(!isMapExpanded)}
                    isMapExpanded={isMapExpanded}
                    mapType={mapType}
                    setMapType={setMapType}
                    showTraffic={showTraffic}
                    setShowTraffic={setShowTraffic}
                    showTransit={showTransit}
                    setShowTransit={setShowTransit}
                    userPos={userPos}
                    setUserPos={setUserPos}
                  />
                  <MapCenteringController listings={filteredListings} />
                </GoogleMap>
              </GoogleMapsGuard>

              {/* Mobile Bottom Swipeable Cards (< lg) */}
              <div className="lg:hidden absolute bottom-16 left-3 right-3 z-30 pointer-events-auto">
                <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 snap-x snap-mandatory">
                  {visibleListings.map((listing) => (
                    <div 
                      key={`mobile-map-card-${listing.id}`}
                      onClick={() => setCurrentListing(listing)}
                      className="min-w-[260px] max-w-[280px] snap-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl p-2.5 border border-slate-200 dark:border-slate-800 shadow-xl flex gap-3 cursor-pointer"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative">
                        <SafeImage src={listing.image} fallbackType="house" className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 bg-slate-900/80 backdrop-blur-xs text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">
                          {listing.type}
                        </span>
                      </div>
                      <div className="flex flex-col justify-between overflow-hidden py-0.5">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{listing.title}</h4>
                          <p className="text-[10px] text-slate-500 line-clamp-1 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-primary-500 shrink-0" />
                            {listing.location}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-primary-600 dark:text-primary-400 font-extrabold text-xs">{listing.price}</p>
                          <span className="text-[9px] font-bold text-primary-600">View →</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Listing List Sidebar */}
            {!isMapExpanded && (
              <div className="hidden lg:flex flex-col w-full lg:w-[400px] xl:w-[680px] 2xl:w-[740px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xl overflow-hidden shrink-0 transition-all duration-300">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Area Properties
                    </h3>
                    <p className="text-[10px] font-medium text-slate-400">
                      Browse available properties in view
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-[10px] font-black">
                    {visibleListings.length} Listed
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 xl:grid-cols-2 gap-3.5 scrollbar-thin">
                  {isLoadingListings ? (
                    [...Array(4)].map((_, i) => (
                      <div key={'sk-list-'+i} className="animate-pulse flex flex-col gap-3 pb-4">
                        <div className="w-full h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                        <div className="w-2/3 h-4 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                      </div>
                    ))
                  ) : visibleListings.length > 0 ? (
                    visibleListings.map((listing) => (
                      <div 
                        key={`sidebar-listing-${listing.id}`}
                        className="rounded-2xl h-full"
                      >
                        <ListingCard 
                          listing={listing} 
                          disableHover={true}
                          onViewDetails={() => setCurrentListing(listing)}
                          isAgentView={isAgent}
                          onEdit={() => {
                            setCurrentListing(listing);
                            setActiveTab('create');
                          }}
                          onDelete={() => handleDelete(listing.id)}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 px-4">
                      <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No properties match criteria</p>
                      <button 
                        onClick={clearFilters}
                        className="mt-3 text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline cursor-pointer"
                      >
                        Reset Search Filters
                      </button>
                    </div>
                  )}
                  {filteredListings.length > itemsLoaded && (
                    <div ref={sentinelRef} className="col-span-full h-0 w-0 pointer-events-none" style={{ margin: '0px' }} />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-4 sm:gap-6 lg:gap-8 min-h-[400px]">
            
            {isLoadingListings ? (
              [...Array(6)].map((_, i) => (
                <div key={'sk-grid-'+i} className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col h-[320px]">
                  <div className="w-full h-48 bg-slate-200 dark:bg-slate-800"></div>
                  <div className="p-4 flex flex-col gap-3">
                    <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                    <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                  </div>
                </div>
              ))
            ) : visibleListings.length > 0 ? (

              visibleListings.map((listing) => (
                <ListingCard 
                  key={`home-listing-${listing.id}`} 
                  listing={listing} 
                  onViewDetails={() => setCurrentListing(listing)}
                  isAgentView={isAgent}
                  onEdit={() => {
                    setCurrentListing(listing);
                    setActiveTab('create');
                  }}
                  onDelete={() => handleDelete(listing.id)}
                />
              ))
            ) : (
              <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  {isAgent ? <HomeIcon className="w-10 h-10 text-slate-200 dark:text-slate-700" /> : <Search className="w-10 h-10 text-slate-200 dark:text-slate-700" />}
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-bold">{isAgent ? "You have no listings yet" : "No matches found"}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                    {isAgent ? "Start by posting your first property to find tenants" : "Try adjusting your budget or search terms"}
                  </p>
                </div>
                <button 
                  onClick={isAgent ? () => setActiveTab('create') : clearFilters}
                  className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
                >
                  {isAgent ? "Post a Listing" : "Clear all filters"}
                </button>
              </div>
            )}
            {filteredListings.length > itemsLoaded && (
              <div ref={sentinelRef} className="col-span-full h-0 w-0 pointer-events-none" />
            )}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  </main>
</div>
  );
};

export default Home;