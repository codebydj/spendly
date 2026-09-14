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
  // Advanced Place Search combining saved workspace locations, Photon POI engine, and Nominatim
  public static async searchPlaces(
    query: string,
    existingTransactions?: { locationName?: string; locationAddress?: string; latitude?: number; longitude?: number; locationPlaceId?: string }[]
  ): Promise<LocationResult[]> {
    if (!query || query.trim().length < 2) return [];

    const cleanQuery = query.trim().replace(/\s+/g, ' ');
    const results: LocationResult[] = [];
    const seenKeys = new Set<string>();
    let rawPhotonCount = 0;
    let rawNominatimCount = 0;

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
              address: tx.locationAddress || 'Saved transaction location',
              latitude: tx.latitude,
              longitude: tx.longitude,
              isSaved: true,
            });
          }
        }
      });
    }

    // Prepare query variants for external geocoders
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

    // 2. Fetch external place data using Photon (Komoot OSMPOS) + Nominatim across search variants
    for (const variant of searchVariants) {
      const encoded = encodeURIComponent(variant);
      const photonUrl = `https://photon.komoot.io/api/?q=${encoded}&limit=8`;
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&addressdetails=1&dedupe=1&limit=8`;

      try {
        const [photonRes, nominatimRes] = await Promise.all([
          fetch(photonUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(nominatimUrl, {
            headers: {
              'User-Agent': 'SpendlyApp/1.0 (Personal Finance Application)',
              'Accept-Language': 'en',
            },
          }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);

        // Process Photon POI Results
        if (photonRes && Array.isArray(photonRes.features)) {
          rawPhotonCount += photonRes.features.length;
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
          rawNominatimCount += nominatimRes.length;
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
        console.warn('Location search error:', err);
      }
    }

    // 3. Brand-token relevance scoring & ranking algorithm
    const qTokens = cleanQuery.toLowerCase().split(/\s+/).filter((w) => !['of', 'and', 'the', 'in', 'near', 'at', 'campus'].includes(w));
    const brandToken = qTokens.length > 0 ? qTokens[0] : '';

    results.sort((a, b) => {
      // Saved local history comes first
      if (a.isSaved && !b.isSaved) return -1;
      if (!a.isSaved && b.isSaved) return 1;

      let scoreA = 0;
      let scoreB = 0;

      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      const addrA = (a.address || '').toLowerCase();
      const addrB = (b.address || '').toLowerCase();

      // Brand token matching (+100 for brand match, -50 penalty if brand missing)
      if (brandToken) {
        if (nameA.includes(brandToken)) scoreA += 100;
        else if (addrA.includes(brandToken)) scoreA += 50;
        else scoreA -= 50;

        if (nameB.includes(brandToken)) scoreB += 100;
        else if (addrB.includes(brandToken)) scoreB += 50;
        else scoreB -= 50;
      }

      // Secondary Token Matches
      qTokens.slice(1).forEach((tok) => {
        if (nameA.includes(tok)) scoreA += 20;
        if (addrA.includes(tok)) scoreA += 10;
        if (nameB.includes(tok)) scoreB += 20;
        if (addrB.includes(tok)) scoreB += 10;
      });

      // Exact name match boost
      if (nameA === cleanQuery.toLowerCase()) scoreA += 50;
      if (nameB === cleanQuery.toLowerCase()) scoreB += 50;

      return scoreB - scoreA;
    });

    const finalResults = results.slice(0, 8);

    // Development Debug Logging
    console.log('LOCATION SEARCH', {
      query: cleanQuery,
      photonRaw: rawPhotonCount,
      nominatimRaw: rawNominatimCount,
      parsed: results.length,
      final: finalResults.length,
    });

    return finalResults;
  }

  // Create manual location entry when place is not found in geocoder
  public static createManualLocation(name: string, areaOrCity?: string): LocationResult {
    return {
      name: name.trim(),
      address: areaOrCity?.trim() || undefined,
      isManual: true,
    };
  }

  // Get current device GPS location
  public static async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your device browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('GPS location error:', error);
          if (error.code === error.PERMISSION_DENIED) {
            reject(new Error('Location access is turned off. You can enter a place manually instead.'));
          } else {
            reject(new Error('Unable to determine current location. Please enter location manually.'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    });
  }

  // Reverse geocode latitude/longitude to place name & address
  public static async reverseGeocode(latitude: number, longitude: number): Promise<LocationResult> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SpendlyApp/1.0 (Personal Finance Application)',
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) {
        return {
          name: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
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
        'Current Location';

      const areaDetails = [
        addr.suburb || addr.neighbourhood,
        addr.city || addr.town || addr.village || addr.county,
      ]
        .filter(Boolean)
        .join(', ');

      return {
        placeId: data.place_id ? String(data.place_id) : undefined,
        name,
        address: areaDetails || data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        latitude,
        longitude,
      };
    } catch (err) {
      console.warn('Reverse geocoding warning:', err);
      return {
        name: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        latitude,
        longitude,
      };
    }
  }

  // Get device current GPS coordinates
  public static async getCurrentCoordinates(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your device browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        (err) => {
          reject(new Error(err.message || 'Unable to retrieve location coordinates.'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }
}
