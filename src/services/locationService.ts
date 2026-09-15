import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationResult {
  placeId?: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isManual?: boolean;
  isSaved?: boolean;
}

export class LocationService {
  // Check location permission state
  public static async checkPermissionState(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!Capacitor.isNativePlatform()) {
      return 'granted';
    }
    try {
      const status = await Geolocation.checkPermissions();
      if (status.location === 'granted') return 'granted';
      if (status.location === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'prompt';
    }
  }

  // Request location permission explicitly
  public static async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    try {
      const status = await Geolocation.requestPermissions();
      return status.location === 'granted' || status.coarseLocation === 'granted';
    } catch (err) {
      console.warn('Location permission request failed:', err);
      return false;
    }
  }

  // Get current device GPS coordinates with native Capacitor plugin & browser fallback
  public static async getCurrentCoordinates(): Promise<{ latitude: number; longitude: number }> {
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await Geolocation.checkPermissions();
        if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
          const req = await Geolocation.requestPermissions();
          if (req.location !== 'granted' && req.coarseLocation !== 'granted') {
            throw new Error('Access denied to location. Please tap "Allow Location" to enable GPS access.');
          }
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 10000,
        });

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch (err: any) {
        console.warn('Native Capacitor geolocation error:', err);
        const msg = err.message ? err.message.toLowerCase() : '';
        if (msg.includes('denied') || msg.includes('permission')) {
          throw new Error('Location permission is required to use your current location.');
        }
        if (msg.includes('disabled') || msg.includes('services') || msg.includes('turned off')) {
          throw new Error('Location permission is disabled in Android Settings.');
        }
        if (msg.includes('timeout')) {
          throw new Error('Location request timed out. Please try again or pick location on map.');
        }
        throw new Error(err.message || 'Unable to retrieve location coordinates. Try selecting on map.');
      }
    }

    // Web Browser Fallback
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            reject(new Error('Location permission is required to use your current location.'));
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            reject(new Error('Location unavailable. Please check GPS settings or select on map.'));
          } else if (err.code === err.TIMEOUT) {
            reject(new Error('Location request timed out. Please try again.'));
          } else {
            reject(new Error('Unable to retrieve location. You can pick location on map instead.'));
          }
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
      );
    });
  }

  // Alias for getCurrentCoordinates
  public static async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return this.getCurrentCoordinates();
  }

  // Advanced Place Search combining saved workspace locations, Photon POI engine, and Nominatim
  public static async searchPlaces(
    query: string,
    existingTransactions?: { locationName?: string; locationAddress?: string; latitude?: number; longitude?: number; locationPlaceId?: string }[]
  ): Promise<LocationResult[]> {
    if (!query || query.trim().length < 2) return [];

    const cleanQuery = query.trim().replace(/\s+/g, ' ');
    const results: LocationResult[] = [];
    const seenKeys = new Set<string>();

    // 1. Instant match from user's existing saved transaction locations
    if (existingTransactions && existingTransactions.length > 0) {
      const qLower = cleanQuery.toLowerCase();
      existingTransactions.forEach((tx) => {
        if (!tx.locationName) return;
        const nameMatch = tx.locationName.toLowerCase().includes(qLower);
        const addrMatch = tx.locationAddress && tx.locationAddress.toLowerCase().includes(qLower);
        if (nameMatch || addrMatch) {
          const key = `${tx.locationName.toLowerCase()}_${tx.latitude || ''}_${tx.longitude || ''}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            results.push({
              placeId: tx.locationPlaceId,
              name: tx.locationName,
              address: tx.locationAddress || 'Saved location',
              latitude: tx.latitude,
              longitude: tx.longitude,
              isSaved: true,
            });
          }
        }
      });
    }

    // Prepare intelligent query variants for external geocoders
    const searchVariants: string[] = [cleanQuery];
    const words = cleanQuery.split(' ');
    if (words.length > 2) {
      const filtered = words.filter((w) => !['of', 'and', 'the', 'in', 'near', 'at', 'campus'].includes(w.toLowerCase())).join(' ');
      if (filtered !== cleanQuery && filtered.length >= 3) {
        searchVariants.push(filtered);
      }
      const shortPrefix = words.slice(0, 2).join(' ');
      if (shortPrefix.length >= 3 && !searchVariants.includes(shortPrefix)) {
        searchVariants.push(shortPrefix);
      }
    }

    // 2. Fetch external place data using Photon + Nominatim across variants
    for (const variant of searchVariants) {
      const encoded = encodeURIComponent(variant);
      const photonUrl = `https://photon.komoot.io/api/?q=${encoded}&limit=10`;
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&addressdetails=1&dedupe=1&limit=10`;

      try {
        const [photonRes, nominatimRes] = await Promise.all([
          fetch(photonUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(nominatimUrl, {
            headers: {
              'User-Agent': 'SpendlyApp/3.1 (Personal Finance Application)',
              'Accept-Language': 'en',
            },
          }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);

        // Process Photon Results
        if (photonRes && Array.isArray(photonRes.features)) {
          photonRes.features.forEach((feature: any) => {
            const props = feature.properties || {};
            const coords = feature.geometry?.coordinates;
            if (!coords || coords.length < 2) return;
            const lng = coords[0];
            const lat = coords[1];

            const name = props.name || props.street || props.locality;
            if (!name) return;

            const areaParts = [
              props.street,
              props.district || props.suburb || props.locality,
              props.city || props.town || props.state,
              props.country,
            ].filter(Boolean);

            const key = `${name.toLowerCase()}_${lat.toFixed(3)}_${lng.toFixed(3)}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              results.push({
                placeId: props.osm_id ? `osm_${props.osm_id}` : undefined,
                name,
                address: areaParts.join(', ') || props.country || 'Location',
                latitude: lat,
                longitude: lng,
              });
            }
          });
        }

        // Process Nominatim Results
        if (nominatimRes && Array.isArray(nominatimRes)) {
          nominatimRes.forEach((item: any) => {
            const addr = item.address || {};
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            if (isNaN(lat) || isNaN(lng)) return;

            const mainName =
              item.name ||
              addr.amenity ||
              addr.college ||
              addr.university ||
              addr.school ||
              addr.hospital ||
              addr.bank ||
              addr.shop ||
              addr.building ||
              addr.office ||
              addr.tourism ||
              addr.road ||
              item.display_name.split(',')[0];

            const areaDetails = [
              addr.suburb || addr.neighbourhood || addr.quarter || addr.residential,
              addr.city || addr.town || addr.village || addr.county || addr.state,
            ]
              .filter(Boolean)
              .join(', ');

            const key = `${mainName.toLowerCase()}_${lat.toFixed(3)}_${lng.toFixed(3)}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              results.push({
                placeId: String(item.place_id),
                name: mainName,
                address: areaDetails || item.display_name,
                latitude: lat,
                longitude: lng,
              });
            }
          });
        }
      } catch (err) {
        console.warn('Location search fetch error:', err);
      }
    }

    // 3. Relevance scoring & ranking
    const qTokens = cleanQuery.toLowerCase().split(/\s+/).filter((w) => !['of', 'and', 'the', 'in', 'near', 'at'].includes(w));
    const brandToken = qTokens.length > 0 ? qTokens[0] : '';

    results.sort((a, b) => {
      if (a.isSaved && !b.isSaved) return -1;
      if (!a.isSaved && b.isSaved) return 1;

      let scoreA = 0;
      let scoreB = 0;

      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      const addrA = (a.address || '').toLowerCase();
      const addrB = (b.address || '').toLowerCase();

      if (brandToken) {
        if (nameA.includes(brandToken)) scoreA += 100;
        else if (addrA.includes(brandToken)) scoreA += 50;

        if (nameB.includes(brandToken)) scoreB += 100;
        else if (addrB.includes(brandToken)) scoreB += 50;
      }

      qTokens.slice(1).forEach((tok) => {
        if (nameA.includes(tok)) scoreA += 25;
        if (addrA.includes(tok)) scoreA += 10;
        if (nameB.includes(tok)) scoreB += 25;
        if (addrB.includes(tok)) scoreB += 10;
      });

      if (nameA === cleanQuery.toLowerCase()) scoreA += 60;
      if (nameB === cleanQuery.toLowerCase()) scoreB += 60;

      return scoreB - scoreA;
    });

    return results.slice(0, 10);
  }

  // Reverse geocode latitude/longitude to place name & address
  public static async reverseGeocode(latitude: number, longitude: number): Promise<LocationResult> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SpendlyApp/3.1 (Personal Finance Application)',
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) {
        return {
          name: 'Unknown Location',
          latitude,
          longitude,
        };
      }

      const data = await response.json();
      const addr = data.address || {};

      const name =
        data.name ||
        addr.amenity ||
        addr.shop ||
        addr.building ||
        addr.road ||
        addr.suburb ||
        addr.city ||
        'Unknown Location';

      const areaDetails = [
        addr.suburb || addr.neighbourhood,
        addr.city || addr.town || addr.village || addr.state,
      ]
        .filter(Boolean)
        .join(', ');

      return {
        placeId: data.place_id ? String(data.place_id) : undefined,
        name: name.trim() || 'Unknown Location',
        address: areaDetails || data.display_name || undefined,
        latitude,
        longitude,
      };
    } catch (err) {
      console.warn('Reverse geocoding warning:', err);
      return {
        name: 'Unknown Location',
        latitude,
        longitude,
      };
    }
  }

  // Create manual location entry
  public static createManualLocation(name: string, areaOrCity?: string): LocationResult {
    return {
      name: name.trim() || 'Manual Location',
      address: areaOrCity?.trim() || undefined,
      isManual: true,
    };
  }
}
