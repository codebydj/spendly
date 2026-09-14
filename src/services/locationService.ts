export interface LocationResult {
  placeId?: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export class LocationService {
  // Search places using OpenStreetMap Nominatim API (Free, no API key required)
  public static async searchPlaces(query: string): Promise<LocationResult[]> {
    if (!query || query.trim().length < 2) return [];

    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&addressdetails=1&limit=5`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SpendlyApp/1.0 (Personal Finance App)',
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => {
        const addr = item.address || {};
        const mainName = item.name || addr.amenity || addr.shop || addr.building || addr.road || item.display_name.split(',')[0];
        
        const areaDetails = [
          addr.suburb || addr.neighbourhood || addr.quarter || addr.residential,
          addr.city || addr.town || addr.village || addr.county || addr.state,
        ].filter(Boolean).join(', ');

        return {
          placeId: String(item.place_id),
          name: mainName,
          address: areaDetails || item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        };
      });
    } catch (err) {
      console.warn('Location search warning:', err);
      return [];
    }
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
          'User-Agent': 'SpendlyApp/1.0 (Personal Finance App)',
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

      const name = data.name || addr.amenity || addr.shop || addr.building || addr.road || addr.suburb || 'Current Location';
      const areaDetails = [
        addr.suburb || addr.neighbourhood,
        addr.city || addr.town || addr.village || addr.county,
      ].filter(Boolean).join(', ');

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
}
