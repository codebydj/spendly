import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationService, type LocationResult } from '../../services/locationService';
import { MapPin, Search, Check, X, AlertCircle, Compass } from 'lucide-react';

interface SelectLocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: LocationResult) => void;
  initialLocation?: LocationResult;
}

export const SelectLocationMapModal: React.FC<SelectLocationMapModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLocation?.latitude || 16.5062,
    lng: initialLocation?.longitude || 80.648,
  });

  const [locationName, setLocationName] = useState<string>(initialLocation?.name || '');
  const [locationAddress, setLocationAddress] = useState<string>(initialLocation?.address || '');
  const [placeId, setPlaceId] = useState<string | undefined>(initialLocation?.placeId);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // GPS state & Permission explanation
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // 1. Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const lat = initialLocation?.latitude || 16.5062;
      const lng = initialLocation?.longitude || 80.648;
      setSelectedCoords({ lat, lng });
      setLocationName(initialLocation?.name || '');
      setLocationAddress(initialLocation?.address || '');
      setPlaceId(initialLocation?.placeId);
      setGpsError(null);
      setSearchResults([]);
      setSearchQuery('');
    }
  }, [isOpen, initialLocation]);

  // 2. Initialize & Teardown Leaflet Map Lifecycle
  useEffect(() => {
    if (!isOpen) {
      // Teardown Leaflet instance completely when modal is closed
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    if (!mapContainerRef.current) return;

    // Small delay to ensure modal DOM is mounted, visible, and sized
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean up previous instance if container holds stale references
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }

      // Reset any stray leaflet id on element
      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      const targetLat = initialLocation?.latitude || selectedCoords.lat || 16.5062;
      const targetLng = initialLocation?.longitude || selectedCoords.lng || 80.648;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([targetLat, targetLng], 14);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Map Click Listener
      map.on('click', (e: L.LeafletMouseEvent) => {
        handleMapPointSelect(e.latlng.lat, e.latlng.lng);
      });

      leafletMapRef.current = map;

      // Update Marker
      updateMarker(targetLat, targetLng);

      // Invalidate size after layout stabilization across multiple frames
      [50, 150, 350].forEach((delay) => {
        setTimeout(() => {
          if (leafletMapRef.current) {
            leafletMapRef.current.invalidateSize();
          }
        }, delay);
      });
    }, 100);

    const handleResize = () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  // Update marker position
  const updateMarker = (lat: number, lng: number) => {
    if (!leafletMapRef.current) return;
    const map = leafletMapRef.current;

    const pinSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const customPin = L.divIcon({
        className: 'custom-map-pin-container',
        html: `
          <div class="modern-pin-wrapper">
            <div class="modern-pin-body selected">
              <div class="modern-pin-inner">${pinSvg}</div>
            </div>
            <div class="modern-pin-pulse"></div>
          </div>
        `,
        iconSize: [48, 56],
        iconAnchor: [24, 52],
      });

      const marker = L.marker([lat, lng], { icon: customPin, draggable: true }).addTo(map);

      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        handleMapPointSelect(newPos.lat, newPos.lng);
      });

      markerRef.current = marker;
    }
  };

  // Handle Map Point Selection (Click or Drag)
  const handleMapPointSelect = async (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    updateMarker(lat, lng);

    setIsReverseGeocoding(true);
    try {
      const res = await LocationService.reverseGeocode(lat, lng);
      if (res.name) {
        setLocationName(res.name);
      }
      if (res.address) {
        setLocationAddress(res.address);
      }
      if (res.placeId) {
        setPlaceId(res.placeId);
      }
    } catch {
      // Fallback
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Handle Online Place Search
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await LocationService.searchPlaces(searchQuery.trim());
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select Search Result Item
  const handleSelectSearchResult = (result: LocationResult) => {
    if (result.latitude !== undefined && result.longitude !== undefined) {
      setSelectedCoords({ lat: result.latitude, lng: result.longitude });
      if (leafletMapRef.current) {
        leafletMapRef.current.setView([result.latitude, result.longitude], 16, { animate: true });
      }
      updateMarker(result.latitude, result.longitude);
    }

    setLocationName(result.name);
    setLocationAddress(result.address || '');
    setPlaceId(result.placeId);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Handle Request Current Location (GPS)
  const handleFetchCurrentLocation = async () => {
    setIsGettingGPS(true);
    setGpsError(null);

    try {
      const coords = await LocationService.getCurrentCoordinates();
      setSelectedCoords({ lat: coords.latitude, lng: coords.longitude });

      if (leafletMapRef.current) {
        leafletMapRef.current.setView([coords.latitude, coords.longitude], 16, { animate: true });
      }
      updateMarker(coords.latitude, coords.longitude);

      // Reverse geocode current position
      setIsReverseGeocoding(true);
      const res = await LocationService.reverseGeocode(coords.latitude, coords.longitude);
      setLocationName(res.name || 'Current Location');
      setLocationAddress(res.address || '');
    } catch (err: any) {
      setGpsError(err.message || 'Unable to get location. You can select on map manually.');
    } finally {
      setIsGettingGPS(false);
      setIsReverseGeocoding(false);
    }
  };

  // Confirm and Return Selected Location
  const handleConfirm = () => {
    const finalName = locationName.trim() || 'Selected Location';
    onSelectLocation({
      name: finalName,
      address: locationAddress.trim() || undefined,
      latitude: selectedCoords.lat,
      longitude: selectedCoords.lng,
      placeId,
      isManual: false,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="card-level-3"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-dark)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={20} color="var(--accent-cyan)" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Select Location</h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Tap map, drag pin, or search online for a location
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar Row */}
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search college, hospital, bank, restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '38px', paddingRight: '12px', height: '40px', fontSize: '0.86rem' }}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="btn btn-secondary"
              style={{ padding: '0 16px', height: '40px', fontSize: '0.84rem' }}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Search Suggestions Dropdown */}
          {searchResults.length > 0 && (
            <div
              style={{
                marginTop: '8px',
                maxHeight: '180px',
                overflowY: 'auto',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {searchResults.map((res, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSearchResult(res)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: idx < searchResults.length - 1 ? '1px solid var(--border-color)' : 'none',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-violet-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{res.name}</div>
                  {res.address && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>{res.address}</div>}
                </div>
              ))}
            </div>
          )}

          {/* GPS Error / Explanation */}
          {gpsError && (
            <div
              style={{
                marginTop: '8px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--status-danger)',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{gpsError}</span>
              </div>
              <button
                type="button"
                onClick={handleFetchCurrentLocation}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.74rem', whiteSpace: 'nowrap' }}
              >
                Allow Location
              </button>
            </div>
          )}
        </div>

        {/* Map View Area */}
        <div style={{ position: 'relative', height: '280px', width: '100%', backgroundColor: '#090d16' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Floating Current Location GPS Button */}
          <button
            type="button"
            onClick={handleFetchCurrentLocation}
            disabled={isGettingGPS}
            title="Use current GPS location"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 500,
              backgroundColor: 'var(--bg-dark)',
              color: 'var(--accent-cyan)',
              border: '1px solid var(--border-strong)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            <Compass size={20} style={{ animation: isGettingGPS ? 'spin 1.5s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Selected Location Details & Name Inputs */}
        <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                Location Name
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder={isReverseGeocoding ? 'Reverse geocoding...' : 'Enter location name'}
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.86rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                Address / Area
              </label>
              <input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Address details"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.86rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            <span>Latitude: <strong style={{ color: 'var(--text-primary)' }}>{selectedCoords.lat.toFixed(6)}</strong></span>
            <span>Longitude: <strong style={{ color: 'var(--text-primary)' }}>{selectedCoords.lng.toFixed(6)}</strong></span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '10px', fontSize: '0.88rem', justifyContent: 'center' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="btn btn-primary"
              style={{ flex: 1.5, padding: '10px', fontSize: '0.88rem', justifyContent: 'center' }}
            >
              <Check size={16} /> Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
