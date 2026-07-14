import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/Home.tsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=feb49a48"; const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"]; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
var _s = $RefreshSig$(), _s2 = $RefreshSig$(), _s3 = $RefreshSig$(), _s4 = $RefreshSig$();
import __vite__cjsImport1_react from "/node_modules/.vite/deps/react.js?v=feb49a48"; const React = __vite__cjsImport1_react.__esModule ? __vite__cjsImport1_react.default : __vite__cjsImport1_react; const useState = __vite__cjsImport1_react["useState"]; const useMemo = __vite__cjsImport1_react["useMemo"]; const useEffect = __vite__cjsImport1_react["useEffect"]; const useRef = __vite__cjsImport1_react["useRef"];
import HamburgerButton from "/src/components/HamburgerButton.tsx";
import { AnimatePresence, motion } from "/node_modules/.vite/deps/motion_react.js?v=c440f934";
import { Search, Settings2, MapPin, FilterX, Home as HomeIcon, Bell, Map, LayoutGrid, Navigation, Building2, Layers, Globe } from "/node_modules/.vite/deps/lucide-react.js?v=4221e70f";
import { Map as GoogleMap, AdvancedMarker, InfoWindow, useAdvancedMarkerRef, useMap } from "/node_modules/.vite/deps/@vis__gl_react-google-maps.js?v=f1341156";
import ListingCard from "/src/components/ListingCard.tsx";
import SafeImage from "/src/components/SafeImage.tsx";
import { useAuth } from "/src/context/AuthContext.tsx";
import { db, handleFirestoreError, OperationType } from "/src/lib/firebase.ts";
import { collection, query, onSnapshot, addDoc, serverTimestamp } from "/node_modules/.vite/deps/firebase_firestore.js?v=90980246";
import { purgeListingData } from "/src/utils/adminCleanup.ts";
import NotificationBadge from "/src/components/NotificationBadge.tsx";
import { GoogleMapsGuard } from "/src/components/GoogleMapsGuard.tsx";
import { HeaderPortal } from "/src/components/HeaderPortal.tsx";
const LIGHT_MAP_STYLE = [
  {
    "featureType": "poi",
    "elementType": "all",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "transit",
    "elementType": "all",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#e0f2fe" }]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [{ "color": "#f8fafc" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#f1f5f9" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#e2e8f0" }]
  }
];
const DARK_MAP_STYLE = [
  {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#94a3b8" }]
  },
  {
    "featureType": "all",
    "elementType": "labels.text.stroke",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#1e293b" }]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [{ "color": "#020617" }]
  },
  {
    "featureType": "poi",
    "elementType": "all",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#0f172a" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#1e293b" }]
  },
  {
    "featureType": "transit",
    "elementType": "all",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#090d16" }]
  }
];
const getMarkerIcon = (type) => {
  const norm = type?.toLowerCase() || "";
  if (norm.includes("contain") || norm.includes("self")) {
    return /* @__PURE__ */ jsxDEV(Building2, { className: "w-3.5 h-3.5" }, void 0, false, {
      fileName: "/app/applet/src/pages/Home.tsx",
      lineNumber: 114,
      columnNumber: 12
    }, this);
  } else if (norm.includes("shared")) {
    return /* @__PURE__ */ jsxDEV(Layers, { className: "w-3.5 h-3.5" }, void 0, false, {
      fileName: "/app/applet/src/pages/Home.tsx",
      lineNumber: 116,
      columnNumber: 12
    }, this);
  } else {
    return /* @__PURE__ */ jsxDEV(HomeIcon, { className: "w-3.5 h-3.5" }, void 0, false, {
      fileName: "/app/applet/src/pages/Home.tsx",
      lineNumber: 118,
      columnNumber: 12
    }, this);
  }
};
const MapMarkerWithInfoWindow = ({ listing, onClick }) => {
  _s();
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoWindowShown, setInfoWindowShown] = useState(false);
  if (!listing.latitude || !listing.longitude) return null;
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV(
      AdvancedMarker,
      {
        ref: markerRef,
        position: { lat: listing.latitude, lng: listing.longitude },
        onClick: () => setInfoWindowShown(true),
        children: /* @__PURE__ */ jsxDEV("div", { className: "group cursor-pointer flex flex-col items-center", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-xl shadow-primary-500/30 transform -translate-y-full mb-1 flex items-center gap-1.5 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-300 border-2 border-white dark:border-slate-900", children: [
            getMarkerIcon(listing.type),
            /* @__PURE__ */ jsxDEV("span", { children: [
              "₦",
              listing.priceValue >= 1e6 ? `${(listing.priceValue / 1e6).toFixed(1)}M` : `${(listing.priceValue / 1e3).toFixed(0)}k`
            ] }, void 0, true, {
              fileName: "/app/applet/src/pages/Home.tsx",
              lineNumber: 140,
              columnNumber: 13
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/pages/Home.tsx",
            lineNumber: 138,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "relative flex items-center justify-center -translate-y-2", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "absolute w-6 h-6 bg-primary-500/40 rounded-full animate-ping pointer-events-none" }, void 0, false, {
              fileName: "/app/applet/src/pages/Home.tsx",
              lineNumber: 144,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "w-3.5 h-3.5 bg-primary-600 border-2 border-white dark:border-slate-900 rounded-full shadow-lg relative z-10 group-hover:scale-125 transition-all duration-300" }, void 0, false, {
              fileName: "/app/applet/src/pages/Home.tsx",
              lineNumber: 145,
              columnNumber: 13
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/pages/Home.tsx",
            lineNumber: 143,
            columnNumber: 11
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/pages/Home.tsx",
          lineNumber: 136,
          columnNumber: 9
        }, this)
      },
      void 0,
      false,
      {
        fileName: "/app/applet/src/pages/Home.tsx",
        lineNumber: 131,
        columnNumber: 7
      },
      this
    ),
    infoWindowShown && /* @__PURE__ */ jsxDEV(
      InfoWindow,
      {
        anchor: marker,
        onCloseClick: () => setInfoWindowShown(false),
        children: /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: "p-0.5 overflow-hidden group/card max-w-[220px] cursor-pointer",
            onClick: () => onClick(listing),
            children: [
              /* @__PURE__ */ jsxDEV("div", { className: "relative overflow-hidden rounded-xl mb-3", children: [
                /* @__PURE__ */ jsxDEV(SafeImage, { src: listing.image, fallbackType: "house", className: "w-full h-28 object-cover group-hover/card:scale-110 transition-transform duration-500" }, void 0, false, {
                  fileName: "/app/applet/src/pages/Home.tsx",
                  lineNumber: 160,
                  columnNumber: 15
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "absolute top-2 left-2", children: /* @__PURE__ */ jsxDEV("span", { className: "bg-white/90 backdrop-blur-md dark:bg-slate-900/90 px-2 py-0.5 rounded-lg text-[9px] font-black text-primary-600 uppercase tracking-tighter border border-slate-200 dark:border-slate-800", children: listing.type }, void 0, false, {
                  fileName: "/app/applet/src/pages/Home.tsx",
                  lineNumber: 162,
                  columnNumber: 17
                }, this) }, void 0, false, {
                  fileName: "/app/applet/src/pages/Home.tsx",
                  lineNumber: 161,
                  columnNumber: 15
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/pages/Home.tsx",
                lineNumber: 159,
                columnNumber: 13
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "px-1.5 pb-2", children: [
                /* @__PURE__ */ jsxDEV("h4", { className: "font-black text-sm text-slate-900 dark:text-white line-clamp-1 mb-1 tracking-tight", children: listing.title }, void 0, false, {
                  fileName: "/app/applet/src/pages/Home.tsx",
                  lineNumber: 168,
                  columnNumber: 15
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5 text-slate-500 mb-2", children: [
                  /* @__PURE__ */ jsxDEV(MapPin, { className: "w-3 h-3 flex-shrink-0" }, void 0, false, {
                    fileName: "/app/applet/src/pages/Home.tsx",
                    lineNumber: 170,
                    columnNumber: 17
                  }, this),
                  /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] font-medium line-clamp-1", children: listing.location }, void 0, false, {
                    fileName: "/app/applet/src/pages/Home.tsx",
                    lineNumber: 171,
                    columnNumber: 17
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/pages/Home.tsx",
                  lineNumber: 169,
                  columnNumber: 15
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800", children: [
                  /* @__PURE__ */ jsxDEV("p", { className: "text-primary-600 font-black text-sm", children: listing.price }, void 0, false, {
                    fileName: "/app/applet/src/pages/Home.tsx",
                    lineNumber: 174,
                    columnNumber: 17
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded-md", children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "w-1 h-1 rounded-full bg-primary-600 animate-pulse" }, void 0, false, {
                      fileName: "/app/applet/src/pages/Home.tsx",
                      lineNumber: 176,
                      columnNumber: 20
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "text-[8px] font-black text-primary-600 uppercase tracking-widest", children: "Active" }, void 0, false, {
                      fileName: "/app/applet/src/pages/Home.tsx",
                      lineNumber: 177,
                      columnNumber: 20
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/pages/Home.tsx",
                    lineNumber: 175,
                    columnNumber: 17
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/pages/Home.tsx",
                  lineNumber: 173,
                  columnNumber: 15
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/pages/Home.tsx",
                lineNumber: 167,
                columnNumber: 13
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/pages/Home.tsx",
            lineNumber: 155,
            columnNumber: 11
          },
          this
        )
      },
      void 0,
      false,
      {
        fileName: "/app/applet/src/pages/Home.tsx",
        lineNumber: 151,
        columnNumber: 7
      },
      this
    )
  ] }, void 0, true, {
    fileName: "/app/applet/src/pages/Home.tsx",
    lineNumber: 130,
    columnNumber: 5
  }, this);
};
_s(MapMarkerWithInfoWindow, "+sbubXxrO4ebLBgVuH1d/BeUxCc=", false, function() {
  return [useAdvancedMarkerRef];
});
_c = MapMarkerWithInfoWindow;
const MapControlsOverlay = () => {
  _s2();
  const map = useMap();
  const [currentTilt, setCurrentTilt] = useState(0);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [mapType, setMapType] = useState("roadmap");
  useEffect(() => {
    if (!map) return;
    setCurrentTilt(map.getTilt() || 0);
    setCurrentHeading(map.getHeading() || 0);
    const listener = map.addListener("idle", () => {
      setCurrentTilt(map.getTilt() || 0);
      setCurrentHeading(map.getHeading() || 0);
      const type = map.getMapTypeId() || "roadmap";
      setMapType(type);
    });
    return () => {
      if (listener) listener.remove();
    };
  }, [map]);
  const handleMapTypeChange = (type) => {
    if (!map) return;
    map.setMapTypeId(type);
    setMapType(type);
  };
  const toggleTilt = () => {
    if (!map) return;
    const nextTilt = currentTilt > 10 ? 0 : 45;
    map.setTilt(nextTilt);
    setCurrentTilt(nextTilt);
    if (nextTilt > 10) {
      const currentZoom = map.getZoom() || 12;
      if (currentZoom < 15.5) {
        map.setZoom(16.5);
      }
    }
  };
  const handleRotate = (degrees) => {
    if (!map) return;
    const newHeading = (currentHeading + degrees + 360) % 360;
    map.setHeading(newHeading);
    setCurrentHeading(newHeading);
  };
  const resetNorth = () => {
    if (!map) return;
    map.setHeading(0);
    setCurrentHeading(0);
  };
  const handleZoom = (amount) => {
    if (!map) return;
    const zoom = map.getZoom() || 12;
    map.setZoom(zoom + amount);
  };
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-2xl shadow-xl border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 flex gap-1 transition-all duration-300", children: [
      { id: "roadmap", label: "Minimal", icon: /* @__PURE__ */ jsxDEV(Map, { className: "w-3.5 h-3.5" }, void 0, false, {
        fileName: "/app/applet/src/pages/Home.tsx",
        lineNumber: 256,
        columnNumber: 52
      }, this) },
      { id: "satellite", label: "Satellite", icon: /* @__PURE__ */ jsxDEV(Globe, { className: "w-3.5 h-3.5" }, void 0, false, {
        fileName: "/app/applet/src/pages/Home.tsx",
        lineNumber: 257,
        columnNumber: 56
      }, this) },
      { id: "hybrid", label: "3D Hybrid", icon: /* @__PURE__ */ jsxDEV(Layers, { className: "w-3.5 h-3.5" }, void 0, false, {
        fileName: "/app/applet/src/pages/Home.tsx",
        lineNumber: 258,
        columnNumber: 53
      }, this) }
    ].map(
      (type) => /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => handleMapTypeChange(type.id),
          className: `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${mapType === type.id ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20 scale-[1.03]" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`,
          title: `Switch to ${type.label}`,
          children: [
            type.icon,
            /* @__PURE__ */ jsxDEV("span", { className: "hidden sm:inline", children: type.label }, void 0, false, {
              fileName: "/app/applet/src/pages/Home.tsx",
              lineNumber: 267,
              columnNumber: 15
            }, this)
          ]
        },
        type.id,
        true,
        {
          fileName: "/app/applet/src/pages/Home.tsx",
          lineNumber: 260,
          columnNumber: 11
        },
        this
      )
    ) }, void 0, false, {
      fileName: "/app/applet/src/pages/Home.tsx",
      lineNumber: 254,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/pages/Home.tsx",
      lineNumber: 253,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "absolute left-4 top-1/2 -translate-y-1/2 z-30 pointer-events-auto", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 flex flex-col gap-1 items-center transition-all duration-300", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => handleZoom(1),
          className: "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer",
          title: "Zoom In",
          children: "＋"
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/pages/Home.tsx",
          lineNumber: 276,
          columnNumber: 11
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "w-5 h-px bg-slate-200 dark:bg-slate-800" }, void 0, false, {
        fileName: "/app/applet/src/pages/Home.tsx",
        lineNumber: 283,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => handleZoom(-1),
          className: "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer",
          title: "Zoom Out",
          children: "－"
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/pages/Home.tsx",
          lineNumber: 284,
          columnNumber: 11
        },
        this
      )
    ] }, void 0, true, {
      fileName: "/app/applet/src/pages/Home.tsx",
      lineNumber: 275,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/pages/Home.tsx",
      lineNumber: 274,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/app/applet/src/pages/Home.tsx",
    lineNumber: 251,
    columnNumber: 5
  }, this);
};
_s2(MapControlsOverlay, "30IBjZ9d4w8jYpccD7cDAzxHgSI=", false, function() {
  return [useMap];
});
_c2 = MapControlsOverlay;
const MapCenteringController = ({ listings }) => {
  _s3();
  const map = useMap();
  const listingsHash = listings.map((l) => l.id).join(",");
  useEffect(() => {
    if (!map || listings.length === 0) return;
    const firstWithCoords = listings.find(
      (l) => typeof l.latitude === "number" && typeof l.longitude === "number" && l.latitude !== 0 && l.longitude !== 0
    );
    if (firstWithCoords && firstWithCoords.latitude && firstWithCoords.longitude) {
      map.panTo({ lat: firstWithCoords.latitude, lng: firstWithCoords.longitude });
      if ((map.getZoom() || 0) < 13) {
        map.setZoom(14.5);
      }
    }
  }, [map, listingsHash]);
  return null;
};
_s3(MapCenteringController, "IoceErwr5KVGS9kN4RQ1bOkYMAg=", false, function() {
  return [useMap];
});
_c3 = MapCenteringController;
const Home = () => {
  _s4();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [maxBudget, setMaxBudget] = useState(1e9);
  const [isPriceEditable, setIsPriceEditable] = useState(false);
  const [priceInputVal, setPriceInputVal] = useState("1000000000");
  const [showFilters, setShowFilters] = useState(false);
  const [dbListings, setDbListings] = useState([]);
  const [isMapView, setIsMapView] = useState(false);
  const { user, setCurrentListing, setActiveTab } = useAuth();
  const [logoFailed, setLogoFailed] = useState(false);
  const [itemsLoaded, setItemsLoaded] = useState(12);
  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setItemsLoaded(12);
  }, [searchQuery, activeFilter, maxBudget]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setItemsLoaded((prev) => prev + 12);
      }
    }, { rootMargin: "200px" });
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const listingsRef = collection(db, "listings");
    const q = query(listingsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc2) => ({
        ...doc2.data(),
        id: doc2.id
      })).sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setDbListings(fetched);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "listings");
    });
    return () => unsubscribe();
  }, []);
  const isAgent = user?.role === "agent";
  const filters = ["All", "Self-Contain", "1 Bedroom Flat", "Shared"];
  const filteredListings = useMemo(() => {
    let baseListings = dbListings.filter((l) => l.status !== "suspended" && l.status !== "completed");
    if (isAgent && user) {
      baseListings = baseListings.filter(
        (l) => l.agent?.id && String(l.agent.id) === String(user.id) && (l.isApproved === true || l.isApproved === void 0)
      );
    } else {
      baseListings = baseListings.filter((l) => {
        const approved = l.isApproved === true || String(l.isApproved) === "true" || l.isApproved === void 0;
        return approved;
      });
    }
    return baseListings.filter((listing) => {
      const queryStr = searchQuery.toLowerCase().trim();
      const matchesSearch = listing.title.toLowerCase().includes(queryStr) || listing.location.toLowerCase().includes(queryStr) || listing.price && listing.price.toLowerCase().includes(queryStr) || listing.area && listing.area.toLowerCase().includes(queryStr) || listing.landmark && listing.landmark.toLowerCase().includes(queryStr) || listing.agent?.name && listing.agent.name.toLowerCase().includes(queryStr) || (listing.amenities || []).some((a) => a.toLowerCase().includes(queryStr));
      const matchesFilter = activeFilter === "All" || listing.type === activeFilter;
      const matchesBudget = listing.priceValue <= maxBudget;
      return matchesSearch && matchesFilter && matchesBudget;
    });
  }, [searchQuery, activeFilter, maxBudget, isAgent, user?.id, dbListings]);
  const visibleListings = useMemo(() => filteredListings.slice(0, itemsLoaded), [filteredListings, itemsLoaded]);
  const clearFilters = React.useCallback(() => {
    setSearchQuery("");
    setActiveFilter("All");
    setMaxBudget(1e9);
  }, []);
  const handleDelete = React.useCallback(async (listingId) => {
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
      await addDoc(collection(db, "saved_searches"), {
        userId: user.id,
        query: searchQuery,
        type: activeFilter,
        maxPrice: maxBudget,
        createdAt: serverTimestamp()
      });
      alert("Search alert saved! We will notify you when matching properties are posted.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "saved_searches");
    } finally {
      setIsSavingSearch(false);
    }
  }, [user, searchQuery, activeFilter, maxBudget]);
  const showSaveSearch = !isAgent && (searchQuery || activeFilter !== "All" || maxBudget < 1e9);
  return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300", children: [
    /* @__PURE__ */ jsxDEV("header", { className: `sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 lg:hidden px-4 h-16 flex items-center justify-between`, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxDEV(HamburgerButton, {}, void 0, false, {
          fileName: "/app/applet/src/pages/Home.tsx",
          lineNumber: 469,
          columnNumber: 11
        }, this),
        !logoFailed ? /* @__PURE__ */ jsxDEV(
          "img",
          {
            src: isDark ? "/logo-dark.png" : "/logo-light.png",
            onError: () => setLogoFailed(true),
            className: "h-9 w-auto object-contain max-w-[120px]",
            alt: "DirectRent",
            referrerPolicy: "no-referrer"
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/pages/Home.tsx",
            lineNumber: 471,
            columnNumber: 11
          },
          this
        ) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { className: "w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsxDEV(HomeIcon, { className: "text-white w-3.5 h-3.5 sm:w-4 sm:h-4" }, void 0, false, {
            fileName: "/app/applet/src/pages/Home.tsx",
            lineNumber: 481,
            columnNumber: 17
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/pages/Home.tsx",
            lineNumber: 480,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "text-sm sm:text-base font-display font-bold text-slate-900 dark:text-white tracking-tight", children: [
            "Direct",
            /* @__PURE__ */ jsxDEV("span", { className: "text-primary-600", children: "Rent" }, void 0, false, {
              fileName: "/app/applet/src/pages/Home.tsx",
              lineNumber: 483,
              columnNumber: 129
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/pages/Home.tsx",
            lineNumber: 483,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/pages/Home.tsx",
          lineNumber: 479,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/pages/Home.tsx",
        lineNumber: 468,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
        !isAgent && /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setIsMapView(!isMapView),
            className: `p-2 rounded-full transition-all flex items-center justify-center ${isMapView ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"}`,
            title: isMapView ? "Switch to Grid View" : "Switch to Map View",
            children: isMapView ? /* @__PURE__ */ jsxDEV(LayoutGrid, { className: "w-5 h-5" }, void 0, false, {
              fileName: "/app/applet/src/pages/Home.tsx",
              lineNumber: 494,
              columnNumber: 28
            }, this) : /* @__PURE__ */ jsxDEV(Map, { className: "w-5 h-5" }, void 0, false, {
              fileName: "/app/applet/src/pages/Home.tsx",
              lineNumber: 494,
              columnNumber: 65
            }, this)
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/pages/Home.tsx",
            lineNumber: 489,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("notifications"),
            className: "p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors group",
            children: [
              /* @__PURE__ */ jsxDEV(Bell, { className: "w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-primary-600 transition-colors" }, void 0, false, {
                fileName: "/app/applet/src/pages/Home.tsx",
                lineNumber: 501,
                columnNumber: 13
              }, this),
              /* @__PURE__ */ jsxDEV(NotificationBadge, {}, void 0, false, {
                fileName: "/app/applet/src/pages/Home.tsx",
                lineNumber: 502,
                columnNumber: 13
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/pages/Home.tsx",
            lineNumber: 497,
            columnNumber: 11
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/pages/Home.tsx",
        lineNumber: 487,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/pages/Home.tsx",
      lineNumber: 467,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV(HeaderPortal, { children: /* @__PURE__ */ jsxDEV("div", { className: "hidden lg:flex flex-1 items-center justify-between px-6 h-full", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-black uppercase tracking-widest text-primary-600 leading-none", children: "Find Your Space" }, void 0, false, {
          fileName: "/app/applet/src/pages/Home.tsx",
          lineNumber: 511,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("h1", { className: "text-lg font-display font-black text-slate-900 dark:text-white tracking-tight mt-0.5", children: "Explore Houses" }, void 0, false, {
          fileName: "/app/applet/src/pages/Home.tsx",
          lineNumber: 512,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/pages/Home.tsx",
        lineNumber: 510,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-4", children: !isAgent && /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setIsMapView(!isMapView),
          className: `p-2 rounded-full transition-all flex items-center justify-center ${isMapView ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"}`,
          title: isMapView ? "Switch to Grid View" : "Switch to Map View",
          children: isMapView ? /* @__PURE__ */ jsxDEV(LayoutGrid, { className: "w-5 h-5" }, void 0, false, {
            fileName: "/app/applet/src/pages/Home.tsx",
            lineNumber: 523,
            columnNumber: 30
          }, this) : /* @__PURE__ */ jsxDEV(Map, { className: "w-5 h-5" }, void 0, false, {
            fileName: "/app/applet/src/pages/Home.tsx",
            lineNumber: 523,
            columnNumber: 67
          }, this)
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/pages/Home.tsx",
          lineNumber: 518,
          columnNumber: 13
        },
        this
      ) }, void 0, false, {
        fileName: "/app/applet/src/pages/Home.tsx",
        lineNumber: 516,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/pages/Home.tsx",
      lineNumber: 509,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/pages/Home.tsx",
      lineNumber: 508,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("main", { className: "px-[14px] pb-[15px] mb-0", style: { paddingTop: "15px" }, children: /* @__PURE__ */ jsxDEV(
      motion.div,
      {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        className: "w-full space-y-4 sm:space-y-6",
        children: [
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-4 sm:space-y-6", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "relative group", children: [
              /* @__PURE__ */ jsxDEV(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-400 group-focus-within:text-primary-500 transition-all" }, void 0, false, {
                fileName: "/app/applet/src/pages/Home.tsx",
                lineNumber: 540,
                columnNumber: 11
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  placeholder: isAgent ? "Search by area, landmark, or price..." : "Search by area, landmark, price, or agent name...",
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                  className: "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-10 sm:pl-12 pr-4 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-xs sm:text-sm shadow-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 dark:text-white"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/pages/Home.tsx",
                  lineNumber: 541,
                  columnNumber: 11
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => {
                    setShowFilters(!showFilters);
                    if (!showFilters && window.navigator && window.navigator.vibrate) {
                      window.navigator.vibrate(10);
                    }
                  },
                  className: `absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg sm:rounded-2xl transition-all cursor-pointer ${showFilters ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`,
                  children: /* @__PURE__ */ jsxDEV(Settings2, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4" }, void 0, false, {
                    fileName: "/app/applet/src/pages/Home.tsx",
                    lineNumber: 557,
                    columnNumber: 13
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/pages/Home.tsx",
                  lineNumber: 548,
                  columnNumber: 11
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/pages/Home.tsx",
              lineNumber: 539,
              columnNumber: 9
            }, this),
            /* @__PURE__ */ jsxDEV(AnimatePresence, { children: showFilters && /* @__PURE__ */ jsxDEV(
              motion.div,
              {
                initial: { height: 0, opacity: 0 },
                animate: { height: "auto", opacity: 1 },
                exit: { height: 0, opacity: 0 },
                transition: { duration: 0.3, ease: "easeInOut" },
                className: "bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-black/20 space-y-4 sm:space-y-6 overflow-hidden transition-all duration-350",
                children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col gap-3 sm:gap-4", children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxDEV("label", { className: "text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest", children: "Property Type" }, void 0, false, {
                        fileName: "/app/applet/src/pages/Home.tsx",
                        lineNumber: 572,
                        columnNumber: 19
                      }, this),
                      (searchQuery || activeFilter !== "All" || maxBudget < 1e9) && /* @__PURE__ */ jsxDEV("button", { onClick: clearFilters, className: "text-[9px] sm:text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1 hover:text-rose-600 transition-colors cursor-pointer", children: [
                        /* @__PURE__ */ jsxDEV(FilterX, { className: "w-3 h-3" }, void 0, false, {
                          fileName: "/app/applet/src/pages/Home.tsx",
                          lineNumber: 575,
                          columnNumber: 23
                        }, this),
                        " Reset"
                      ] }, void 0, true, {
                        fileName: "/app/applet/src/pages/Home.tsx",
                        lineNumber: 574,
                        columnNumber: 21
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/pages/Home.tsx",
                      lineNumber: 571,
                      columnNumber: 17
                    }, this),
                    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none", children: filters.map(
                      (filter) => /* @__PURE__ */ jsxDEV(
                        "button",
                        {
                          onClick: () => setActiveFilter(filter),
                          className: `px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-2xl text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${activeFilter === filter ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20" : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-555"}`,
                          children: filter
                        },
                        `filter-${filter}`,
                        false,
                        {
                          fileName: "/app/applet/src/pages/Home.tsx",
                          lineNumber: 581,
                          columnNumber: 21
                        },
                        this
                      )
                    ) }, void 0, false, {
                      fileName: "/app/applet/src/pages/Home.tsx",
                      lineNumber: 579,
                      columnNumber: 17
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/pages/Home.tsx",
                    lineNumber: 570,
                    columnNumber: 15
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "space-y-3 sm:space-y-4", children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center px-1", children: [
                      /* @__PURE__ */ jsxDEV("label", { className: "text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest", children: "Price" }, void 0, false, {
                        fileName: "/app/applet/src/pages/Home.tsx",
                        lineNumber: 594,
                        columnNumber: 19
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "text-xs sm:text-sm font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1", children: [
                        /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] opacity-60", children: "UP TO" }, void 0, false, {
                          fileName: "/app/applet/src/pages/Home.tsx",
                          lineNumber: 596,
                          columnNumber: 21
                        }, this),
                        isPriceEditable ? /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1 border-b border-primary-500", children: [
                          /* @__PURE__ */ jsxDEV("span", { className: "text-xs", children: "₦" }, void 0, false, {
                            fileName: "/app/applet/src/pages/Home.tsx",
                            lineNumber: 599,
                            columnNumber: 25
                          }, this),
                          /* @__PURE__ */ jsxDEV(
                            "input",
                            {
                              type: "number",
                              className: "w-24 bg-transparent outline-none text-xs text-primary-605 dark:text-primary-400 font-extrabold focus:ring-0 p-0 border-none",
                              value: priceInputVal,
                              onChange: (e) => setPriceInputVal(e.target.value),
                              onBlur: () => {
                                setIsPriceEditable(false);
                                const parsed = parseInt(priceInputVal);
                                if (!isNaN(parsed) && parsed >= 0) {
                                  setMaxBudget(Math.min(parsed, 1e9));
                                }
                              },
                              onKeyDown: (e) => {
                                if (e.key === "Enter") {
                                  setIsPriceEditable(false);
                                  const parsed = parseInt(priceInputVal);
                                  if (!isNaN(parsed) && parsed >= 0) {
                                    setMaxBudget(Math.min(parsed, 1e9));
                                  }
                                }
                              },
                              autoFocus: true
                            },
                            void 0,
                            false,
                            {
                              fileName: "/app/applet/src/pages/Home.tsx",
                              lineNumber: 600,
                              columnNumber: 25
                            },
                            this
                          )
                        ] }, void 0, true, {
                          fileName: "/app/applet/src/pages/Home.tsx",
                          lineNumber: 598,
                          columnNumber: 23
                        }, this) : /* @__PURE__ */ jsxDEV(
                          "span",
                          {
                            onClick: () => {
                              setPriceInputVal(maxBudget.toString());
                              setIsPriceEditable(true);
                            },
                            className: "cursor-pointer hover:underline underline-offset-2 flex items-center gap-0.5",
                            title: "Click to edit value manually",
                            children: [
                              "₦",
                              maxBudget.toLocaleString(),
                              " ",
                              /* @__PURE__ */ jsxDEV("span", { className: "text-[8px] font-normal opacity-50 text-slate-400 hover:text-primary-505", children: "(edit)" }, void 0, false, {
                                fileName: "/app/applet/src/pages/Home.tsx",
                                lineNumber: 633,
                                columnNumber: 55
                              }, this)
                            ]
                          },
                          void 0,
                          true,
                          {
                            fileName: "/app/applet/src/pages/Home.tsx",
                            lineNumber: 625,
                            columnNumber: 23
                          },
                          this
                        )
                      ] }, void 0, true, {
                        fileName: "/app/applet/src/pages/Home.tsx",
                        lineNumber: 595,
                        columnNumber: 19
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/pages/Home.tsx",
                      lineNumber: 593,
                      columnNumber: 17
                    }, this),
                    /* @__PURE__ */ jsxDEV(
                      "input",
                      {
                        type: "range",
                        min: "0",
                        max: "1000000000",
                        step: "500000",
                        value: maxBudget,
                        onChange: (e) => {
                          const val = parseInt(e.target.value);
                          setMaxBudget(val);
                          setPriceInputVal(val.toString());
                        },
                        className: "w-full h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-600"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/pages/Home.tsx",
                        lineNumber: 638,
                        columnNumber: 17
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-[8px] sm:text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-wider px-1", children: [
                      /* @__PURE__ */ jsxDEV("span", { children: "₦0" }, void 0, false, {
                        fileName: "/app/applet/src/pages/Home.tsx",
                        lineNumber: 652,
                        columnNumber: 19
                      }, this),
                      /* @__PURE__ */ jsxDEV("span", { children: "₦5M" }, void 0, false, {
                        fileName: "/app/applet/src/pages/Home.tsx",
                        lineNumber: 653,
                        columnNumber: 19
                      }, this),
                      /* @__PURE__ */ jsxDEV("span", { children: "₦500M" }, void 0, false, {
                        fileName: "/app/applet/src/pages/Home.tsx",
                        lineNumber: 654,
                        columnNumber: 19
                      }, this),
                      /* @__PURE__ */ jsxDEV("span", { children: "₦1B+" }, void 0, false, {
                        fileName: "/app/applet/src/pages/Home.tsx",
                        lineNumber: 655,
                        columnNumber: 19
                      }, this)
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/pages/Home.tsx",
                      lineNumber: 651,
                      columnNumber: 17
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/pages/Home.tsx",
                    lineNumber: 592,
                    columnNumber: 15
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/pages/Home.tsx",
                lineNumber: 563,
                columnNumber: 15
              },
              this
            ) }, void 0, false, {
              fileName: "/app/applet/src/pages/Home.tsx",
              lineNumber: 561,
              columnNumber: 9
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/pages/Home.tsx",
            lineNumber: 538,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between pr-0", children: [
            /* @__PURE__ */ jsxDEV("h1", { className: "text-base sm:text-xl font-display font-bold text-slate-900 dark:text-white tracking-tight", children: isAgent ? "Your Listings" : "Available Listings" }, void 0, false, {
              fileName: "/app/applet/src/pages/Home.tsx",
              lineNumber: 664,
              columnNumber: 9
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
              showSaveSearch && /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: handleSaveSearch,
                  disabled: isSavingSearch,
                  className: "flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary-100 dark:border-primary-800/50 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all cursor-pointer disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsxDEV(Bell, { className: "w-3 h-3" }, void 0, false, {
                      fileName: "/app/applet/src/pages/Home.tsx",
                      lineNumber: 674,
                      columnNumber: 15
                    }, this),
                    " ",
                    isSavingSearch ? "Saving..." : "Save Alert"
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/pages/Home.tsx",
                  lineNumber: 669,
                  columnNumber: 15
                },
                this
              ),
              filteredListings.length > 0 && /* @__PURE__ */ jsxDEV("button", { onClick: clearFilters, className: "text-[9px] sm:text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline transition-all cursor-pointer", children: "Show all" }, void 0, false, {
                fileName: "/app/applet/src/pages/Home.tsx",
                lineNumber: 678,
                columnNumber: 15
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/pages/Home.tsx",
              lineNumber: 667,
              columnNumber: 9
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/pages/Home.tsx",
            lineNumber: 663,
            columnNumber: 7
          }, this),
          /* @__PURE__ */ jsxDEV(AnimatePresence, { mode: "wait", children: isMapView && !isAgent ? /* @__PURE__ */ jsxDEV(
            motion.div,
            {
              initial: { opacity: 0, scale: 0.98 },
              animate: { opacity: 1, scale: 1 },
              exit: { opacity: 0, scale: 0.98 },
              className: "w-full h-[calc(100vh-200px)] flex flex-col lg:flex-row gap-4",
              children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex-1 rounded-3xl overflow-hidden border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 shadow-xl relative min-h-[300px] transition-all duration-300", children: [
                  /* @__PURE__ */ jsxDEV(GoogleMapsGuard, { children: /* @__PURE__ */ jsxDEV(
                    GoogleMap,
                    {
                      defaultCenter: { lat: 6.4311, lng: 3.4158 },
                      defaultZoom: 13,
                      defaultTilt: 45,
                      defaultHeading: 0,
                      gestureHandling: "cooperative",
                      disableDefaultUI: true,
                      styles: isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
                      mapId: "DEMO_MAP_ID",
                      internalUsageAttributionIds: ["gmp_mcp_codeassist_v1_aistudio"],
                      className: "w-full h-full",
                      children: [
                        filteredListings.map(
                          (listing) => /* @__PURE__ */ jsxDEV(
                            MapMarkerWithInfoWindow,
                            {
                              listing,
                              onClick: setCurrentListing
                            },
                            `map-marker-${listing.id}`,
                            false,
                            {
                              fileName: "/app/applet/src/pages/Home.tsx",
                              lineNumber: 711,
                              columnNumber: 21
                            },
                            this
                          )
                        ),
                        /* @__PURE__ */ jsxDEV(MapControlsOverlay, {}, void 0, false, {
                          fileName: "/app/applet/src/pages/Home.tsx",
                          lineNumber: 717,
                          columnNumber: 19
                        }, this),
                        /* @__PURE__ */ jsxDEV(MapCenteringController, { listings: filteredListings }, void 0, false, {
                          fileName: "/app/applet/src/pages/Home.tsx",
                          lineNumber: 718,
                          columnNumber: 19
                        }, this)
                      ]
                    },
                    void 0,
                    true,
                    {
                      fileName: "/app/applet/src/pages/Home.tsx",
                      lineNumber: 698,
                      columnNumber: 17
                    },
                    this
                  ) }, void 0, false, {
                    fileName: "/app/applet/src/pages/Home.tsx",
                    lineNumber: 697,
                    columnNumber: 15
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 shadow-lg flex items-center gap-2 transition-all duration-300", children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "w-8 h-8 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center text-primary-600", children: /* @__PURE__ */ jsxDEV(Navigation, { className: "w-4 h-4" }, void 0, false, {
                      fileName: "/app/applet/src/pages/Home.tsx",
                      lineNumber: 723,
                      columnNumber: 19
                    }, this) }, void 0, false, {
                      fileName: "/app/applet/src/pages/Home.tsx",
                      lineNumber: 722,
                      columnNumber: 17
                    }, this),
                    /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV("h4", { className: "text-xs font-black text-slate-900 dark:text-white", children: "Area Discovery" }, void 0, false, {
                      fileName: "/app/applet/src/pages/Home.tsx",
                      lineNumber: 726,
                      columnNumber: 19
                    }, this) }, void 0, false, {
                      fileName: "/app/applet/src/pages/Home.tsx",
                      lineNumber: 725,
                      columnNumber: 17
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/pages/Home.tsx",
                    lineNumber: 721,
                    columnNumber: 15
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/pages/Home.tsx",
                  lineNumber: 696,
                  columnNumber: 13
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "hidden lg:block w-full lg:w-[400px] xl:w-[450px] overflow-y-auto pr-2 space-y-4", children: [
                  visibleListings.length > 0 ? visibleListings.map((listing, index) => {
                    const isLast = index === visibleListings.length - 1;
                    return /* @__PURE__ */ jsxDEV(
                      "div",
                      {
                        className: isLast ? "" : "border-b border-slate-200 dark:border-slate-800 pb-4",
                        children: /* @__PURE__ */ jsxDEV(
                          ListingCard,
                          {
                            listing,
                            onViewDetails: () => setCurrentListing(listing),
                            isAgentView: isAgent,
                            onEdit: () => {
                              setCurrentListing(listing);
                              setActiveTab("create");
                            },
                            onDelete: () => handleDelete(listing.id)
                          },
                          void 0,
                          false,
                          {
                            fileName: "/app/applet/src/pages/Home.tsx",
                            lineNumber: 741,
                            columnNumber: 25
                          },
                          this
                        )
                      },
                      `sidebar-listing-${listing.id}`,
                      false,
                      {
                        fileName: "/app/applet/src/pages/Home.tsx",
                        lineNumber: 737,
                        columnNumber: 21
                      },
                      this
                    );
                  }) : /* @__PURE__ */ jsxDEV("p", { className: "text-center text-slate-500 py-10", children: "No listings found in this area." }, void 0, false, {
                    fileName: "/app/applet/src/pages/Home.tsx",
                    lineNumber: 755,
                    columnNumber: 17
                  }, this),
                  filteredListings.length > itemsLoaded && /* @__PURE__ */ jsxDEV("div", { ref: sentinelRef, className: "h-0 w-0 pointer-events-none", style: { margin: "0px" } }, void 0, false, {
                    fileName: "/app/applet/src/pages/Home.tsx",
                    lineNumber: 758,
                    columnNumber: 17
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/pages/Home.tsx",
                  lineNumber: 732,
                  columnNumber: 13
                }, this)
              ]
            },
            "map-view",
            true,
            {
              fileName: "/app/applet/src/pages/Home.tsx",
              lineNumber: 688,
              columnNumber: 13
            },
            this
          ) : /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-4 sm:gap-6 lg:gap-8 min-h-[400px]", children: [
            visibleListings.length > 0 ? visibleListings.map(
              (listing) => /* @__PURE__ */ jsxDEV(
                ListingCard,
                {
                  listing,
                  onViewDetails: () => setCurrentListing(listing),
                  isAgentView: isAgent,
                  onEdit: () => {
                    setCurrentListing(listing);
                    setActiveTab("create");
                  },
                  onDelete: () => handleDelete(listing.id)
                },
                `home-listing-${listing.id}`,
                false,
                {
                  fileName: "/app/applet/src/pages/Home.tsx",
                  lineNumber: 766,
                  columnNumber: 15
                },
                this
              )
            ) : /* @__PURE__ */ jsxDEV("div", { className: "col-span-full py-20 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto", children: isAgent ? /* @__PURE__ */ jsxDEV(HomeIcon, { className: "w-10 h-10 text-slate-200 dark:text-slate-700" }, void 0, false, {
                fileName: "/app/applet/src/pages/Home.tsx",
                lineNumber: 781,
                columnNumber: 30
              }, this) : /* @__PURE__ */ jsxDEV(Search, { className: "w-10 h-10 text-slate-200 dark:text-slate-700" }, void 0, false, {
                fileName: "/app/applet/src/pages/Home.tsx",
                lineNumber: 781,
                columnNumber: 102
              }, this) }, void 0, false, {
                fileName: "/app/applet/src/pages/Home.tsx",
                lineNumber: 780,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("p", { className: "text-slate-900 dark:text-white font-bold", children: isAgent ? "You have no listings yet" : "No matches found" }, void 0, false, {
                  fileName: "/app/applet/src/pages/Home.tsx",
                  lineNumber: 784,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-slate-400 dark:text-slate-500 text-xs mt-1", children: isAgent ? "Start by posting your first property to find tenants" : "Try adjusting your budget or search terms" }, void 0, false, {
                  fileName: "/app/applet/src/pages/Home.tsx",
                  lineNumber: 785,
                  columnNumber: 19
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/pages/Home.tsx",
                lineNumber: 783,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: isAgent ? () => setActiveTab("create") : clearFilters,
                  className: "px-6 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20",
                  children: isAgent ? "Post a Listing" : "Clear all filters"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/pages/Home.tsx",
                  lineNumber: 789,
                  columnNumber: 17
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/pages/Home.tsx",
              lineNumber: 779,
              columnNumber: 15
            }, this),
            filteredListings.length > itemsLoaded && /* @__PURE__ */ jsxDEV("div", { ref: sentinelRef, className: "col-span-full h-0 w-0 pointer-events-none" }, void 0, false, {
              fileName: "/app/applet/src/pages/Home.tsx",
              lineNumber: 798,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/pages/Home.tsx",
            lineNumber: 763,
            columnNumber: 13
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/pages/Home.tsx",
            lineNumber: 686,
            columnNumber: 7
          }, this)
        ]
      },
      void 0,
      true,
      {
        fileName: "/app/applet/src/pages/Home.tsx",
        lineNumber: 531,
        columnNumber: 9
      },
      this
    ) }, void 0, false, {
      fileName: "/app/applet/src/pages/Home.tsx",
      lineNumber: 530,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/app/applet/src/pages/Home.tsx",
    lineNumber: 465,
    columnNumber: 5
  }, this);
};
_s4(Home, "2/k177WllJx4NBgIJCteQ1sEqjs=", false, function() {
  return [useAuth];
});
_c4 = Home;
export default Home;
var _c, _c2, _c3, _c4;
$RefreshReg$(_c, "MapMarkerWithInfoWindow");
$RefreshReg$(_c2, "MapControlsOverlay");
$RefreshReg$(_c3, "MapCenteringController");
$RefreshReg$(_c4, "Home");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("/app/applet/src/pages/Home.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/app/applet/src/pages/Home.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "/app/applet/src/pages/Home.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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InVzZU1lbW8iLCJ1c2VFZmZlY3QiLCJ1c2VSZWYiLCJIYW1idXJnZXJCdXR0b24iLCJBbmltYXRlUHJlc2VuY2UiLCJtb3Rpb24iLCJTZWFyY2giLCJTZXR0aW5nczIiLCJNYXBQaW4iLCJGaWx0ZXJYIiwiSG9tZSIsIkhvbWVJY29uIiwiQmVsbCIsIk1hcCIsIkxheW91dEdyaWQiLCJOYXZpZ2F0aW9uIiwiQnVpbGRpbmcyIiwiTGF5ZXJzIiwiR2xvYmUiLCJHb29nbGVNYXAiLCJBZHZhbmNlZE1hcmtlciIsIkluZm9XaW5kb3ciLCJ1c2VBZHZhbmNlZE1hcmtlclJlZiIsInVzZU1hcCIsIkxpc3RpbmdDYXJkIiwiU2FmZUltYWdlIiwidXNlQXV0aCIsImRiIiwiaGFuZGxlRmlyZXN0b3JlRXJyb3IiLCJPcGVyYXRpb25UeXBlIiwiY29sbGVjdGlvbiIsInF1ZXJ5Iiwib25TbmFwc2hvdCIsImFkZERvYyIsInNlcnZlclRpbWVzdGFtcCIsInB1cmdlTGlzdGluZ0RhdGEiLCJOb3RpZmljYXRpb25CYWRnZSIsIkdvb2dsZU1hcHNHdWFyZCIsIkhlYWRlclBvcnRhbCIsIkxJR0hUX01BUF9TVFlMRSIsIkRBUktfTUFQX1NUWUxFIiwiZ2V0TWFya2VySWNvbiIsInR5cGUiLCJub3JtIiwidG9Mb3dlckNhc2UiLCJpbmNsdWRlcyIsIk1hcE1hcmtlcldpdGhJbmZvV2luZG93IiwibGlzdGluZyIsIm9uQ2xpY2siLCJfcyIsIm1hcmtlclJlZiIsIm1hcmtlciIsImluZm9XaW5kb3dTaG93biIsInNldEluZm9XaW5kb3dTaG93biIsImxhdGl0dWRlIiwibG9uZ2l0dWRlIiwibGF0IiwibG5nIiwicHJpY2VWYWx1ZSIsInRvRml4ZWQiLCJpbWFnZSIsInRpdGxlIiwibG9jYXRpb24iLCJwcmljZSIsIk1hcENvbnRyb2xzT3ZlcmxheSIsIl9zMiIsIm1hcCIsImN1cnJlbnRUaWx0Iiwic2V0Q3VycmVudFRpbHQiLCJjdXJyZW50SGVhZGluZyIsInNldEN1cnJlbnRIZWFkaW5nIiwibWFwVHlwZSIsInNldE1hcFR5cGUiLCJnZXRUaWx0IiwiZ2V0SGVhZGluZyIsImxpc3RlbmVyIiwiYWRkTGlzdGVuZXIiLCJnZXRNYXBUeXBlSWQiLCJyZW1vdmUiLCJoYW5kbGVNYXBUeXBlQ2hhbmdlIiwic2V0TWFwVHlwZUlkIiwidG9nZ2xlVGlsdCIsIm5leHRUaWx0Iiwic2V0VGlsdCIsImN1cnJlbnRab29tIiwiZ2V0Wm9vbSIsInNldFpvb20iLCJoYW5kbGVSb3RhdGUiLCJkZWdyZWVzIiwibmV3SGVhZGluZyIsInNldEhlYWRpbmciLCJyZXNldE5vcnRoIiwiaGFuZGxlWm9vbSIsImFtb3VudCIsInpvb20iLCJpZCIsImxhYmVsIiwiaWNvbiIsIk1hcENlbnRlcmluZ0NvbnRyb2xsZXIiLCJsaXN0aW5ncyIsIl9zMyIsImxpc3RpbmdzSGFzaCIsImwiLCJqb2luIiwibGVuZ3RoIiwiZmlyc3RXaXRoQ29vcmRzIiwiZmluZCIsInBhblRvIiwiX3M0Iiwic2VhcmNoUXVlcnkiLCJzZXRTZWFyY2hRdWVyeSIsImFjdGl2ZUZpbHRlciIsInNldEFjdGl2ZUZpbHRlciIsIm1heEJ1ZGdldCIsInNldE1heEJ1ZGdldCIsImlzUHJpY2VFZGl0YWJsZSIsInNldElzUHJpY2VFZGl0YWJsZSIsInByaWNlSW5wdXRWYWwiLCJzZXRQcmljZUlucHV0VmFsIiwic2hvd0ZpbHRlcnMiLCJzZXRTaG93RmlsdGVycyIsImRiTGlzdGluZ3MiLCJzZXREYkxpc3RpbmdzIiwiaXNNYXBWaWV3Iiwic2V0SXNNYXBWaWV3IiwidXNlciIsInNldEN1cnJlbnRMaXN0aW5nIiwic2V0QWN0aXZlVGFiIiwibG9nb0ZhaWxlZCIsInNldExvZ29GYWlsZWQiLCJpdGVtc0xvYWRlZCIsInNldEl0ZW1zTG9hZGVkIiwic2Nyb2xsUmVmIiwic2VudGluZWxSZWYiLCJpc0RhcmsiLCJzZXRJc0RhcmsiLCJkb2N1bWVudCIsImRvY3VtZW50RWxlbWVudCIsImNsYXNzTGlzdCIsImNvbnRhaW5zIiwib2JzZXJ2ZXIiLCJNdXRhdGlvbk9ic2VydmVyIiwib2JzZXJ2ZSIsImF0dHJpYnV0ZXMiLCJhdHRyaWJ1dGVGaWx0ZXIiLCJkaXNjb25uZWN0IiwiSW50ZXJzZWN0aW9uT2JzZXJ2ZXIiLCJlbnRyaWVzIiwiaXNJbnRlcnNlY3RpbmciLCJwcmV2Iiwicm9vdE1hcmdpbiIsImN1cnJlbnQiLCJsaXN0aW5nc1JlZiIsInEiLCJ1bnN1YnNjcmliZSIsInNuYXBzaG90IiwiZmV0Y2hlZCIsImRvY3MiLCJkb2MiLCJkYXRhIiwic29ydCIsImEiLCJiIiwiZGF0ZUEiLCJjcmVhdGVkQXQiLCJzZWNvbmRzIiwiZGF0ZUIiLCJlcnJvciIsIkdFVCIsImlzQWdlbnQiLCJyb2xlIiwiZmlsdGVycyIsImZpbHRlcmVkTGlzdGluZ3MiLCJiYXNlTGlzdGluZ3MiLCJmaWx0ZXIiLCJzdGF0dXMiLCJhZ2VudCIsIlN0cmluZyIsImlzQXBwcm92ZWQiLCJ1bmRlZmluZWQiLCJhcHByb3ZlZCIsInF1ZXJ5U3RyIiwidHJpbSIsIm1hdGNoZXNTZWFyY2giLCJhcmVhIiwibGFuZG1hcmsiLCJuYW1lIiwiYW1lbml0aWVzIiwic29tZSIsIm1hdGNoZXNGaWx0ZXIiLCJtYXRjaGVzQnVkZ2V0IiwidmlzaWJsZUxpc3RpbmdzIiwic2xpY2UiLCJjbGVhckZpbHRlcnMiLCJ1c2VDYWxsYmFjayIsImhhbmRsZURlbGV0ZSIsImxpc3RpbmdJZCIsImlkU3RyIiwiREVMRVRFIiwiaXNTYXZpbmdTZWFyY2giLCJzZXRJc1NhdmluZ1NlYXJjaCIsImhhbmRsZVNhdmVTZWFyY2giLCJ1c2VySWQiLCJtYXhQcmljZSIsImFsZXJ0IiwiV1JJVEUiLCJzaG93U2F2ZVNlYXJjaCIsInBhZGRpbmdUb3AiLCJvcGFjaXR5IiwieSIsImUiLCJ0YXJnZXQiLCJ2YWx1ZSIsIndpbmRvdyIsIm5hdmlnYXRvciIsInZpYnJhdGUiLCJoZWlnaHQiLCJkdXJhdGlvbiIsImVhc2UiLCJwYXJzZWQiLCJwYXJzZUludCIsImlzTmFOIiwiTWF0aCIsIm1pbiIsImtleSIsInRvU3RyaW5nIiwidG9Mb2NhbGVTdHJpbmciLCJ2YWwiLCJzY2FsZSIsImluZGV4IiwiaXNMYXN0IiwibWFyZ2luIiwiX2MiLCJfYzIiLCJfYzMiLCJfYzQiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiSG9tZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlLCB1c2VNZW1vLCB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBIYW1idXJnZXJCdXR0b24gZnJvbSAnLi4vY29tcG9uZW50cy9IYW1idXJnZXJCdXR0b24nO1xuaW1wb3J0IHsgQW5pbWF0ZVByZXNlbmNlLCBtb3Rpb24gfSBmcm9tICdtb3Rpb24vcmVhY3QnO1xuaW1wb3J0IHsgU2VhcmNoLCBTZXR0aW5nczIsIE1hcFBpbiwgRmlsdGVyWCwgSG9tZSBhcyBIb21lSWNvbiwgVHJhc2gyLCBCZWxsLCBNYXAsIExheW91dEdyaWQsIE5hdmlnYXRpb24sIEluZm8sIENvbXBhc3MsIFJvdGF0ZUNjdywgQnVpbGRpbmcyLCBMYXllcnMsIEdsb2JlIH0gZnJvbSAnbHVjaWRlLXJlYWN0JztcbmltcG9ydCB7IEFQSVByb3ZpZGVyLCBNYXAgYXMgR29vZ2xlTWFwLCBBZHZhbmNlZE1hcmtlciwgUGluLCBJbmZvV2luZG93LCB1c2VBZHZhbmNlZE1hcmtlclJlZiwgdXNlTWFwIH0gZnJvbSAnQHZpcy5nbC9yZWFjdC1nb29nbGUtbWFwcyc7XG5pbXBvcnQgTGlzdGluZ0NhcmQgZnJvbSAnLi4vY29tcG9uZW50cy9MaXN0aW5nQ2FyZCc7XG5pbXBvcnQgU2FmZUltYWdlIGZyb20gJy4uL2NvbXBvbmVudHMvU2FmZUltYWdlJztcbmltcG9ydCB7IHVzZUF1dGggfSBmcm9tICcuLi9jb250ZXh0L0F1dGhDb250ZXh0JztcbmltcG9ydCB7IHVzZVRoZW1lIH0gZnJvbSAnLi4vY29udGV4dC9UaGVtZUNvbnRleHQnO1xuaW1wb3J0IHsgZGIsIGhhbmRsZUZpcmVzdG9yZUVycm9yLCBPcGVyYXRpb25UeXBlIH0gZnJvbSAnLi4vbGliL2ZpcmViYXNlJztcbmltcG9ydCB7IGNvbGxlY3Rpb24sIHF1ZXJ5LCBvblNuYXBzaG90LCBvcmRlckJ5LCBkb2MsIHdoZXJlLCBhZGREb2MsIHNlcnZlclRpbWVzdGFtcCB9IGZyb20gJ2ZpcmViYXNlL2ZpcmVzdG9yZSc7XG5pbXBvcnQgeyBwdXJnZUxpc3RpbmdEYXRhIH0gZnJvbSAnLi4vdXRpbHMvYWRtaW5DbGVhbnVwJztcbmltcG9ydCB7IExpc3RpbmcsIE5vdGlmaWNhdGlvbiB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCBOb3RpZmljYXRpb25CYWRnZSBmcm9tICcuLi9jb21wb25lbnRzL05vdGlmaWNhdGlvbkJhZGdlJztcbmltcG9ydCB7IEdvb2dsZU1hcHNHdWFyZCB9IGZyb20gJy4uL2NvbXBvbmVudHMvR29vZ2xlTWFwc0d1YXJkJztcbmltcG9ydCB7IEhlYWRlclBvcnRhbCB9IGZyb20gJy4uL2NvbXBvbmVudHMvSGVhZGVyUG9ydGFsJztcblxuLy8gVWx0cmEtbWluaW1hbCBoaWdoLWVuZCBsaWdodCBzdHlsaW5nIC0gaGlkZXMgc2Nob29scywgc2hvcHMsIHRyYW5zaXQgY2x1dHRlclxuY29uc3QgTElHSFRfTUFQX1NUWUxFID0gW1xuICB7XG4gICAgXCJmZWF0dXJlVHlwZVwiOiBcInBvaVwiLFxuICAgIFwiZWxlbWVudFR5cGVcIjogXCJhbGxcIixcbiAgICBcInN0eWxlcnNcIjogW3sgXCJ2aXNpYmlsaXR5XCI6IFwib2ZmXCIgfV1cbiAgfSxcbiAge1xuICAgIFwiZmVhdHVyZVR5cGVcIjogXCJ0cmFuc2l0XCIsXG4gICAgXCJlbGVtZW50VHlwZVwiOiBcImFsbFwiLFxuICAgIFwic3R5bGVyc1wiOiBbeyBcInZpc2liaWxpdHlcIjogXCJvZmZcIiB9XVxuICB9LFxuICB7XG4gICAgXCJmZWF0dXJlVHlwZVwiOiBcInJvYWRcIixcbiAgICBcImVsZW1lbnRUeXBlXCI6IFwibGFiZWxzLmljb25cIixcbiAgICBcInN0eWxlcnNcIjogW3sgXCJ2aXNpYmlsaXR5XCI6IFwib2ZmXCIgfV1cbiAgfSxcbiAge1xuICAgIFwiZmVhdHVyZVR5cGVcIjogXCJhZG1pbmlzdHJhdGl2ZS5sYW5kX3BhcmNlbFwiLFxuICAgIFwiZWxlbWVudFR5cGVcIjogXCJsYWJlbHNcIixcbiAgICBcInN0eWxlcnNcIjogW3sgXCJ2aXNpYmlsaXR5XCI6IFwib2ZmXCIgfV1cbiAgfSxcbiAge1xuICAgIFwiZmVhdHVyZVR5cGVcIjogXCJ3YXRlclwiLFxuICAgIFwiZWxlbWVudFR5cGVcIjogXCJnZW9tZXRyeS5maWxsXCIsXG4gICAgXCJzdHlsZXJzXCI6IFt7IFwiY29sb3JcIjogXCIjZTBmMmZlXCIgfV1cbiAgfSxcbiAge1xuICAgIFwiZmVhdHVyZVR5cGVcIjogXCJsYW5kc2NhcGVcIixcbiAgICBcImVsZW1lbnRUeXBlXCI6IFwiZ2VvbWV0cnlcIixcbiAgICBcInN0eWxlcnNcIjogW3sgXCJjb2xvclwiOiBcIiNmOGZhZmNcIiB9XVxuICB9LFxuICB7XG4gICAgXCJmZWF0dXJlVHlwZVwiOiBcInJvYWRcIixcbiAgICBcImVsZW1lbnRUeXBlXCI6IFwiZ2VvbWV0cnlcIixcbiAgICBcInN0eWxlcnNcIjogW3sgXCJjb2xvclwiOiBcIiNmMWY1ZjlcIiB9XVxuICB9LFxuICB7XG4gICAgXCJmZWF0dXJlVHlwZVwiOiBcInJvYWQuaGlnaHdheVwiLFxuICAgIFwiZWxlbWVudFR5cGVcIjogXCJnZW9tZXRyeS5maWxsXCIsXG4gICAgXCJzdHlsZXJzXCI6IFt7IFwiY29sb3JcIjogXCIjZTJlOGYwXCIgfV1cbiAgfVxuXTtcblxuLy8gRGFyayBTcGFjZSBtaW5pbWFsIG1hcCBzdHlsZSBtYXRjaGluZyBEaXJlY3RSZW50IGxheW91dFxuY29uc3QgREFSS19NQVBfU1RZTEUgPSBbXG4gIHtcbiAgICBcImZlYXR1cmVUeXBlXCI6IFwiYWxsXCIsXG4gICAgXCJlbGVtZW50VHlwZVwiOiBcImxhYmVscy50ZXh0LmZpbGxcIixcbiAgICBcInN0eWxlcnNcIjogW3sgXCJjb2xvclwiOiBcIiM5NGEzYjhcIiB9XVxuICB9LFxuICB7XG4gICAgXCJmZWF0dXJlVHlwZVwiOiBcImFsbFwiLFxuICAgIFwiZWxlbWVudFR5cGVcIjogXCJsYWJlbHMudGV4dC5zdHJva2VcIixcbiAgICBcInN0eWxlcnNcIjogW3sgXCJ2aXNpYmlsaXR5XCI6IFwib2ZmXCIgfV1cbiAgfSxcbiAge1xuICAgIFwiZmVhdHVyZVR5cGVcIjogXCJhZG1pbmlzdHJhdGl2ZVwiLFxuICAgIFwiZWxlbWVudFR5cGVcIjogXCJnZW9tZXRyeS5zdHJva2VcIixcbiAgICBcInN0eWxlcnNcIjogW3sgXCJjb2xvclwiOiBcIiMxZTI5M2JcIiB9XVxuICB9LFxuICB7XG4gICAgXCJmZWF0dXJlVHlwZVwiOiBcImxhbmRzY2FwZVwiLFxuICAgIFwiZWxlbWVudFR5cGVcIjogXCJnZW9tZXRyeVwiLFxuICAgIFwic3R5bGVyc1wiOiBbeyBcImNvbG9yXCI6IFwiIzAyMDYxN1wiIH1dXG4gIH0sXG4gIHtcbiAgICBcImZlYXR1cmVUeXBlXCI6IFwicG9pXCIsXG4gICAgXCJlbGVtZW50VHlwZVwiOiBcImFsbFwiLFxuICAgIFwic3R5bGVyc1wiOiBbeyBcInZpc2liaWxpdHlcIjogXCJvZmZcIiB9XVxuICB9LFxuICB7XG4gICAgXCJmZWF0dXJlVHlwZVwiOiBcInJvYWRcIixcbiAgICBcImVsZW1lbnRUeXBlXCI6IFwiZ2VvbWV0cnlcIixcbiAgICBcInN0eWxlcnNcIjogW3sgXCJjb2xvclwiOiBcIiMwZjE3MmFcIiB9XVxuICB9LFxuICB7XG4gICAgXCJmZWF0dXJlVHlwZVwiOiBcInJvYWQuaGlnaHdheVwiLFxuICAgIFwiZWxlbWVudFR5cGVcIjogXCJnZW9tZXRyeVwiLFxuICAgIFwic3R5bGVyc1wiOiBbeyBcImNvbG9yXCI6IFwiIzFlMjkzYlwiIH1dXG4gIH0sXG4gIHtcbiAgICBcImZlYXR1cmVUeXBlXCI6IFwidHJhbnNpdFwiLFxuICAgIFwiZWxlbWVudFR5cGVcIjogXCJhbGxcIixcbiAgICBcInN0eWxlcnNcIjogW3sgXCJ2aXNpYmlsaXR5XCI6IFwib2ZmXCIgfV1cbiAgfSxcbiAge1xuICAgIFwiZmVhdHVyZVR5cGVcIjogXCJ3YXRlclwiLFxuICAgIFwiZWxlbWVudFR5cGVcIjogXCJnZW9tZXRyeVwiLFxuICAgIFwic3R5bGVyc1wiOiBbeyBcImNvbG9yXCI6IFwiIzA5MGQxNlwiIH1dXG4gIH1cbl07XG5cbmNvbnN0IGdldE1hcmtlckljb24gPSAodHlwZTogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IG5vcm0gPSB0eXBlPy50b0xvd2VyQ2FzZSgpIHx8ICcnO1xuICBpZiAobm9ybS5pbmNsdWRlcygnY29udGFpbicpIHx8IG5vcm0uaW5jbHVkZXMoJ3NlbGYnKSkge1xuICAgIHJldHVybiA8QnVpbGRpbmcyIGNsYXNzTmFtZT1cInctMy41IGgtMy41XCIgLz47XG4gIH0gZWxzZSBpZiAobm9ybS5pbmNsdWRlcygnc2hhcmVkJykpIHtcbiAgICByZXR1cm4gPExheWVycyBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNVwiIC8+O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiA8SG9tZUljb24gY2xhc3NOYW1lPVwidy0zLjUgaC0zLjVcIiAvPjtcbiAgfVxufTtcblxuY29uc3QgTWFwTWFya2VyV2l0aEluZm9XaW5kb3c6IFJlYWN0LkZDPHsgbGlzdGluZzogTGlzdGluZywgb25DbGljazogKGw6IExpc3RpbmcpID0+IHZvaWQgfT4gPSAoeyBsaXN0aW5nLCBvbkNsaWNrIH0pID0+IHtcbiAgY29uc3QgW21hcmtlclJlZiwgbWFya2VyXSA9IHVzZUFkdmFuY2VkTWFya2VyUmVmKCk7XG4gIGNvbnN0IFtpbmZvV2luZG93U2hvd24sIHNldEluZm9XaW5kb3dTaG93bl0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgLy8gSWYgbm8gbGF0L2xuZywgd2UgZG9uJ3QgcmVuZGVyIGl0ICh0aG91Z2ggd2Ugc2hvdWxkIGhhdmUgaXQgZm9yIGFsbCBuZXcgbGlzdGluZ3MpXG4gIGlmICghbGlzdGluZy5sYXRpdHVkZSB8fCAhbGlzdGluZy5sb25naXR1ZGUpIHJldHVybiBudWxsO1xuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxBZHZhbmNlZE1hcmtlclxuICAgICAgICByZWY9e21hcmtlclJlZn1cbiAgICAgICAgcG9zaXRpb249e3sgbGF0OiBsaXN0aW5nLmxhdGl0dWRlLCBsbmc6IGxpc3RpbmcubG9uZ2l0dWRlIH19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEluZm9XaW5kb3dTaG93bih0cnVlKX1cbiAgICAgID5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncm91cCBjdXJzb3ItcG9pbnRlciBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlclwiPlxuICAgICAgICAgIHsvKiBTdHVubmluZyBQcm9wZXJ0eSBUYWcgKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1wcmltYXJ5LTYwMCBob3ZlcjpiZy1wcmltYXJ5LTcwMCB0ZXh0LXdoaXRlIHB4LTMgcHktMS41IHJvdW5kZWQtZnVsbCB0ZXh0LXhzIGZvbnQtYmxhY2sgc2hhZG93LXhsIHNoYWRvdy1wcmltYXJ5LTUwMC8zMCB0cmFuc2Zvcm0gLXRyYW5zbGF0ZS15LWZ1bGwgbWItMSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IGdyb3VwLWhvdmVyOnNjYWxlLTExMCBncm91cC1ob3ZlcjpiZy1pbmRpZ28tNjAwIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMCBib3JkZXItMiBib3JkZXItd2hpdGUgZGFyazpib3JkZXItc2xhdGUtOTAwXCI+XG4gICAgICAgICAgICB7Z2V0TWFya2VySWNvbihsaXN0aW5nLnR5cGUpfVxuICAgICAgICAgICAgPHNwYW4+4oKme2xpc3RpbmcucHJpY2VWYWx1ZSA+PSAxMDAwMDAwID8gYCR7KGxpc3RpbmcucHJpY2VWYWx1ZSAvIDEwMDAwMDApLnRvRml4ZWQoMSl9TWAgOiBgJHsobGlzdGluZy5wcmljZVZhbHVlIC8gMTAwMCkudG9GaXhlZCgwKX1rYH08L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgey8qIEdsb3dpbmcgcHVsc2UgbWFya2VyIHBvaW50ICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgLXRyYW5zbGF0ZS15LTJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgdy02IGgtNiBiZy1wcmltYXJ5LTUwMC80MCByb3VuZGVkLWZ1bGwgYW5pbWF0ZS1waW5nIHBvaW50ZXItZXZlbnRzLW5vbmVcIiAvPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNSBiZy1wcmltYXJ5LTYwMCBib3JkZXItMiBib3JkZXItd2hpdGUgZGFyazpib3JkZXItc2xhdGUtOTAwIHJvdW5kZWQtZnVsbCBzaGFkb3ctbGcgcmVsYXRpdmUgei0xMCBncm91cC1ob3ZlcjpzY2FsZS0xMjUgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwXCIgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L0FkdmFuY2VkTWFya2VyPlxuXG4gICAgICB7aW5mb1dpbmRvd1Nob3duICYmIChcbiAgICAgICAgPEluZm9XaW5kb3dcbiAgICAgICAgICBhbmNob3I9e21hcmtlcn1cbiAgICAgICAgICBvbkNsb3NlQ2xpY2s9eygpID0+IHNldEluZm9XaW5kb3dTaG93bihmYWxzZSl9XG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2IFxuICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0wLjUgb3ZlcmZsb3ctaGlkZGVuIGdyb3VwL2NhcmQgbWF4LXctWzIyMHB4XSBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsaWNrKGxpc3RpbmcpfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgbWItM1wiPlxuICAgICAgICAgICAgICA8U2FmZUltYWdlIHNyYz17bGlzdGluZy5pbWFnZX0gZmFsbGJhY2tUeXBlPVwiaG91c2VcIiBjbGFzc05hbWU9XCJ3LWZ1bGwgaC0yOCBvYmplY3QtY292ZXIgZ3JvdXAtaG92ZXIvY2FyZDpzY2FsZS0xMTAgdHJhbnNpdGlvbi10cmFuc2Zvcm0gZHVyYXRpb24tNTAwXCIgLz5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSB0b3AtMiBsZWZ0LTJcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJiZy13aGl0ZS85MCBiYWNrZHJvcC1ibHVyLW1kIGRhcms6Ymctc2xhdGUtOTAwLzkwIHB4LTIgcHktMC41IHJvdW5kZWQtbGcgdGV4dC1bOXB4XSBmb250LWJsYWNrIHRleHQtcHJpbWFyeS02MDAgdXBwZXJjYXNlIHRyYWNraW5nLXRpZ2h0ZXIgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgZGFyazpib3JkZXItc2xhdGUtODAwXCI+XG4gICAgICAgICAgICAgICAgICB7bGlzdGluZy50eXBlfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtMS41IHBiLTJcIj5cbiAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cImZvbnQtYmxhY2sgdGV4dC1zbSB0ZXh0LXNsYXRlLTkwMCBkYXJrOnRleHQtd2hpdGUgbGluZS1jbGFtcC0xIG1iLTEgdHJhY2tpbmctdGlnaHRcIj57bGlzdGluZy50aXRsZX08L2g0PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgdGV4dC1zbGF0ZS01MDAgbWItMlwiPlxuICAgICAgICAgICAgICAgIDxNYXBQaW4gY2xhc3NOYW1lPVwidy0zIGgtMyBmbGV4LXNocmluay0wXCIgLz5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LW1lZGl1bSBsaW5lLWNsYW1wLTFcIj57bGlzdGluZy5sb2NhdGlvbn08L3A+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwdC0xIGJvcmRlci10IGJvcmRlci1zbGF0ZS0yMDAgZGFyazpib3JkZXItc2xhdGUtODAwXCI+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1wcmltYXJ5LTYwMCBmb250LWJsYWNrIHRleHQtc21cIj57bGlzdGluZy5wcmljZX08L3A+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBiZy1wcmltYXJ5LTUwIGRhcms6YmctcHJpbWFyeS05MDAvMjAgcHgtMS41IHB5LTAuNSByb3VuZGVkLW1kXCI+XG4gICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTEgaC0xIHJvdW5kZWQtZnVsbCBiZy1wcmltYXJ5LTYwMCBhbmltYXRlLXB1bHNlXCIgLz5cbiAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs4cHhdIGZvbnQtYmxhY2sgdGV4dC1wcmltYXJ5LTYwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0XCI+QWN0aXZlPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L0luZm9XaW5kb3c+XG4gICAgICApfVxuICAgIDwvPlxuICApO1xufTtcblxuLy8gQ3VzdG9tIGludGVyYWN0aXZlIGRhc2hib2FyZCBvdmVybGF5cyBmb3Igcm90YXRpb24sIGVsZXZhdGlvbiB0aWx0ICgzRCksIGFuZCB6b29taW5nIGNvbnRyb2xzXG5jb25zdCBNYXBDb250cm9sc092ZXJsYXk6IFJlYWN0LkZDID0gKCkgPT4ge1xuICBjb25zdCBtYXAgPSB1c2VNYXAoKTtcbiAgY29uc3QgW2N1cnJlbnRUaWx0LCBzZXRDdXJyZW50VGlsdF0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgW2N1cnJlbnRIZWFkaW5nLCBzZXRDdXJyZW50SGVhZGluZ10gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgW21hcFR5cGUsIHNldE1hcFR5cGVdID0gdXNlU3RhdGUoJ3JvYWRtYXAnKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghbWFwKSByZXR1cm47XG4gICAgc2V0Q3VycmVudFRpbHQobWFwLmdldFRpbHQoKSB8fCAwKTtcbiAgICBzZXRDdXJyZW50SGVhZGluZyhtYXAuZ2V0SGVhZGluZygpIHx8IDApO1xuXG4gICAgY29uc3QgbGlzdGVuZXIgPSBtYXAuYWRkTGlzdGVuZXIoJ2lkbGUnLCAoKSA9PiB7XG4gICAgICBzZXRDdXJyZW50VGlsdChtYXAuZ2V0VGlsdCgpIHx8IDApO1xuICAgICAgc2V0Q3VycmVudEhlYWRpbmcobWFwLmdldEhlYWRpbmcoKSB8fCAwKTtcbiAgICAgIGNvbnN0IHR5cGUgPSBtYXAuZ2V0TWFwVHlwZUlkKCkgfHwgJ3JvYWRtYXAnO1xuICAgICAgc2V0TWFwVHlwZSh0eXBlKTtcbiAgICB9KTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBpZiAobGlzdGVuZXIpIGxpc3RlbmVyLnJlbW92ZSgpO1xuICAgIH07XG4gIH0sIFttYXBdKTtcblxuICBjb25zdCBoYW5kbGVNYXBUeXBlQ2hhbmdlID0gKHR5cGU6IHN0cmluZykgPT4ge1xuICAgIGlmICghbWFwKSByZXR1cm47XG4gICAgbWFwLnNldE1hcFR5cGVJZCh0eXBlKTtcbiAgICBzZXRNYXBUeXBlKHR5cGUpO1xuICB9O1xuXG4gIGNvbnN0IHRvZ2dsZVRpbHQgPSAoKSA9PiB7XG4gICAgaWYgKCFtYXApIHJldHVybjtcbiAgICBjb25zdCBuZXh0VGlsdCA9IGN1cnJlbnRUaWx0ID4gMTAgPyAwIDogNDU7XG4gICAgbWFwLnNldFRpbHQobmV4dFRpbHQpO1xuICAgIHNldEN1cnJlbnRUaWx0KG5leHRUaWx0KTtcbiAgICBpZiAobmV4dFRpbHQgPiAxMCkge1xuICAgICAgY29uc3QgY3VycmVudFpvb20gPSBtYXAuZ2V0Wm9vbSgpIHx8IDEyO1xuICAgICAgaWYgKGN1cnJlbnRab29tIDwgMTUuNSkge1xuICAgICAgICBtYXAuc2V0Wm9vbSgxNi41KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlUm90YXRlID0gKGRlZ3JlZXM6IG51bWJlcikgPT4ge1xuICAgIGlmICghbWFwKSByZXR1cm47XG4gICAgY29uc3QgbmV3SGVhZGluZyA9IChjdXJyZW50SGVhZGluZyArIGRlZ3JlZXMgKyAzNjApICUgMzYwO1xuICAgIG1hcC5zZXRIZWFkaW5nKG5ld0hlYWRpbmcpO1xuICAgIHNldEN1cnJlbnRIZWFkaW5nKG5ld0hlYWRpbmcpO1xuICB9O1xuXG4gIGNvbnN0IHJlc2V0Tm9ydGggPSAoKSA9PiB7XG4gICAgaWYgKCFtYXApIHJldHVybjtcbiAgICBtYXAuc2V0SGVhZGluZygwKTtcbiAgICBzZXRDdXJyZW50SGVhZGluZygwKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVab29tID0gKGFtb3VudDogbnVtYmVyKSA9PiB7XG4gICAgaWYgKCFtYXApIHJldHVybjtcbiAgICBjb25zdCB6b29tID0gbWFwLmdldFpvb20oKSB8fCAxMjtcbiAgICBtYXAuc2V0Wm9vbSh6b29tICsgYW1vdW50KTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICB7LyogMS4gbWluaW1hbCwgc2F0ZWxsaXRlLCAzZCBoeWJyaWQgbWFwIHRvZ2dsZSBjZW50ZXJlZCBhdCB0aGUgYm90dG9tICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBib3R0b20tNCBsZWZ0LTEvMiAtdHJhbnNsYXRlLXgtMS8yIHotMzAgcG9pbnRlci1ldmVudHMtYXV0b1wiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlLzk1IGRhcms6Ymctc2xhdGUtOTAwLzk1IGJhY2tkcm9wLWJsdXItbWQgcC0xIHJvdW5kZWQtMnhsIHNoYWRvdy14bCBib3JkZXItWzAuNXB4XSBib3JkZXItc2xhdGUtMjAwIGRhcms6Ym9yZGVyLVsjMGYxNzJiXSBob3Zlcjpib3JkZXItc2xhdGUtNDAwIGRhcms6aG92ZXI6Ym9yZGVyLXNsYXRlLTgwMCBmbGV4IGdhcC0xIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMFwiPlxuICAgICAgICAgIHtbXG4gICAgICAgICAgICB7IGlkOiAncm9hZG1hcCcsIGxhYmVsOiAnTWluaW1hbCcsIGljb246IDxNYXAgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjVcIiAvPiB9LFxuICAgICAgICAgICAgeyBpZDogJ3NhdGVsbGl0ZScsIGxhYmVsOiAnU2F0ZWxsaXRlJywgaWNvbjogPEdsb2JlIGNsYXNzTmFtZT1cInctMy41IGgtMy41XCIgLz4gfSxcbiAgICAgICAgICAgIHsgaWQ6ICdoeWJyaWQnLCBsYWJlbDogJzNEIEh5YnJpZCcsIGljb246IDxMYXllcnMgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjVcIiAvPiB9LFxuICAgICAgICAgIF0ubWFwKCh0eXBlKSA9PiAoXG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIGtleT17dHlwZS5pZH1cbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlTWFwVHlwZUNoYW5nZSh0eXBlLmlkKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBweC0zIHB5LTEuNSByb3VuZGVkLXhsIHRleHQtWzEwcHhdIGZvbnQtYmxhY2sgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMCAke21hcFR5cGUgPT09IHR5cGUuaWQgPyAnYmctcHJpbWFyeS02MDAgdGV4dC13aGl0ZSBzaGFkb3ctbGcgc2hhZG93LXByaW1hcnktNTAwLzIwIHNjYWxlLVsxLjAzXScgOiAndGV4dC1zbGF0ZS02MDAgZGFyazp0ZXh0LXNsYXRlLTQwMCBob3ZlcjpiZy1zbGF0ZS0xMDAgZGFyazpob3ZlcjpiZy1zbGF0ZS04MDAnfWB9XG4gICAgICAgICAgICAgIHRpdGxlPXtgU3dpdGNoIHRvICR7dHlwZS5sYWJlbH1gfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7dHlwZS5pY29ufVxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJoaWRkZW4gc206aW5saW5lXCI+e3R5cGUubGFiZWx9PC9zcGFuPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiAyLiB6b29tIGJ1dHRvbnMgdmVydGljYWxseSBjZW50ZXJlZCBvbiB0aGUgbGVmdCBvZiB0aGUgbWFwICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBsZWZ0LTQgdG9wLTEvMiAtdHJhbnNsYXRlLXktMS8yIHotMzAgcG9pbnRlci1ldmVudHMtYXV0b1wiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlLzk1IGRhcms6Ymctc2xhdGUtOTAwLzk1IGJhY2tkcm9wLWJsdXItbWQgcC0xLjUgcm91bmRlZC0yeGwgc2hhZG93LXhsIGJvcmRlci1bMC41cHhdIGJvcmRlci1zbGF0ZS0yMDAgZGFyazpib3JkZXItWyMwZjE3MmJdIGhvdmVyOmJvcmRlci1zbGF0ZS00MDAgZGFyazpob3Zlcjpib3JkZXItc2xhdGUtODAwIGZsZXggZmxleC1jb2wgZ2FwLTEgaXRlbXMtY2VudGVyIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMFwiPlxuICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVab29tKDEpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy04IGgtOCByb3VuZGVkLXhsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGZvbnQtYm9sZCB0ZXh0LXNtIHRleHQtc2xhdGUtNzAwIGRhcms6dGV4dC1zbGF0ZS0zMDAgaG92ZXI6Ymctc2xhdGUtMTAwIGRhcms6aG92ZXI6Ymctc2xhdGUtODAwIHRyYW5zaXRpb24tY29sb3JzIGN1cnNvci1wb2ludGVyXCJcbiAgICAgICAgICAgIHRpdGxlPVwiWm9vbSBJblwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAg77yLXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTUgaC1weCBiZy1zbGF0ZS0yMDAgZGFyazpiZy1zbGF0ZS04MDBcIiAvPlxuICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVab29tKC0xKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInctOCBoLTggcm91bmRlZC14bCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBmb250LWJvbGQgdGV4dC1zbSB0ZXh0LXNsYXRlLTcwMCBkYXJrOnRleHQtc2xhdGUtMzAwIGhvdmVyOmJnLXNsYXRlLTEwMCBkYXJrOmhvdmVyOmJnLXNsYXRlLTgwMCB0cmFuc2l0aW9uLWNvbG9ycyBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICB0aXRsZT1cIlpvb20gT3V0XCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICDvvI1cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8Lz5cbiAgKTtcbn07XG5cbi8vIEF1dG8tY2VudGVycyBhbmQgem9vbXMgdGhlIG1hcCBjb21mb3J0YWJseSBvbiB0aGUgYWN0aXZlIGxpc3RpbmdzIHNvIHVzZXJzIGFyZW4ndCBsZWZ0IGluIHRoZSBMYWdvb25cbmNvbnN0IE1hcENlbnRlcmluZ0NvbnRyb2xsZXI6IFJlYWN0LkZDPHsgbGlzdGluZ3M6IExpc3RpbmdbXSB9PiA9ICh7IGxpc3RpbmdzIH0pID0+IHtcbiAgY29uc3QgbWFwID0gdXNlTWFwKCk7XG5cbiAgY29uc3QgbGlzdGluZ3NIYXNoID0gbGlzdGluZ3MubWFwKGwgPT4gbC5pZCkuam9pbignLCcpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghbWFwIHx8IGxpc3RpbmdzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gICAgLy8gRmluZCBmaXJzdCBsaXN0aW5nIHdpdGggdmFsaWQgbGF0L2xuZyBjb29yZGluYXRlc1xuICAgIGNvbnN0IGZpcnN0V2l0aENvb3JkcyA9IGxpc3RpbmdzLmZpbmQobCA9PiBcbiAgICAgIHR5cGVvZiBsLmxhdGl0dWRlID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgbC5sb25naXR1ZGUgPT09ICdudW1iZXInICYmIGwubGF0aXR1ZGUgIT09IDAgJiYgbC5sb25naXR1ZGUgIT09IDBcbiAgICApO1xuXG4gICAgaWYgKGZpcnN0V2l0aENvb3JkcyAmJiBmaXJzdFdpdGhDb29yZHMubGF0aXR1ZGUgJiYgZmlyc3RXaXRoQ29vcmRzLmxvbmdpdHVkZSkge1xuICAgICAgbWFwLnBhblRvKHsgbGF0OiBmaXJzdFdpdGhDb29yZHMubGF0aXR1ZGUsIGxuZzogZmlyc3RXaXRoQ29vcmRzLmxvbmdpdHVkZSB9KTtcbiAgICAgIGlmICgobWFwLmdldFpvb20oKSB8fCAwKSA8IDEzKSB7XG4gICAgICAgIG1hcC5zZXRab29tKDE0LjUpO1xuICAgICAgfVxuICAgIH1cbiAgfSwgW21hcCwgbGlzdGluZ3NIYXNoXSk7XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5cbmNvbnN0IEhvbWUgPSAoKSA9PiB7XG4gIGNvbnN0IFtzZWFyY2hRdWVyeSwgc2V0U2VhcmNoUXVlcnldID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbYWN0aXZlRmlsdGVyLCBzZXRBY3RpdmVGaWx0ZXJdID0gdXNlU3RhdGUoJ0FsbCcpO1xuICBjb25zdCBbbWF4QnVkZ2V0LCBzZXRNYXhCdWRnZXRdID0gdXNlU3RhdGUoMTAwMDAwMDAwMCk7IC8vIFNldCB0byBtYXggaW5pdGlhbGx5XG4gIGNvbnN0IFtpc1ByaWNlRWRpdGFibGUsIHNldElzUHJpY2VFZGl0YWJsZV0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtwcmljZUlucHV0VmFsLCBzZXRQcmljZUlucHV0VmFsXSA9IHVzZVN0YXRlKFwiMTAwMDAwMDAwMFwiKTtcbiAgY29uc3QgW3Nob3dGaWx0ZXJzLCBzZXRTaG93RmlsdGVyc10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtkYkxpc3RpbmdzLCBzZXREYkxpc3RpbmdzXSA9IHVzZVN0YXRlPExpc3RpbmdbXT4oW10pO1xuICBjb25zdCBbaXNNYXBWaWV3LCBzZXRJc01hcFZpZXddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCB7IHVzZXIsIHNldEN1cnJlbnRMaXN0aW5nLCBzZXRBY3RpdmVUYWIgfSA9IHVzZUF1dGgoKTtcbiAgY29uc3QgW2xvZ29GYWlsZWQsIHNldExvZ29GYWlsZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbaXRlbXNMb2FkZWQsIHNldEl0ZW1zTG9hZGVkXSA9IHVzZVN0YXRlKDEyKTtcbiAgY29uc3Qgc2Nyb2xsUmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgY29uc3Qgc2VudGluZWxSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBbaXNEYXJrLCBzZXRJc0RhcmtdID0gdXNlU3RhdGUoKCkgPT4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnZGFyaycpKTtcblxuICAvLyBBdXRvLXNlZWRlciByZW1vdmVkIGR1ZSB0byBwZXJtaXNzaW9ucyBpc3N1ZXMgYW5kIHN0YXRpYyBtZXJnZVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PiB7XG4gICAgICBzZXRJc0RhcmsoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnZGFyaycpKTtcbiAgICB9KTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBhdHRyaWJ1dGVGaWx0ZXI6IFsnY2xhc3MnXSB9KTtcbiAgICByZXR1cm4gKCkgPT4gb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICB9LCBbXSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBzZXRJdGVtc0xvYWRlZCgxMik7IC8vIFJlc2V0IHdoZW4gZmlsdGVycyBjaGFuZ2VcbiAgfSwgW3NlYXJjaFF1ZXJ5LCBhY3RpdmVGaWx0ZXIsIG1heEJ1ZGdldF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoKGVudHJpZXMpID0+IHtcbiAgICAgIGlmIChlbnRyaWVzWzBdLmlzSW50ZXJzZWN0aW5nKSB7XG4gICAgICAgIHNldEl0ZW1zTG9hZGVkKHByZXYgPT4gcHJldiArIDEyKTtcbiAgICAgIH1cbiAgICB9LCB7IHJvb3RNYXJnaW46ICcyMDBweCcgfSk7XG5cbiAgICBpZiAoc2VudGluZWxSZWYuY3VycmVudCkge1xuICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShzZW50aW5lbFJlZi5jdXJyZW50KTtcbiAgICB9XG4gICAgcmV0dXJuICgpID0+IG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgfSwgW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgbGlzdGluZ3NSZWYgPSBjb2xsZWN0aW9uKGRiLCAnbGlzdGluZ3MnKTtcbiAgICBjb25zdCBxID0gcXVlcnkobGlzdGluZ3NSZWYpO1xuXG4gICAgY29uc3QgdW5zdWJzY3JpYmUgPSBvblNuYXBzaG90KHEsIChzbmFwc2hvdCkgPT4ge1xuICAgICAgY29uc3QgZmV0Y2hlZCA9IHNuYXBzaG90LmRvY3MubWFwKGRvYyA9PiAoe1xuICAgICAgICAuLi5kb2MuZGF0YSgpLFxuICAgICAgICBpZDogZG9jLmlkIGFzIGFueVxuICAgICAgfSBhcyBMaXN0aW5nKSkuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICBjb25zdCBkYXRlQSA9IGEuY3JlYXRlZEF0Py5zZWNvbmRzIHx8IDA7XG4gICAgICAgIGNvbnN0IGRhdGVCID0gYi5jcmVhdGVkQXQ/LnNlY29uZHMgfHwgMDtcbiAgICAgICAgcmV0dXJuIGRhdGVCIC0gZGF0ZUE7XG4gICAgICB9KTtcbiAgICAgIHNldERiTGlzdGluZ3MoZmV0Y2hlZCk7XG4gICAgfSwgKGVycm9yKSA9PiB7XG4gICAgICBoYW5kbGVGaXJlc3RvcmVFcnJvcihlcnJvciwgT3BlcmF0aW9uVHlwZS5HRVQsICdsaXN0aW5ncycpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuICgpID0+IHVuc3Vic2NyaWJlKCk7XG4gIH0sIFtdKTtcblxuICBjb25zdCBpc0FnZW50ID0gdXNlcj8ucm9sZSA9PT0gJ2FnZW50JztcblxuICBjb25zdCBmaWx0ZXJzID0gWydBbGwnLCAnU2VsZi1Db250YWluJywgJzEgQmVkcm9vbSBGbGF0JywgJ1NoYXJlZCddO1xuXG4gIGNvbnN0IGZpbHRlcmVkTGlzdGluZ3MgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBsZXQgYmFzZUxpc3RpbmdzID0gZGJMaXN0aW5ncy5maWx0ZXIobCA9PiBsLnN0YXR1cyAhPT0gJ3N1c3BlbmRlZCcgJiYgbC5zdGF0dXMgIT09ICdjb21wbGV0ZWQnKTtcbiAgICBcbiAgICAvLyBGaWx0ZXIgYmFzZWQgb24gdXNlciByb2xlIGFuZCBhcHByb3ZhbCBzdGF0dXNcbiAgICBpZiAoaXNBZ2VudCAmJiB1c2VyKSB7XG4gICAgICAvLyBBZ2VudHMgT05MWSBzZWUgdGhlaXIgT1dOIGFwcHJvdmVkIGxpc3RpbmdzIG9uIEhvbWVcbiAgICAgIGJhc2VMaXN0aW5ncyA9IGJhc2VMaXN0aW5ncy5maWx0ZXIobCA9PiBcbiAgICAgICAgbC5hZ2VudD8uaWQgJiYgU3RyaW5nKGwuYWdlbnQuaWQpID09PSBTdHJpbmcodXNlci5pZCkgJiYgKGwuaXNBcHByb3ZlZCA9PT0gdHJ1ZSB8fCBsLmlzQXBwcm92ZWQgPT09IHVuZGVmaW5lZClcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRlbmFudHMgc2VlIGFwcHJvdmVkIERCIGxpc3RpbmdzXG4gICAgICAvLyBVc2luZyBhIG1vcmUgcm9idXN0IGNoZWNrIGZvciBpc0FwcHJvdmVkXG4gICAgICBiYXNlTGlzdGluZ3MgPSBiYXNlTGlzdGluZ3MuZmlsdGVyKGwgPT4ge1xuICAgICAgICBjb25zdCBhcHByb3ZlZCA9IGwuaXNBcHByb3ZlZCA9PT0gdHJ1ZSB8fCBTdHJpbmcobC5pc0FwcHJvdmVkKSA9PT0gJ3RydWUnIHx8IGwuaXNBcHByb3ZlZCA9PT0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gYXBwcm92ZWQ7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gYmFzZUxpc3RpbmdzLmZpbHRlcihsaXN0aW5nID0+IHtcbiAgICAgIGNvbnN0IHF1ZXJ5U3RyID0gc2VhcmNoUXVlcnkudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gICAgICBjb25zdCBtYXRjaGVzU2VhcmNoID0gbGlzdGluZy50aXRsZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5U3RyKSB8fCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0aW5nLmxvY2F0aW9uLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocXVlcnlTdHIpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGxpc3RpbmcucHJpY2UgJiYgbGlzdGluZy5wcmljZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5U3RyKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAobGlzdGluZy5hcmVhICYmIGxpc3RpbmcuYXJlYS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5U3RyKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAobGlzdGluZy5sYW5kbWFyayAmJiBsaXN0aW5nLmxhbmRtYXJrLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocXVlcnlTdHIpKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChsaXN0aW5nLmFnZW50Py5uYW1lICYmIGxpc3RpbmcuYWdlbnQubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5U3RyKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAobGlzdGluZy5hbWVuaXRpZXMgfHwgW10pLnNvbWUoYSA9PiBhLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocXVlcnlTdHIpKTtcbiAgICAgIGNvbnN0IG1hdGNoZXNGaWx0ZXIgPSBhY3RpdmVGaWx0ZXIgPT09ICdBbGwnIHx8IGxpc3RpbmcudHlwZSA9PT0gYWN0aXZlRmlsdGVyO1xuICAgICAgY29uc3QgbWF0Y2hlc0J1ZGdldCA9IGxpc3RpbmcucHJpY2VWYWx1ZSA8PSBtYXhCdWRnZXQ7XG4gICAgICByZXR1cm4gbWF0Y2hlc1NlYXJjaCAmJiBtYXRjaGVzRmlsdGVyICYmIG1hdGNoZXNCdWRnZXQ7XG4gICAgfSk7XG4gIH0sIFtzZWFyY2hRdWVyeSwgYWN0aXZlRmlsdGVyLCBtYXhCdWRnZXQsIGlzQWdlbnQsIHVzZXI/LmlkLCBkYkxpc3RpbmdzXSk7XG5cbiAgY29uc3QgdmlzaWJsZUxpc3RpbmdzID0gdXNlTWVtbygoKSA9PiBmaWx0ZXJlZExpc3RpbmdzLnNsaWNlKDAsIGl0ZW1zTG9hZGVkKSwgW2ZpbHRlcmVkTGlzdGluZ3MsIGl0ZW1zTG9hZGVkXSk7XG5cbiAgY29uc3QgY2xlYXJGaWx0ZXJzID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIHNldFNlYXJjaFF1ZXJ5KCcnKTtcbiAgICBzZXRBY3RpdmVGaWx0ZXIoJ0FsbCcpO1xuICAgIHNldE1heEJ1ZGdldCgxMDAwMDAwMDAwKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IGhhbmRsZURlbGV0ZSA9IFJlYWN0LnVzZUNhbGxiYWNrKGFzeW5jIChsaXN0aW5nSWQ6IHN0cmluZyB8IG51bWJlcikgPT4ge1xuICAgIGNvbnN0IGlkU3RyID0gU3RyaW5nKGxpc3RpbmdJZCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHB1cmdlTGlzdGluZ0RhdGEoaWRTdHIpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBoYW5kbGVGaXJlc3RvcmVFcnJvcihlcnJvciwgT3BlcmF0aW9uVHlwZS5ERUxFVEUsIGBsaXN0aW5ncy8ke2lkU3RyfWApO1xuICAgIH1cbiAgfSwgW10pO1xuXG4gIGNvbnN0IFtpc1NhdmluZ1NlYXJjaCwgc2V0SXNTYXZpbmdTZWFyY2hdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGhhbmRsZVNhdmVTZWFyY2ggPSBSZWFjdC51c2VDYWxsYmFjayhhc3luYyAoKSA9PiB7XG4gICAgaWYgKCF1c2VyKSByZXR1cm47XG4gICAgc2V0SXNTYXZpbmdTZWFyY2godHJ1ZSk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGFkZERvYyhjb2xsZWN0aW9uKGRiLCAnc2F2ZWRfc2VhcmNoZXMnKSwge1xuICAgICAgICB1c2VySWQ6IHVzZXIuaWQsXG4gICAgICAgIHF1ZXJ5OiBzZWFyY2hRdWVyeSxcbiAgICAgICAgdHlwZTogYWN0aXZlRmlsdGVyLFxuICAgICAgICBtYXhQcmljZTogbWF4QnVkZ2V0LFxuICAgICAgICBjcmVhdGVkQXQ6IHNlcnZlclRpbWVzdGFtcCgpXG4gICAgICB9KTtcbiAgICAgIC8vIFRyaWdnZXIgYSBsb2NhbCBub3RpZmljYXRpb24gb3IgdG9hc3RcbiAgICAgIGFsZXJ0KCdTZWFyY2ggYWxlcnQgc2F2ZWQhIFdlIHdpbGwgbm90aWZ5IHlvdSB3aGVuIG1hdGNoaW5nIHByb3BlcnRpZXMgYXJlIHBvc3RlZC4nKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaGFuZGxlRmlyZXN0b3JlRXJyb3IoZXJyb3IsIE9wZXJhdGlvblR5cGUuV1JJVEUsICdzYXZlZF9zZWFyY2hlcycpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRJc1NhdmluZ1NlYXJjaChmYWxzZSk7XG4gICAgfVxuICB9LCBbdXNlciwgc2VhcmNoUXVlcnksIGFjdGl2ZUZpbHRlciwgbWF4QnVkZ2V0XSk7XG5cbiAgY29uc3Qgc2hvd1NhdmVTZWFyY2ggPSAhaXNBZ2VudCAmJiAoc2VhcmNoUXVlcnkgfHwgYWN0aXZlRmlsdGVyICE9PSAnQWxsJyB8fCBtYXhCdWRnZXQgPCAxMDAwMDAwMDAwKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLWgtc2NyZWVuIGJnLXNsYXRlLTUwIGRhcms6Ymctc2xhdGUtOTUwIHRyYW5zaXRpb24tY29sb3JzIGR1cmF0aW9uLTMwMFwiPlxuICAgICAgey8qIDFzdCBwYXJ0OiBtb2JpbGUgc3RpY2t5IGhlYWRlciAqL31cbiAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPXtgc3RpY2t5IHRvcC0wIHotNTAgYmctd2hpdGUvODAgZGFyazpiZy1zbGF0ZS05MDAvODAgYmFja2Ryb3AtYmx1ci1tZCBib3JkZXItYiBib3JkZXItc2xhdGUtMjAwIGRhcms6Ym9yZGVyLXNsYXRlLTgwMCBsZzpoaWRkZW4gcHgtNCBoLTE2IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbmB9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgPEhhbWJ1cmdlckJ1dHRvbiAvPlxuICAgICAgICAgIHshbG9nb0ZhaWxlZCA/IChcbiAgICAgICAgICAgIDxpbWcgXG4gICAgICAgICAgICAgIHNyYz17aXNEYXJrID8gJy9sb2dvLWRhcmsucG5nJyA6ICcvbG9nby1saWdodC5wbmcnfSBcbiAgICAgICAgICAgICAgb25FcnJvcj17KCkgPT4gc2V0TG9nb0ZhaWxlZCh0cnVlKX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaC05IHctYXV0byBvYmplY3QtY29udGFpbiBtYXgtdy1bMTIwcHhdXCJcbiAgICAgICAgICAgICAgYWx0PVwiRGlyZWN0UmVudFwiXG4gICAgICAgICAgICAgIHJlZmVycmVyUG9saWN5PVwibm8tcmVmZXJyZXJcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTcgaC03IHNtOnctOCBzbTpoLTggYmctcHJpbWFyeS02MDAgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgIDxIb21lSWNvbiBjbGFzc05hbWU9XCJ0ZXh0LXdoaXRlIHctMy41IGgtMy41IHNtOnctNCBzbTpoLTRcIiAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSBzbTp0ZXh0LWJhc2UgZm9udC1kaXNwbGF5IGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTkwMCBkYXJrOnRleHQtd2hpdGUgdHJhY2tpbmctdGlnaHRcIj5EaXJlY3Q8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXByaW1hcnktNjAwXCI+UmVudDwvc3Bhbj48L3NwYW4+XG4gICAgICAgICAgICA8Lz5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgIHshaXNBZ2VudCAmJiAoXG4gICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRJc01hcFZpZXcoIWlzTWFwVmlldyl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHAtMiByb3VuZGVkLWZ1bGwgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgJHtpc01hcFZpZXcgPyAnYmctcHJpbWFyeS02MDAgdGV4dC13aGl0ZSBzaGFkb3ctbGcgc2hhZG93LXByaW1hcnktNTAwLzIwJyA6ICdob3ZlcjpiZy1zbGF0ZS01MCBkYXJrOmhvdmVyOmJnLXNsYXRlLTgwMCB0ZXh0LXNsYXRlLTYwMCBkYXJrOnRleHQtc2xhdGUtNDAwJ31gfVxuICAgICAgICAgICAgICB0aXRsZT17aXNNYXBWaWV3ID8gXCJTd2l0Y2ggdG8gR3JpZCBWaWV3XCIgOiBcIlN3aXRjaCB0byBNYXAgVmlld1wifVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7aXNNYXBWaWV3ID8gPExheW91dEdyaWQgY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+IDogPE1hcCBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz59XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVUYWIoJ25vdGlmaWNhdGlvbnMnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiByZWxhdGl2ZSBob3ZlcjpiZy1zbGF0ZS01MCBkYXJrOmhvdmVyOmJnLXNsYXRlLTgwMCByb3VuZGVkLWZ1bGwgdHJhbnNpdGlvbi1jb2xvcnMgZ3JvdXBcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxCZWxsIGNsYXNzTmFtZT1cInctNSBoLTUgdGV4dC1zbGF0ZS02MDAgZGFyazp0ZXh0LXNsYXRlLTQwMCBncm91cC1ob3Zlcjp0ZXh0LXByaW1hcnktNjAwIHRyYW5zaXRpb24tY29sb3JzXCIgLz5cbiAgICAgICAgICAgIDxOb3RpZmljYXRpb25CYWRnZSAvPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvaGVhZGVyPlxuXG4gICAgICB7LyogMm5kIHBhcnQ6IGRlc2t0b3AgcG9ydGFsZWQgaGVhZGVyICovfVxuICAgICAgPEhlYWRlclBvcnRhbD5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRkZW4gbGc6ZmxleCBmbGV4LTEgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBweC02IGgtZnVsbFwiPlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJsYWNrIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgdGV4dC1wcmltYXJ5LTYwMCBsZWFkaW5nLW5vbmVcIj5GaW5kIFlvdXIgU3BhY2U8L3NwYW4+XG4gICAgICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LWRpc3BsYXkgZm9udC1ibGFjayB0ZXh0LXNsYXRlLTkwMCBkYXJrOnRleHQtd2hpdGUgdHJhY2tpbmctdGlnaHQgbXQtMC41XCI+XG4gICAgICAgICAgICAgIEV4cGxvcmUgSG91c2VzXG4gICAgICAgICAgICA8L2gxPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTRcIj5cbiAgICAgICAgICAgIHshaXNBZ2VudCAmJiAoXG4gICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNNYXBWaWV3KCFpc01hcFZpZXcpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHAtMiByb3VuZGVkLWZ1bGwgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgJHtpc01hcFZpZXcgPyAnYmctcHJpbWFyeS02MDAgdGV4dC13aGl0ZSBzaGFkb3ctbGcgc2hhZG93LXByaW1hcnktNTAwLzIwJyA6ICdob3ZlcjpiZy1zbGF0ZS01MCBkYXJrOmhvdmVyOmJnLXNsYXRlLTgwMCB0ZXh0LXNsYXRlLTYwMCBkYXJrOnRleHQtc2xhdGUtNDAwJ31gfVxuICAgICAgICAgICAgICAgIHRpdGxlPXtpc01hcFZpZXcgPyBcIlN3aXRjaCB0byBHcmlkIFZpZXdcIiA6IFwiU3dpdGNoIHRvIE1hcCBWaWV3XCJ9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNYXBWaWV3ID8gPExheW91dEdyaWQgY2xhc3NOYW1lPVwidy01IGgtNVwiIC8+IDogPE1hcCBjbGFzc05hbWU9XCJ3LTUgaC01XCIgLz59XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L0hlYWRlclBvcnRhbD5cblxuICAgICAgPG1haW4gY2xhc3NOYW1lPVwicHgtWzE0cHhdIHBiLVsxNXB4XSBtYi0wXCIgc3R5bGU9e3sgcGFkZGluZ1RvcDogJzE1cHgnIH19PlxuICAgICAgICA8bW90aW9uLmRpdiBcbiAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDEwIH19IFxuICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeTogMCB9fSBcbiAgICAgICAgICBleGl0PXt7IG9wYWNpdHk6IDAsIHk6IC0xMCB9fSBcbiAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgc3BhY2UteS00IHNtOnNwYWNlLXktNlwiXG4gICAgICAgID5cbiAgICAgICAgICB7LyogU2VhcmNoIGFuZCBBZHZhbmNlZCBGaWx0ZXIgU2VjdGlvbiAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNCBzbTpzcGFjZS15LTZcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBncm91cFwiPlxuICAgICAgICAgIDxTZWFyY2ggY2xhc3NOYW1lPVwiYWJzb2x1dGUgbGVmdC00IHRvcC0xLzIgLXRyYW5zbGF0ZS15LTEvMiB3LTQgaC00IHNtOnctNC41IHNtOmgtNC41IHRleHQtc2xhdGUtNDAwIGdyb3VwLWZvY3VzLXdpdGhpbjp0ZXh0LXByaW1hcnktNTAwIHRyYW5zaXRpb24tYWxsXCIgLz5cbiAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICB0eXBlPVwidGV4dFwiIFxuICAgICAgICAgICAgcGxhY2Vob2xkZXI9e2lzQWdlbnQgPyBcIlNlYXJjaCBieSBhcmVhLCBsYW5kbWFyaywgb3IgcHJpY2UuLi5cIiA6IFwiU2VhcmNoIGJ5IGFyZWEsIGxhbmRtYXJrLCBwcmljZSwgb3IgYWdlbnQgbmFtZS4uLlwifSBcbiAgICAgICAgICAgIHZhbHVlPXtzZWFyY2hRdWVyeX1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0U2VhcmNoUXVlcnkoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLXdoaXRlIGRhcms6Ymctc2xhdGUtOTAwIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIGRhcms6Ym9yZGVyLXNsYXRlLTgwMCByb3VuZGVkLXhsIHNtOnJvdW5kZWQtMnhsIHB5LTMgc206cHktNCBwbC0xMCBzbTpwbC0xMiBwci00IG91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItcHJpbWFyeS00MDAgZm9jdXM6cmluZy00IGZvY3VzOnJpbmctcHJpbWFyeS01MDAvMTAgdHJhbnNpdGlvbi1hbGwgdGV4dC14cyBzbTp0ZXh0LXNtIHNoYWRvdy1zbSBwbGFjZWhvbGRlcjp0ZXh0LXNsYXRlLTMwMCBkYXJrOnBsYWNlaG9sZGVyOnRleHQtc2xhdGUtNjAwIGRhcms6dGV4dC13aGl0ZVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICBzZXRTaG93RmlsdGVycyghc2hvd0ZpbHRlcnMpO1xuICAgICAgICAgICAgICBpZiAoIXNob3dGaWx0ZXJzICYmIHdpbmRvdy5uYXZpZ2F0b3IgJiYgd2luZG93Lm5hdmlnYXRvci52aWJyYXRlKSB7XG4gICAgICAgICAgICAgICAgd2luZG93Lm5hdmlnYXRvci52aWJyYXRlKDEwKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGFic29sdXRlIHJpZ2h0LTIgc206cmlnaHQtMyB0b3AtMS8yIC10cmFuc2xhdGUteS0xLzIgcC0xLjUgc206cC0yIHJvdW5kZWQtbGcgc206cm91bmRlZC0yeGwgdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXIgJHtzaG93RmlsdGVycyA/ICdiZy1wcmltYXJ5LTYwMCB0ZXh0LXdoaXRlIHNoYWRvdy1sZyBzaGFkb3ctcHJpbWFyeS01MDAvMjAnIDogJ2JnLXNsYXRlLTEwMCBkYXJrOmJnLXNsYXRlLTgwMCB0ZXh0LXNsYXRlLTUwMCBkYXJrOnRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtc2xhdGUtOTAwIGRhcms6aG92ZXI6dGV4dC13aGl0ZSd9YH1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8U2V0dGluZ3MyIGNsYXNzTmFtZT1cInctMy41IGgtMy41IHNtOnctNCBzbTpoLTRcIiAvPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8QW5pbWF0ZVByZXNlbmNlPlxuICAgICAgICAgIHtzaG93RmlsdGVycyAmJiAoXG4gICAgICAgICAgICA8bW90aW9uLmRpdiBcbiAgICAgICAgICAgICAgaW5pdGlhbD17eyBoZWlnaHQ6IDAsIG9wYWNpdHk6IDAgfX1cbiAgICAgICAgICAgICAgYW5pbWF0ZT17eyBoZWlnaHQ6ICdhdXRvJywgb3BhY2l0eTogMSB9fVxuICAgICAgICAgICAgICBleGl0PXt7IGhlaWdodDogMCwgb3BhY2l0eTogMCB9fVxuICAgICAgICAgICAgICB0cmFuc2l0aW9uPXt7IGR1cmF0aW9uOiAwLjMsIGVhc2U6ICdlYXNlSW5PdXQnIH19XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLXdoaXRlIGRhcms6Ymctc2xhdGUtOTAwIHAtNCBzbTpwLTYgcm91bmRlZC14bCBzbTpyb3VuZGVkLTJ4bCBib3JkZXItWzAuNXB4XSBib3JkZXItc2xhdGUtMjAwIGRhcms6Ym9yZGVyLVsjMGYxNzJiXSBob3Zlcjpib3JkZXItc2xhdGUtNDAwIGRhcms6aG92ZXI6Ym9yZGVyLXNsYXRlLTgwMCBzaGFkb3cteGwgc2hhZG93LXNsYXRlLTIwMC8yMCBkYXJrOnNoYWRvdy1ibGFjay8yMCBzcGFjZS15LTQgc206c3BhY2UteS02IG92ZXJmbG93LWhpZGRlbiB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0zNTBcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTMgc206Z2FwLTRcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cInRleHQtWzlweF0gc206dGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtNDAwIGRhcms6dGV4dC1zbGF0ZS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdFwiPlByb3BlcnR5IFR5cGU8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgeyhzZWFyY2hRdWVyeSB8fCBhY3RpdmVGaWx0ZXIgIT09ICdBbGwnIHx8IG1heEJ1ZGdldCA8IDEwMDAwMDAwMDApICYmIChcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtjbGVhckZpbHRlcnN9IGNsYXNzTmFtZT1cInRleHQtWzlweF0gc206dGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtcm9zZS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBob3Zlcjp0ZXh0LXJvc2UtNjAwIHRyYW5zaXRpb24tY29sb3JzIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPEZpbHRlclggY2xhc3NOYW1lPVwidy0zIGgtM1wiIC8+IFJlc2V0XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgc206Z2FwLTIgb3ZlcmZsb3cteC1hdXRvIHBiLTIgc2Nyb2xsYmFyLW5vbmVcIj5cbiAgICAgICAgICAgICAgICAgIHtmaWx0ZXJzLm1hcChmaWx0ZXIgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgICAgIGtleT17YGZpbHRlci0ke2ZpbHRlcn1gfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEFjdGl2ZUZpbHRlcihmaWx0ZXIpfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgc206cHgtNSBweS0yIHNtOnB5LTIuNSByb3VuZGVkLWxnIHNtOnJvdW5kZWQtMnhsIHRleHQtWzEwcHhdIHNtOnRleHQteHMgZm9udC1ib2xkIHdoaXRlc3BhY2Utbm93cmFwIHRyYW5zaXRpb24tYWxsIGJvcmRlciBjdXJzb3ItcG9pbnRlciAke2FjdGl2ZUZpbHRlciA9PT0gZmlsdGVyID8gJ2JnLXByaW1hcnktNjAwIHRleHQtd2hpdGUgYm9yZGVyLXByaW1hcnktNjAwIHNoYWRvdy1sZyBzaGFkb3ctcHJpbWFyeS01MDAvMjAnIDogJ2JnLXNsYXRlLTUwIGRhcms6Ymctc2xhdGUtODAwIHRleHQtc2xhdGUtNTAwIGRhcms6dGV4dC1zbGF0ZS00MDAgYm9yZGVyLXNsYXRlLTIwMCBkYXJrOmJvcmRlci1zbGF0ZS03MDAgaG92ZXI6Ym9yZGVyLXNsYXRlLTQwMCBkYXJrOmhvdmVyOmJvcmRlci1zbGF0ZS01NTUnfWB9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICB7ZmlsdGVyfVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMyBzbTpzcGFjZS15LTRcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBweC0xXCI+XG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwidGV4dC1bOXB4XSBzbTp0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1zbGF0ZS00MDAgZGFyazp0ZXh0LXNsYXRlLTUwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0XCI+UHJpY2U8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHNtOnRleHQtc20gZm9udC1ib2xkIHRleHQtcHJpbWFyeS02MDAgZGFyazp0ZXh0LXByaW1hcnktNDAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gb3BhY2l0eS02MFwiPlVQIFRPPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICB7aXNQcmljZUVkaXRhYmxlID8gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgYm9yZGVyLWIgYm9yZGVyLXByaW1hcnktNTAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzXCI+4oKmPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTI0IGJnLXRyYW5zcGFyZW50IG91dGxpbmUtbm9uZSB0ZXh0LXhzIHRleHQtcHJpbWFyeS02MDUgZGFyazp0ZXh0LXByaW1hcnktNDAwIGZvbnQtZXh0cmFib2xkIGZvY3VzOnJpbmctMCBwLTAgYm9yZGVyLW5vbmVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17cHJpY2VJbnB1dFZhbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRQcmljZUlucHV0VmFsKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0SXNQcmljZUVkaXRhYmxlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUludChwcmljZUlucHV0VmFsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTmFOKHBhcnNlZCkgJiYgcGFyc2VkID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldE1heEJ1ZGdldChNYXRoLm1pbihwYXJzZWQsIDEwMDAwMDAwMDApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldElzUHJpY2VFZGl0YWJsZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUludChwcmljZUlucHV0VmFsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNOYU4ocGFyc2VkKSAmJiBwYXJzZWQgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRNYXhCdWRnZXQoTWF0aC5taW4ocGFyc2VkLCAxMDAwMDAwMDAwKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldFByaWNlSW5wdXRWYWwobWF4QnVkZ2V0LnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRJc1ByaWNlRWRpdGFibGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiY3Vyc29yLXBvaW50ZXIgaG92ZXI6dW5kZXJsaW5lIHVuZGVybGluZS1vZmZzZXQtMiBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMC41XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiQ2xpY2sgdG8gZWRpdCB2YWx1ZSBtYW51YWxseVwiXG4gICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAg4oKme21heEJ1ZGdldC50b0xvY2FsZVN0cmluZygpfSA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs4cHhdIGZvbnQtbm9ybWFsIG9wYWNpdHktNTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1wcmltYXJ5LTUwNVwiPihlZGl0KTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgICB0eXBlPVwicmFuZ2VcIiBcbiAgICAgICAgICAgICAgICAgIG1pbj1cIjBcIiBcbiAgICAgICAgICAgICAgICAgIG1heD1cIjEwMDAwMDAwMDBcIiBcbiAgICAgICAgICAgICAgICAgIHN0ZXA9XCI1MDAwMDBcIlxuICAgICAgICAgICAgICAgICAgdmFsdWU9e21heEJ1ZGdldH1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBwYXJzZUludChlLnRhcmdldC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHNldE1heEJ1ZGdldCh2YWwpO1xuICAgICAgICAgICAgICAgICAgICBzZXRQcmljZUlucHV0VmFsKHZhbC50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC0xLjUgc206aC0yIGJnLXNsYXRlLTEwMCBkYXJrOmJnLXNsYXRlLTgwMCByb3VuZGVkLWxnIGFwcGVhcmFuY2Utbm9uZSBjdXJzb3ItcG9pbnRlciBhY2NlbnQtcHJpbWFyeS02MDBcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktYmV0d2VlbiB0ZXh0LVs4cHhdIHNtOnRleHQtWzlweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtMzAwIGRhcms6dGV4dC1zbGF0ZS02MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIHB4LTFcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPuKCpjA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj7igqY1TTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPuKCpjUwME08L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj7igqYxQis8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9tb3Rpb24uZGl2PlxuICAgICAgICAgICl9XG4gICAgICAgIDwvQW5pbWF0ZVByZXNlbmNlPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHByLTBcIj5cbiAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQtYmFzZSBzbTp0ZXh0LXhsIGZvbnQtZGlzcGxheSBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDAgZGFyazp0ZXh0LXdoaXRlIHRyYWNraW5nLXRpZ2h0XCI+XG4gICAgICAgICAge2lzQWdlbnQgPyAnWW91ciBMaXN0aW5ncycgOiAnQXZhaWxhYmxlIExpc3RpbmdzJ31cbiAgICAgICAgPC9oMT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtM1wiPlxuICAgICAgICAgIHtzaG93U2F2ZVNlYXJjaCAmJiAoXG4gICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVTYXZlU2VhcmNofVxuICAgICAgICAgICAgICBkaXNhYmxlZD17aXNTYXZpbmdTZWFyY2h9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgcHgtMyBweS0xLjUgYmctcHJpbWFyeS01MCBkYXJrOmJnLXByaW1hcnktOTAwLzIwIHRleHQtcHJpbWFyeS02MDAgZGFyazp0ZXh0LXByaW1hcnktNDAwIHJvdW5kZWQtbGcgdGV4dC1bMTBweF0gZm9udC1ibGFjayB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IGJvcmRlciBib3JkZXItcHJpbWFyeS0xMDAgZGFyazpib3JkZXItcHJpbWFyeS04MDAvNTAgaG92ZXI6YmctcHJpbWFyeS0xMDAgZGFyazpob3ZlcjpiZy1wcmltYXJ5LTkwMC80MCB0cmFuc2l0aW9uLWFsbCBjdXJzb3ItcG9pbnRlciBkaXNhYmxlZDpvcGFjaXR5LTUwXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPEJlbGwgY2xhc3NOYW1lPVwidy0zIGgtM1wiIC8+IHtpc1NhdmluZ1NlYXJjaCA/ICdTYXZpbmcuLi4nIDogJ1NhdmUgQWxlcnQnfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKX1cbiAgICAgICAgICB7ZmlsdGVyZWRMaXN0aW5ncy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17Y2xlYXJGaWx0ZXJzfSBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHNtOnRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXByaW1hcnktNjAwIGRhcms6dGV4dC1wcmltYXJ5LTQwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IGhvdmVyOnVuZGVybGluZSB0cmFuc2l0aW9uLWFsbCBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICBTaG93IGFsbFxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIFJlc3BvbnNpdmUgR3JpZCBMYXlvdXQgLyBNYXAgVmlldyAqL31cbiAgICAgIDxBbmltYXRlUHJlc2VuY2UgbW9kZT1cIndhaXRcIj5cbiAgICAgICAge2lzTWFwVmlldyAmJiAhaXNBZ2VudCA/IChcbiAgICAgICAgICA8bW90aW9uLmRpdiBcbiAgICAgICAgICAgIGtleT1cIm1hcC12aWV3XCJcbiAgICAgICAgICAgIGluaXRpYWw9e3sgb3BhY2l0eTogMCwgc2NhbGU6IDAuOTggfX1cbiAgICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgc2NhbGU6IDEgfX1cbiAgICAgICAgICAgIGV4aXQ9e3sgb3BhY2l0eTogMCwgc2NhbGU6IDAuOTggfX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLVtjYWxjKDEwMHZoLTIwMHB4KV0gZmxleCBmbGV4LWNvbCBsZzpmbGV4LXJvdyBnYXAtNFwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgey8qIE1hcCBTZWN0aW9uICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgcm91bmRlZC0zeGwgb3ZlcmZsb3ctaGlkZGVuIGJvcmRlci1bMC41cHhdIGJvcmRlci1zbGF0ZS0yMDAgZGFyazpib3JkZXItWyMwZjE3MmJdIGhvdmVyOmJvcmRlci1zbGF0ZS00MDAgZGFyazpob3Zlcjpib3JkZXItc2xhdGUtODAwIHNoYWRvdy14bCByZWxhdGl2ZSBtaW4taC1bMzAwcHhdIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMFwiPlxuICAgICAgICAgICAgICA8R29vZ2xlTWFwc0d1YXJkPlxuICAgICAgICAgICAgICAgIDxHb29nbGVNYXAgXG4gICAgICAgICAgICAgICAgICBkZWZhdWx0Q2VudGVyPXt7IGxhdDogNi40MzExLCBsbmc6IDMuNDE1OCB9fSAvLyBMZWtraSBQaGFzZSAxIGNlbnRlclxuICAgICAgICAgICAgICAgICAgZGVmYXVsdFpvb209ezEzfVxuICAgICAgICAgICAgICAgICAgZGVmYXVsdFRpbHQ9ezQ1fSAvLyAzRCBWaWV3XG4gICAgICAgICAgICAgICAgICBkZWZhdWx0SGVhZGluZz17MH1cbiAgICAgICAgICAgICAgICAgIGdlc3R1cmVIYW5kbGluZz17J2Nvb3BlcmF0aXZlJ31cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVEZWZhdWx0VUk9e3RydWV9XG4gICAgICAgICAgICAgICAgICBzdHlsZXM9e2lzRGFyayA/IERBUktfTUFQX1NUWUxFIDogTElHSFRfTUFQX1NUWUxFfVxuICAgICAgICAgICAgICAgICAgbWFwSWQ9XCJERU1PX01BUF9JRFwiXG4gICAgICAgICAgICAgICAgICBpbnRlcm5hbFVzYWdlQXR0cmlidXRpb25JZHM9e1snZ21wX21jcF9jb2RlYXNzaXN0X3YxX2Fpc3R1ZGlvJ119XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7ZmlsdGVyZWRMaXN0aW5ncy5tYXAoKGxpc3RpbmcpID0+IChcbiAgICAgICAgICAgICAgICAgICAgPE1hcE1hcmtlcldpdGhJbmZvV2luZG93IFxuICAgICAgICAgICAgICAgICAgICAgIGtleT17YG1hcC1tYXJrZXItJHtsaXN0aW5nLmlkfWB9IFxuICAgICAgICAgICAgICAgICAgICAgIGxpc3Rpbmc9e2xpc3Rpbmd9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17c2V0Q3VycmVudExpc3Rpbmd9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgIDxNYXBDb250cm9sc092ZXJsYXkgLz5cbiAgICAgICAgICAgICAgICAgIDxNYXBDZW50ZXJpbmdDb250cm9sbGVyIGxpc3RpbmdzPXtmaWx0ZXJlZExpc3RpbmdzfSAvPlxuICAgICAgICAgICAgICAgIDwvR29vZ2xlTWFwPlxuICAgICAgICAgICAgICA8L0dvb2dsZU1hcHNHdWFyZD5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSB0b3AtNCBsZWZ0LTQgYmctd2hpdGUvOTAgZGFyazpiZy1zbGF0ZS05MDAvOTAgYmFja2Ryb3AtYmx1ci1tZCBwLTMgcm91bmRlZC14bCBib3JkZXItWzAuNXB4XSBib3JkZXItc2xhdGUtMjAwIGRhcms6Ym9yZGVyLVsjMGYxNzJiXSBob3Zlcjpib3JkZXItc2xhdGUtNDAwIGRhcms6aG92ZXI6Ym9yZGVyLXNsYXRlLTgwMCBzaGFkb3ctbGcgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTggaC04IGJnLXByaW1hcnktNTAgZGFyazpiZy1wcmltYXJ5LTkwMC8yMCByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtcHJpbWFyeS02MDBcIj5cbiAgICAgICAgICAgICAgICAgIDxOYXZpZ2F0aW9uIGNsYXNzTmFtZT1cInctNCBoLTRcIiAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJsYWNrIHRleHQtc2xhdGUtOTAwIGRhcms6dGV4dC13aGl0ZVwiPkFyZWEgRGlzY292ZXJ5PC9oND5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgey8qIExpc3RpbmcgTGlzdCBTZWN0aW9uICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRkZW4gbGc6YmxvY2sgdy1mdWxsIGxnOnctWzQwMHB4XSB4bDp3LVs0NTBweF0gb3ZlcmZsb3cteS1hdXRvIHByLTIgc3BhY2UteS00XCI+XG4gICAgICAgICAgICAgICAge3Zpc2libGVMaXN0aW5ncy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgICAgICAgICAgdmlzaWJsZUxpc3RpbmdzLm1hcCgobGlzdGluZywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNMYXN0ID0gaW5kZXggPT09IHZpc2libGVMaXN0aW5ncy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2BzaWRlYmFyLWxpc3RpbmctJHtsaXN0aW5nLmlkfWB9IFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtpc0xhc3QgPyBcIlwiIDogXCJib3JkZXItYiBib3JkZXItc2xhdGUtMjAwIGRhcms6Ym9yZGVyLXNsYXRlLTgwMCBwYi00XCJ9XG4gICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPExpc3RpbmdDYXJkIFxuICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0aW5nPXtsaXN0aW5nfSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25WaWV3RGV0YWlscz17KCkgPT4gc2V0Q3VycmVudExpc3RpbmcobGlzdGluZyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlzQWdlbnRWaWV3PXtpc0FnZW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkVkaXQ9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRDdXJyZW50TGlzdGluZyhsaXN0aW5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVUYWIoJ2NyZWF0ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRlbGV0ZT17KCkgPT4gaGFuZGxlRGVsZXRlKGxpc3RpbmcuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtY2VudGVyIHRleHQtc2xhdGUtNTAwIHB5LTEwXCI+Tm8gbGlzdGluZ3MgZm91bmQgaW4gdGhpcyBhcmVhLjwvcD5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIHtmaWx0ZXJlZExpc3RpbmdzLmxlbmd0aCA+IGl0ZW1zTG9hZGVkICYmIChcbiAgICAgICAgICAgICAgICAgIDxkaXYgcmVmPXtzZW50aW5lbFJlZn0gY2xhc3NOYW1lPVwiaC0wIHctMCBwb2ludGVyLWV2ZW50cy1ub25lXCIgc3R5bGU9e3sgbWFyZ2luOiAnMHB4JyB9fSAvPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L21vdGlvbi5kaXY+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0xIHNtOmdyaWQtY29scy1bcmVwZWF0KGF1dG8tZmlsbCxtaW5tYXgoMzEwcHgsMWZyKSldIGdhcC00IHNtOmdhcC02IGxnOmdhcC04IG1pbi1oLVs0MDBweF1cIj5cbiAgICAgICAgICAgIHt2aXNpYmxlTGlzdGluZ3MubGVuZ3RoID4gMCA/IChcbiAgICAgICAgICAgICAgdmlzaWJsZUxpc3RpbmdzLm1hcCgobGlzdGluZykgPT4gKFxuICAgICAgICAgICAgICAgIDxMaXN0aW5nQ2FyZCBcbiAgICAgICAgICAgICAgICAgIGtleT17YGhvbWUtbGlzdGluZy0ke2xpc3RpbmcuaWR9YH0gXG4gICAgICAgICAgICAgICAgICBsaXN0aW5nPXtsaXN0aW5nfSBcbiAgICAgICAgICAgICAgICAgIG9uVmlld0RldGFpbHM9eygpID0+IHNldEN1cnJlbnRMaXN0aW5nKGxpc3RpbmcpfVxuICAgICAgICAgICAgICAgICAgaXNBZ2VudFZpZXc9e2lzQWdlbnR9XG4gICAgICAgICAgICAgICAgICBvbkVkaXQ9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0Q3VycmVudExpc3RpbmcobGlzdGluZyk7XG4gICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZVRhYignY3JlYXRlJyk7XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgb25EZWxldGU9eygpID0+IGhhbmRsZURlbGV0ZShsaXN0aW5nLmlkKX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtc3Bhbi1mdWxsIHB5LTIwIGJnLXdoaXRlIGRhcms6Ymctc2xhdGUtOTAwIHJvdW5kZWQtMnhsIGJvcmRlci0yIGJvcmRlci1kYXNoZWQgYm9yZGVyLXNsYXRlLTIwMCBkYXJrOmJvcmRlci1zbGF0ZS04MDAgdGV4dC1jZW50ZXIgc3BhY2UteS00XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTIwIGgtMjAgYmctc2xhdGUtNTAgZGFyazpiZy1zbGF0ZS04MDAgcm91bmRlZC1mdWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIG14LWF1dG9cIj5cbiAgICAgICAgICAgICAgICAgIHtpc0FnZW50ID8gPEhvbWVJY29uIGNsYXNzTmFtZT1cInctMTAgaC0xMCB0ZXh0LXNsYXRlLTIwMCBkYXJrOnRleHQtc2xhdGUtNzAwXCIgLz4gOiA8U2VhcmNoIGNsYXNzTmFtZT1cInctMTAgaC0xMCB0ZXh0LXNsYXRlLTIwMCBkYXJrOnRleHQtc2xhdGUtNzAwXCIgLz59XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc2xhdGUtOTAwIGRhcms6dGV4dC13aGl0ZSBmb250LWJvbGRcIj57aXNBZ2VudCA/IFwiWW91IGhhdmUgbm8gbGlzdGluZ3MgeWV0XCIgOiBcIk5vIG1hdGNoZXMgZm91bmRcIn08L3A+XG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTQwMCBkYXJrOnRleHQtc2xhdGUtNTAwIHRleHQteHMgbXQtMVwiPlxuICAgICAgICAgICAgICAgICAgICB7aXNBZ2VudCA/IFwiU3RhcnQgYnkgcG9zdGluZyB5b3VyIGZpcnN0IHByb3BlcnR5IHRvIGZpbmQgdGVuYW50c1wiIDogXCJUcnkgYWRqdXN0aW5nIHlvdXIgYnVkZ2V0IG9yIHNlYXJjaCB0ZXJtc1wifVxuICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtpc0FnZW50ID8gKCkgPT4gc2V0QWN0aXZlVGFiKCdjcmVhdGUnKSA6IGNsZWFyRmlsdGVyc31cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMi41IGJnLXByaW1hcnktNjAwIHRleHQtd2hpdGUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy1wcmltYXJ5LTcwMCB0cmFuc2l0aW9uLWFsbCBzaGFkb3ctbGcgc2hhZG93LXByaW1hcnktNTAwLzIwXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNBZ2VudCA/IFwiUG9zdCBhIExpc3RpbmdcIiA6IFwiQ2xlYXIgYWxsIGZpbHRlcnNcIn1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAge2ZpbHRlcmVkTGlzdGluZ3MubGVuZ3RoID4gaXRlbXNMb2FkZWQgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IHJlZj17c2VudGluZWxSZWZ9IGNsYXNzTmFtZT1cImNvbC1zcGFuLWZ1bGwgaC0wIHctMCBwb2ludGVyLWV2ZW50cy1ub25lXCIgLz5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG4gICAgICA8L0FuaW1hdGVQcmVzZW5jZT5cbiAgICA8L21vdGlvbi5kaXY+XG4gIDwvbWFpbj5cbjwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgSG9tZTsiXSwiZmlsZSI6Ii9hcHAvYXBwbGV0L3NyYy9wYWdlcy9Ib21lLnRzeCJ9