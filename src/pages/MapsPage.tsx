import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import {
  Search,
  Plus,
  Minus,
  Navigation as NavigationIcon,
  Layers,
  MapPin,
  Bookmark,
  BookmarkCheck,
  Route as RouteIcon,
  X,
  Compass,
  AlertCircle,
  Satellite,
  Car,
  Footprints,
  Bike,
  Bus,
  ArrowRight,
  ExternalLink,
  Star,
  Check,
  Mountain,
  Box,
  KeyRound,
  RefreshCw,
  LocateFixed,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';
import { mapsService, MapPlace, DEFAULT_PLACES } from '../services/mapsService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { soundEffects } from '../utils/sound';

interface MapsPageProps {
  onOpenLaterPhase: (title: string, desc: string, feat?: string) => void;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const ATTRIBUTION_IDS = ['gmp_mcp_codeassist_v1_aistudio'];

export type MapState =
  | 'Location permission requested'
  | 'Location permission granted'
  | 'Location permission denied'
  | 'Location unavailable'
  | 'GPS loading'
  | 'Searching location'
  | 'Location selected';

// Inner Controller that has access to useMap & useMapsLibrary hooks
interface InnerMapControllerProps {
  mapType: 'roadmap' | 'satellite' | 'terrain';
  is3DMode: boolean;
  heading: number;
  tilt: number;
  zoomLevel: number;
  selectedPlace: MapPlace | null;
  onSelectPlace: (place: MapPlace) => void;
  userLocation: { lat: number; lng: number } | null;
  activeRoute: {
    origin: { lat: number; lng: number; label: string };
    destination: { lat: number; lng: number; label: string };
    travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  } | null;
  onRouteCalculated: (details: { distance: string; duration: string; steps?: string[] } | null) => void;
  onRouteError: (errorMsg: string | null) => void;
  savedPlaces: MapPlace[];
  onMapClickLocation: (coords: { lat: number; lng: number }) => void;
}

function InnerMapController({
  mapType,
  is3DMode,
  heading,
  tilt,
  selectedPlace,
  onSelectPlace,
  userLocation,
  activeRoute,
  onRouteCalculated,
  onRouteError,
  savedPlaces,
  onMapClickLocation
}: InnerMapControllerProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<any[]>([]);

  // Apply map view configurations smoothly
  useEffect(() => {
    if (!map) return;
    map.setMapTypeId(mapType);
    map.setHeading(heading);
    map.setTilt(tilt);
  }, [map, mapType, heading, tilt]);

  // Click & Context Menu (Long Press) listeners on map
  useEffect(() => {
    if (!map) return;

    const clickListener = map.addListener('click', (e: any) => {
      if (e.latLng) {
        onMapClickLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    });

    const contextListener = map.addListener('contextmenu', (e: any) => {
      if (e.latLng) {
        onMapClickLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    });

    return () => {
      window.google?.maps?.event?.removeListener(clickListener);
      window.google?.maps?.event?.removeListener(contextListener);
    };
  }, [map, onMapClickLocation]);

  // Modern Route Calculation using Route.computeRoutes
  useEffect(() => {
    if (!routesLib || !map) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (!activeRoute) {
      onRouteCalculated(null);
      onRouteError(null);
      return;
    }

    const request = {
      origin: { lat: activeRoute.origin.lat, lng: activeRoute.origin.lng },
      destination: { lat: activeRoute.destination.lat, lng: activeRoute.destination.lng },
      travelMode: activeRoute.travelMode,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs']
    };

    onRouteError(null);

    (routesLib.Route as any)
      .computeRoutes(request)
      .then(({ routes }: { routes: any[] }) => {
        if (!routes || routes.length === 0) {
          onRouteError('No direct route found for this travel mode.');
          onRouteCalculated(null);
          return;
        }

        const primaryRoute = routes[0];

        if (typeof primaryRoute.createPolylines === 'function') {
          const newPolylines = primaryRoute.createPolylines();
          newPolylines.forEach((poly: any) => {
            poly.setOptions({
              strokeColor: '#06b6d4',
              strokeOpacity: 0.9,
              strokeWeight: 5
            });
            poly.setMap(map);
          });
          polylinesRef.current = newPolylines;
        }

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }

        const distanceMeters = primaryRoute.distanceMeters || 0;
        const durationMillis = primaryRoute.durationMillis || 0;

        const distanceText =
          distanceMeters > 1000
            ? `${(distanceMeters / 1000).toFixed(1)} km`
            : `${distanceMeters} m`;

        const totalMinutes = Math.round(durationMillis / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const durationText =
          hours > 0 ? `${hours} hr ${mins} min` : `${Math.max(1, mins)} min`;

        const steps: string[] = [];
        if (primaryRoute.legs?.[0]?.steps) {
          primaryRoute.legs[0].steps.slice(0, 5).forEach((step: any) => {
            if (step.navigationInstruction?.instructions) {
              steps.push(step.navigationInstruction.instructions);
            }
          });
        }

        onRouteCalculated({
          distance: distanceText,
          duration: durationText,
          steps: steps.length > 0 ? steps : undefined
        });
      })
      .catch((err: any) => {
        console.warn('Routes computation notice:', err);
        onRouteError(err?.message || 'Could not compute direct route.');
        onRouteCalculated(null);
      });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, activeRoute, onRouteCalculated, onRouteError]);

  return (
    <>
      {/* Real Device User Location Marker with pulsing radar ring */}
      {userLocation && (
        <AdvancedMarker position={userLocation} title="Your Device Location">
          <div className="relative flex items-center justify-center pointer-events-none">
            <span className="w-5 h-5 rounded-full bg-cyan-400 ring-4 ring-cyan-500/40 shadow-xl shadow-cyan-400/60" />
            <span className="absolute -inset-3 rounded-full bg-cyan-400/30 animate-ping" />
          </div>
        </AdvancedMarker>
      )}

      {/* Selected Location Marker */}
      {selectedPlace && (
        <AdvancedMarker
          position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
          title={selectedPlace.name}
        >
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-slate-950 font-bold shadow-2xl shadow-cyan-500/50 scale-110 flex items-center justify-center border-2 border-white animate-bounce-short">
            <MapPin className="w-4 h-4 fill-current" />
          </div>
        </AdvancedMarker>
      )}

      {/* Saved Places Markers */}
      {savedPlaces.map((place) => {
        if (selectedPlace?.id === place.id) return null;
        return (
          <AdvancedMarker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            title={place.name}
            onClick={() => onSelectPlace(place)}
          >
            <div className="p-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/60 text-cyan-400 hover:scale-125 transition-transform shadow-lg cursor-pointer">
              <MapPin className="w-3.5 h-3.5" />
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
}

// Map Controls Component for Zoom, Pan, Compass
function MapControlsBridge({
  zoomLevel,
  setZoomLevel,
  onResetCompass,
  heading,
  onCenterLocation,
  isGpsLoading
}: {
  zoomLevel: number;
  setZoomLevel: (fn: (z: number) => number) => void;
  onResetCompass: () => void;
  heading: number;
  onCenterLocation: () => void;
  isGpsLoading: boolean;
}) {
  const map = useMap();

  const handleZoomIn = () => {
    soundEffects.playHapticClick();
    if (map) {
      const next = (map.getZoom() || zoomLevel) + 1;
      map.setZoom(next);
      setZoomLevel(() => next);
    }
  };

  const handleZoomOut = () => {
    soundEffects.playHapticClick();
    if (map) {
      const next = Math.max(2, (map.getZoom() || zoomLevel) - 1);
      map.setZoom(next);
      setZoomLevel(() => next);
    }
  };

  return (
    <div className="absolute right-3 top-20 z-30 flex flex-col gap-2">
      {/* Compass / Heading Reset Button */}
      <button
        onClick={() => {
          soundEffects.playHapticClick();
          onResetCompass();
          if (map) {
            map.setHeading(0);
            map.setTilt(0);
          }
        }}
        className={`w-10 h-10 rounded-2xl aerix-glass-elevated border flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
          heading !== 0 ? 'border-amber-400 text-amber-300' : 'border-slate-800 text-slate-300 hover:text-white'
        }`}
        title="Reset North Compass"
      >
        <Compass
          className="w-5 h-5 transition-transform duration-300"
          style={{ transform: `rotate(${-heading}deg)` }}
        />
      </button>

      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        className="w-10 h-10 rounded-2xl aerix-glass-elevated border border-slate-800 flex items-center justify-center text-slate-200 hover:text-white hover:border-cyan-500 shadow-lg active:scale-95 transition-all"
        title="Zoom In"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        className="w-10 h-10 rounded-2xl aerix-glass-elevated border border-slate-800 flex items-center justify-center text-slate-200 hover:text-white hover:border-cyan-500 shadow-lg active:scale-95 transition-all"
        title="Zoom Out"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
}

export const MapsPage: React.FC<MapsPageProps> = () => {
  const { currentUser } = useAuth();
  const { language, isRtl, t } = useLanguage();

  // Map view states
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain'>('roadmap');
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [heading, setHeading] = useState<number>(0);
  const [tilt, setTilt] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(14);

  // Coordinates & Selection
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<MapPlace[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MapPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // REQUIRED 7 MAP STATES
  const [mapState, setMapState] = useState<MapState>('Location selected');
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);

  // Directions
  const [activeRoute, setActiveRoute] = useState<{
    origin: { lat: number; lng: number; label: string };
    destination: { lat: number; lng: number; label: string };
    travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  } | null>(null);
  const [routeDetails, setRouteDetails] = useState<{ distance: string; duration: string; steps?: string[] } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);

  // UI Drawer & Toasts
  const [showSavedPlaces, setShowSavedPlaces] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load Saved Places from Firestore / local
  useEffect(() => {
    let mounted = true;
    mapsService
      .getSavedPlaces(currentUser?.uid)
      .then((places) => {
        if (mounted && places.length > 0) {
          setSavedPlaces(places);
        }
      })
      .catch((err) => console.warn('Could not load saved places:', err));

    return () => {
      mounted = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [currentUser?.uid]);

  // REAL DEVICE GPS PERMISSION & LOCATION DETECTION
  const handleUseCurrentLocation = useCallback(() => {
    soundEffects.playHapticClick();

    if (!navigator.geolocation) {
      setMapState('Location unavailable');
      showToast(t('maps.state.unavailable', 'Location services unavailable on this device.'));
      return;
    }

    setMapState('Location permission requested');
    setMapState('GPS loading');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setMapState('Location permission granted');

        // Smooth camera movement: Center map on user location without locking
        if (mapInstance) {
          mapInstance.panTo(coords);
          mapInstance.setZoom(16);
        }

        // Set as selected place with reverse geocoding
        reverseGeocodeCoords(coords.lat, coords.lng, 'My Current Device Position');

        showToast(
          language === 'ar'
            ? 'تم تحديد موقعك بدقة وتوسيط الخريطة عليه'
            : 'Centered on your current GPS location'
        );

        // Start real-time watch so location updates when user moves
        if (watchIdRef.current === null) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            (updatedPos) => {
              const updatedCoords = {
                lat: updatedPos.coords.latitude,
                lng: updatedPos.coords.longitude
              };
              setUserLocation(updatedCoords);
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 10000 }
          );
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setMapState('Location permission denied');
          setShowPermissionModal(true);
        } else {
          setMapState('Location unavailable');
          showToast(t('maps.state.unavailable', 'Location unavailable. Please check GPS signal.'));
        }
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }, [mapInstance, language, t]);

  // Reverse geocoding helper
  const reverseGeocodeCoords = (lat: number, lng: number, fallbackTitle: string) => {
    const googleObj = (window as any).google;
    if (googleObj?.maps?.Geocoder) {
      const geocoder = new googleObj.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === 'OK' && results?.[0]) {
          const res = results[0];
          const newPlace: MapPlace = {
            id: `loc_${Date.now()}`,
            name: res.formatted_address?.split(',')[0] || fallbackTitle,
            address: res.formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            category: 'landmark',
            lat,
            lng,
            isCustom: true
          };
          setSelectedPlace(newPlace);
          setMapState('Location selected');
        } else {
          setSelectedPlace({
            id: `loc_${Date.now()}`,
            name: fallbackTitle,
            address: `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            category: 'landmark',
            lat,
            lng,
            isCustom: true
          });
          setMapState('Location selected');
        }
      });
    } else {
      setSelectedPlace({
        id: `loc_${Date.now()}`,
        name: fallbackTitle,
        address: `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        category: 'landmark',
        lat,
        lng,
        isCustom: true
      });
      setMapState('Location selected');
    }
  };

  // Tap or Long-press on map to select location
  const handleMapClickLocation = useCallback(
    (coords: { lat: number; lng: number }) => {
      soundEffects.playHapticClick();
      // Clear previous selected place and update location
      reverseGeocodeCoords(coords.lat, coords.lng, 'Selected Point');
    },
    []
  );

  // Search Location: Cities, Addresses, Places, Destinations
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    soundEffects.playHapticClick();
    setIsSearching(true);
    setMapState('Searching location');

    try {
      // Check local saved & default places first
      const queryLower = query.toLowerCase();
      const localMatches = [...savedPlaces, ...DEFAULT_PLACES].filter(
        (p) =>
          p.name.toLowerCase().includes(queryLower) ||
          p.address.toLowerCase().includes(queryLower)
      );

      // Google Places / Geocoder query
      let apiMatches: MapPlace[] = [];
      const googleObj = (window as any).google;

      if (googleObj?.maps?.Geocoder) {
        try {
          const geocoder = new googleObj.maps.Geocoder();
          const results = await new Promise<any[]>((resolve) => {
            geocoder.geocode({ address: query }, (res: any, status: any) => {
              if (status === 'OK' && res) resolve(res);
              else resolve([]);
            });
          });

          apiMatches = results.slice(0, 5).map((r, idx) => ({
            id: `geo_${idx}_${Date.now()}`,
            name: r.formatted_address.split(',')[0],
            address: r.formatted_address,
            category: 'landmark',
            lat: r.geometry.location.lat(),
            lng: r.geometry.location.lng()
          }));
        } catch (err) {
          console.warn('Geocoder query notice:', err);
        }
      }

      const combined = [...apiMatches, ...localMatches];
      const unique = combined.filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i);

      setSearchResults(unique);

      if (unique.length > 0) {
        const topResult = unique[0];
        setSelectedPlace(topResult);
        setMapState('Location selected');
        if (mapInstance) {
          mapInstance.panTo({ lat: topResult.lat, lng: topResult.lng });
          mapInstance.setZoom(15);
        }
      } else {
        showToast(
          language === 'ar'
            ? `لم يتم العثور على نتائج لـ "${query}"`
            : `No locations found for "${query}"`
        );
      }
    } catch (err) {
      console.error('Search error:', err);
      showToast('Search encountered a network issue. Please retry.');
    } finally {
      setIsSearching(false);
    }
  };

  // Toggle Save Place
  const handleToggleSavePlace = async (place: MapPlace) => {
    soundEffects.playHapticClick();
    const isAlreadySaved = savedPlaces.some((p) => p.name === place.name || p.id === place.id);

    try {
      if (isAlreadySaved) {
        const found = savedPlaces.find((p) => p.name === place.name || p.id === place.id);
        if (found) {
          await mapsService.removeSavedPlace(found.id, currentUser?.uid);
          setSavedPlaces((prev) => prev.filter((p) => p.id !== found.id));
          showToast(language === 'ar' ? 'تمت إزالة المكان من المحفوظات' : 'Place removed from saved');
        }
      } else {
        const saved = await mapsService.savePlace(place, currentUser?.uid);
        setSavedPlaces((prev) => [saved, ...prev]);
        showToast(language === 'ar' ? 'تم حفظ المكان في ملفك' : 'Place saved to AERIX profile');
      }
    } catch (err) {
      console.error('Error saving place:', err);
      showToast('Failed to update saved place.');
    }
  };

  // Navigation directions
  const handleStartNavigation = (dest: MapPlace) => {
    soundEffects.playSuccessBeep();
    setSelectedPlace(dest);

    const origin = userLocation
      ? { ...userLocation, label: language === 'ar' ? 'موقعي الحالي' : 'Current GPS Location' }
      : { lat: 24.7136, lng: 46.6753, label: 'Central Hub' };

    setActiveRoute({
      origin,
      destination: { lat: dest.lat, lng: dest.lng, label: dest.name },
      travelMode: 'DRIVING'
    });
    setShowRouteModal(true);
  };

  // 3D toggle
  const toggle3D = () => {
    soundEffects.playHapticClick();
    setIs3DMode((prev) => {
      const next = !prev;
      setTilt(next ? 45 : 0);
      setHeading(next ? 35 : 0);
      return next;
    });
  };

  // State Badge Color & Icon
  const getStateBadge = () => {
    switch (mapState) {
      case 'Location permission requested':
      case 'GPS loading':
      case 'Searching location':
        return {
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: RefreshCw,
          spin: true
        };
      case 'Location permission granted':
      case 'Location selected':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: CheckCircle2,
          spin: false
        };
      case 'Location permission denied':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: AlertTriangle,
          spin: false
        };
      case 'Location unavailable':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: AlertCircle,
          spin: false
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: Info,
          spin: false
        };
    }
  };

  const badge = getStateBadge();
  const BadgeIcon = badge.icon;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="w-full h-[calc(100vh-64px)] relative flex flex-col overflow-hidden bg-[#030712] text-slate-100"
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 text-xs shadow-2xl backdrop-blur-md font-mono flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header / Map State Bar & Search */}
      <div className="absolute top-3 left-3 right-3 z-30 space-y-2">
        {/* Status & Quick Action Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Active Map State Badge */}
          <div
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono flex items-center gap-2 shadow-lg backdrop-blur-md ${badge.bg}`}
          >
            <BadgeIcon className={`w-3.5 h-3.5 ${badge.spin ? 'animate-spin' : ''}`} />
            <span className="font-semibold">{t(`maps.state.${mapState}`, mapState)}</span>
          </div>

          {/* Quick Buttons: "Use My Current Location" & "Saved" */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUseCurrentLocation}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
              title="Detect real device location"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span>{t('maps.useCurrentLocation', 'Use My Current Location')}</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playHapticClick();
                setShowSavedPlaces(true);
              }}
              className="px-3 py-1.5 rounded-xl aerix-glass-elevated border border-slate-800 text-xs font-semibold text-slate-200 hover:text-cyan-400 flex items-center gap-1 shadow"
            >
              <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
              <span>Saved ({savedPlaces.length})</span>
            </button>
          </div>
        </div>

        {/* Search Bar: "Search Location" */}
        <form
          onSubmit={handleSearchSubmit}
          className="aerix-glass-elevated rounded-2xl p-1.5 border border-slate-700/60 flex items-center gap-2 shadow-xl backdrop-blur-md"
        >
          <button type="submit" className="p-2 text-cyan-400 hover:text-cyan-300">
            {isSearching ? (
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              'maps.searchPlaceholder',
              'Search city, address, place or destination...'
            )}
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold"
          >
            {t('maps.searchLocation', 'Search')}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="aerix-glass-elevated rounded-2xl border border-slate-800 shadow-2xl p-2 max-h-48 overflow-y-auto space-y-1 backdrop-blur-xl">
            {searchResults.map((result) => (
              <div
                key={result.id}
                onClick={() => {
                  soundEffects.playHapticClick();
                  setSelectedPlace(result);
                  setSearchResults([]);
                  setSearchQuery(result.name);
                  setMapState('Location selected');
                  if (mapInstance) {
                    mapInstance.panTo({ lat: result.lat, lng: result.lng });
                    mapInstance.setZoom(15);
                  }
                }}
                className="p-2 rounded-xl hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-white">{result.name}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[240px]">
                    {result.address}
                  </div>
                </div>
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Map Layers (Standard / Satellite / Terrain / 3D) */}
        <div className="flex items-center gap-1.5 p-1 aerix-glass-elevated rounded-xl border border-slate-800 shadow-md w-fit">
          <button
            onClick={() => {
              soundEffects.playHapticClick();
              setMapType('roadmap');
            }}
            className={`min-h-[30px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              mapType === 'roadmap'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Standard</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playHapticClick();
              setMapType('satellite');
            }}
            className={`min-h-[30px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              mapType === 'satellite'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Satellite className="w-3 h-3" />
            <span>Satellite</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playHapticClick();
              setMapType('terrain');
            }}
            className={`min-h-[30px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              mapType === 'terrain'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Mountain className="w-3 h-3" />
            <span>Terrain</span>
          </button>

          <button
            onClick={toggle3D}
            className={`min-h-[30px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              is3DMode
                ? 'bg-purple-600 text-white font-bold shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Box className="w-3 h-3" />
            <span>3D Tilt</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-[#070b14]">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} solutionChannel="GMP_aistudio">
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={{ lat: 24.7136, lng: 46.6753 }}
            defaultZoom={zoomLevel}
            gestureHandling="greedy"
            disableDefaultUI={true}
            internalUsageAttributionIds={ATTRIBUTION_IDS}
            className="w-full h-full cursor-crosshair"
          >
            <InnerMapController
              mapType={mapType}
              is3DMode={is3DMode}
              heading={heading}
              tilt={tilt}
              zoomLevel={zoomLevel}
              selectedPlace={selectedPlace}
              onSelectPlace={(place) => {
                soundEffects.playHapticClick();
                setSelectedPlace(place);
                setMapState('Location selected');
              }}
              userLocation={userLocation}
              activeRoute={activeRoute}
              onRouteCalculated={(details) => setRouteDetails(details)}
              onRouteError={(err) => setRouteError(err)}
              savedPlaces={savedPlaces}
              onMapClickLocation={handleMapClickLocation}
            />

            <MapControlsBridge
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              onResetCompass={() => {
                setHeading(0);
                setTilt(0);
                setIs3DMode(false);
              }}
              heading={heading}
              onCenterLocation={handleUseCurrentLocation}
              isGpsLoading={mapState === 'GPS loading'}
            />
          </Map>
        </APIProvider>

        {/* Selected Place Card (Smoothly updateable, clearable, draggable map) */}
        {selectedPlace && !showRouteModal && (
          <div className="absolute left-3 right-3 bottom-3 z-30 aerix-glass-elevated rounded-3xl p-4 border border-cyan-500/40 shadow-2xl backdrop-blur-xl animate-fadeIn">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-0.5">
                  <span className="flex items-center gap-1 font-bold">
                    <MapPin className="w-3 h-3" />
                    {selectedPlace.category || 'Location'}
                  </span>
                  <span>·</span>
                  <span>
                    {selectedPlace.lat.toFixed(4)}, {selectedPlace.lng.toFixed(4)}
                  </span>
                </div>
                <h3 className="text-sm font-bold font-display text-white truncate">
                  {selectedPlace.name}
                </h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {selectedPlace.address}
                </p>
              </div>

              <button
                onClick={() => setSelectedPlace(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
                title="Clear selected location"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => handleStartNavigation(selectedPlace)}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <RouteIcon className="w-3.5 h-3.5" />
                <span>Directions</span>
              </button>

              <button
                onClick={() => handleToggleSavePlace(selectedPlace)}
                className="py-2 px-3 rounded-xl aerix-glass border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {savedPlaces.some((p) => p.name === selectedPlace.name || p.id === selectedPlace.id) ? (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PERMISSION DENIED EXPLANATION MODAL */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl aerix-glass border border-rose-500/40 p-5 space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold font-display text-white">
                {language === 'ar' ? 'إذن الموقع مرفوض' : 'Location Permission Denied'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t('maps.deniedExplanation')}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-white">How to enable:</div>
              <div>1. Tap the lock/tune icon in the browser address bar.</div>
              <div>2. Toggle "Location" to Allow.</div>
              <div>3. Refresh or click "Try Again".</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  handleUseCurrentLocation();
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVED PLACES DRAWER */}
      {showSavedPlaces && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-sm h-full bg-[#070b14] border-l border-slate-800 p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-cyan-400" />
                  Saved Places ({savedPlaces.length})
                </h3>
                <button
                  onClick={() => setShowSavedPlaces(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[70vh] overflow-y-auto no-scrollbar">
                {savedPlaces.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">
                    No saved places yet. Tap on any location to save it.
                  </p>
                ) : (
                  savedPlaces.map((place) => (
                    <div
                      key={place.id}
                      onClick={() => {
                        soundEffects.playHapticClick();
                        setSelectedPlace(place);
                        setMapState('Location selected');
                        setShowSavedPlaces(false);
                        if (mapInstance) {
                          mapInstance.panTo({ lat: place.lat, lng: place.lng });
                          mapInstance.setZoom(15);
                        }
                      }}
                      className="p-3 rounded-2xl aerix-glass border border-slate-800 hover:border-cyan-500/40 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{place.name}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          {place.address}
                        </div>
                      </div>
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
