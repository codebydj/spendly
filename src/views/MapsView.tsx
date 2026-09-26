import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Transaction, TransactionType } from '../types/finance';
import {
  MapPin,
  Filter,
  X,
  Compass,
  List as ListIcon,
  Search,
  Layers,
  Maximize2,
} from 'lucide-react';
import { LocationService } from '../services/locationService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BottomSheet } from '../components/ui/BottomSheet';
import { formatINR, formatINRMasked } from '../utils/currency';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { TransactionRow } from '../components/ui/TransactionRow';

interface LocationGroup {
  locationKey: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isUnknown: boolean;
  isManual: boolean;
  totalSpent: number;
  totalIncome: number;
  transactionCount: number;
  transactions: Transaction[];
  dominantCategory: string;
  dominantType: TransactionType | 'MIXED';
  categoryBreakdown: { [categoryName: string]: number };
}

interface MapCluster {
  id: string;
  latitude: number;
  longitude: number;
  groups: LocationGroup[];
  totalSpent: number;
  transactionCount: number;
  dominantCategory: string;
  dominantType: TransactionType | 'MIXED';
  isMultiCategory: boolean;
}

// Helper to return clean inline SVG path & color class for custom Leaflet DivIcons
function getMarkerSVGDetails(
  categoryName: string = '',
  txType: TransactionType | 'MIXED' = 'EXPENSE'
): { colorClass: string; svgPath: string } {
  const name = categoryName.toLowerCase().trim();

  if (txType === 'INCOME') {
    return {
      colorClass: 'pin-income',
      svgPath: `<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`,
    };
  }

  if (txType === 'TRANSFER') {
    return {
      colorClass: 'pin-transfer',
      svgPath: `<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="M16 21l4-4-4-4"/><path d="M20 17H4"/>`,
    };
  }

  if (txType === 'MIXED') {
    return {
      colorClass: 'pin-cluster',
      svgPath: `<circle cx="12" cy="12" r="6"/>`,
    };
  }

  if (name.includes('food') || name.includes('restaurant') || name.includes('swiggy') || name.includes('zomato') || name.includes('cafe')) {
    return {
      colorClass: 'pin-expense-food',
      svgPath: `<path d="M4 3v5a2 2 0 0 0 4 0V3"/><path d="M6 3v18"/><path d="M20 14V3a4 4 0 0 0-4 4v5a2 2 0 0 0 2 2h2Zm0 0v7"/>`,
    };
  }

  if (name.includes('grocery') || name.includes('groceries') || name.includes('supermarket') || name.includes('blinkit') || name.includes('zepto')) {
    return {
      colorClass: 'pin-expense-food',
      svgPath: `<path d="m5 11 4-7"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.6-7.4"/>`,
    };
  }

  if (name.includes('shop') || name.includes('amazon') || name.includes('myntra') || name.includes('flipkart') || name.includes('zara')) {
    return {
      colorClass: 'pin-expense-shopping',
      svgPath: `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>`,
    };
  }

  if (name.includes('transport') || name.includes('uber') || name.includes('ola') || name.includes('bus') || name.includes('auto') || name.includes('taxi')) {
    return {
      colorClass: 'pin-expense-transport',
      svgPath: `<path d="m19 17-2-6H7l-2 6"/><path d="M14 17H10"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M3 11v6h18v-6l-2-6H5Z"/>`,
    };
  }

  if (name.includes('fuel') || name.includes('petrol') || name.includes('diesel') || name.includes('shell')) {
    return {
      colorClass: 'pin-expense-transport',
      svgPath: `<line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/>`,
    };
  }

  if (name.includes('bill') || name.includes('utility') || name.includes('electricity') || name.includes('water') || name.includes('dth') || name.includes('rent') || name.includes('house')) {
    return {
      colorClass: 'pin-expense-bills',
      svgPath: `<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/>`,
    };
  }

  if (name.includes('education') || name.includes('tuition') || name.includes('school') || name.includes('college') || name.includes('course') || name.includes('book')) {
    return {
      colorClass: 'pin-expense-education',
      svgPath: `<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>`,
    };
  }

  if (name.includes('entertainment') || name.includes('movie') || name.includes('netflix') || name.includes('spotify') || name.includes('pvr')) {
    return {
      colorClass: 'pin-expense-entertainment',
      svgPath: `<rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18"/><line x1="7" x2="7" y1="2" y2="22"/><line x1="17" x2="17" y1="2" y2="22"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="2" x2="7" y1="7" y2="7"/><line x1="2" x2="7" y1="17" y2="17"/><line x1="17" x2="22" y1="17" y2="17"/><line x1="17" x2="22" y1="7" y2="7"/>`,
    };
  }

  if (name.includes('health') || name.includes('medical') || name.includes('doctor') || name.includes('pharmacy') || name.includes('hospital')) {
    return {
      colorClass: 'pin-expense-health',
      svgPath: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>`,
    };
  }

  if (name.includes('travel') || name.includes('flight') || name.includes('hotel')) {
    return {
      colorClass: 'pin-expense-transport',
      svgPath: `<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.7 5.2c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/>`,
    };
  }

  return {
    colorClass: 'pin-expense-general',
    svgPath: `<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>`,
  };
}

export const MapsView: React.FC = () => {
  const {
    transactions,
    categories,
    settings,
    showToast,
    setCurrentView,
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const hasInitialFitRef = useRef<boolean>(false);

  // View, Zoom & Filter State
  const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');
  const [currentZoom, setCurrentZoom] = useState<number>(12);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [locationTypeFilter, setLocationTypeFilter] = useState<'ALL' | 'KNOWN' | 'UNKNOWN' | 'MANUAL'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'MONTH'>('MONTH');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<LocationGroup | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState<boolean>(false);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState<boolean>(false);

  // Near me filter
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingUserGPS, setIsGettingUserGPS] = useState(false);

  // 1. Filter Transactions based on controls
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStr = todayStr.slice(0, 7);

    return transactions.filter((tx) => {
      const hasCoords = tx.latitude !== undefined && tx.longitude !== undefined && !isNaN(tx.latitude) && !isNaN(tx.longitude);
      const hasLocationName = Boolean((tx.locationName && tx.locationName.trim()) || (tx.locationAddress && tx.locationAddress.trim()));

      if (!hasCoords && !hasLocationName) {
        return false;
      }

      if (locationTypeFilter === 'KNOWN' && (!hasLocationName || !hasCoords)) return false;
      if (locationTypeFilter === 'UNKNOWN' && (hasLocationName || !hasCoords)) return false;
      if (locationTypeFilter === 'MANUAL' && hasCoords) return false;

      if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;

      if (selectedAccountId !== 'ALL' && tx.accountId !== selectedAccountId && tx.toAccountId !== selectedAccountId) {
        return false;
      }

      if (selectedCategoryId !== 'ALL' && tx.categoryId !== selectedCategoryId) return false;

      if (dateFilter === 'TODAY' && tx.date !== todayStr) return false;
      if (dateFilter === 'MONTH' && !tx.date.startsWith(monthStr)) return false;
      if (dateFilter === '7DAYS') {
        const txDate = new Date(tx.date).getTime();
        if (txDate < now.getTime() - 7 * 86400000) return false;
      }
      if (dateFilter === '30DAYS') {
        const txDate = new Date(tx.date).getTime();
        if (txDate < now.getTime() - 30 * 86400000) return false;
      }

      if (isNearMeActive && userCoords && hasCoords) {
        const distanceKm = getHaversineDistance(userCoords.lat, userCoords.lng, tx.latitude!, tx.longitude!);
        if (distanceKm > 5) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, dateFilter, selectedCategoryId, selectedAccountId, locationTypeFilter, isNearMeActive, userCoords]);

  function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // 2. Group transactions into LocationGroups
  const locationGroups = useMemo(() => {
    const groupsMap: { [key: string]: LocationGroup } = {};

    filteredTransactions.forEach((tx) => {
      const hasCoords = tx.latitude !== undefined && tx.longitude !== undefined && !isNaN(tx.latitude) && !isNaN(tx.longitude);
      const rawName = tx.locationName ? tx.locationName.trim() : '';

      let key: string;
      let name: string;
      let isUnknown = false;
      let isManual = false;

      if (hasCoords) {
        const approxLat = Number(tx.latitude!.toFixed(3));
        const approxLng = Number(tx.longitude!.toFixed(3));
        if (rawName && rawName.toLowerCase() !== 'unknown location') {
          name = rawName;
          key = `known_${approxLat}_${approxLng}_${rawName.toLowerCase().replace(/\s+/g, '_')}`;
        } else {
          name = 'Unknown Location';
          isUnknown = true;
          key = `unknown_${approxLat}_${approxLng}`;
        }
      } else {
        name = rawName || tx.locationAddress || 'Manual Location';
        isManual = true;
        key = `manual_${name.toLowerCase().replace(/\s+/g, '_')}`;
      }

      const catName = categories.find((c) => c.id === tx.categoryId)?.name || 'General';

      if (!groupsMap[key]) {
        groupsMap[key] = {
          locationKey: key,
          name,
          address: tx.locationAddress,
          latitude: hasCoords ? tx.latitude : undefined,
          longitude: hasCoords ? tx.longitude : undefined,
          isUnknown,
          isManual,
          totalSpent: 0,
          totalIncome: 0,
          transactionCount: 0,
          transactions: [],
          dominantCategory: catName,
          dominantType: tx.type,
          categoryBreakdown: {},
        };
      }

      const group = groupsMap[key];
      group.transactions.push(tx);
      group.transactionCount += 1;
      if (tx.type === 'EXPENSE') {
        group.totalSpent += tx.amount;
      } else if (tx.type === 'INCOME') {
        group.totalIncome += tx.amount;
      }

      group.categoryBreakdown[catName] = (group.categoryBreakdown[catName] || 0) + tx.amount;
    });

    Object.values(groupsMap).forEach((group) => {
      const types = new Set(group.transactions.map((t) => t.type));
      if (types.size === 1) {
        group.dominantType = Array.from(types)[0];
      } else {
        group.dominantType = 'MIXED';
      }

      let topCat = 'General';
      let maxAmt = -1;
      Object.entries(group.categoryBreakdown).forEach(([cName, amt]) => {
        if (amt > maxAmt) {
          maxAmt = amt;
          topCat = cName;
        }
      });
      group.dominantCategory = topCat;
    });

    return Object.values(groupsMap);
  }, [filteredTransactions, categories]);

  // 3. Zoom-aware spatial clustering algorithm
  const mapClusters = useMemo(() => {
    const mapGroups = locationGroups.filter((g) => g.latitude !== undefined && g.longitude !== undefined);
    if (mapGroups.length === 0) return [];

    // Spatial clustering threshold in degrees depending on zoom
    let clusterThreshold = 0.005; // ~500m for street zoom (>=13)
    if (currentZoom < 10) {
      clusterThreshold = 0.12; // ~12-15km for regional zoom (<10)
    } else if (currentZoom <= 12) {
      clusterThreshold = 0.035; // ~3.5km for district zoom (10-12)
    }

    const clusters: MapCluster[] = [];

    mapGroups.forEach((group) => {
      let addedToCluster = false;

      for (const cluster of clusters) {
        const distance = Math.hypot(cluster.latitude - group.latitude!, cluster.longitude - group.longitude!);
        if (distance <= clusterThreshold) {
          cluster.groups.push(group);
          cluster.transactionCount += group.transactionCount;
          cluster.totalSpent += group.totalSpent;
          addedToCluster = true;
          break;
        }
      }

      if (!addedToCluster) {
        clusters.push({
          id: `cluster_${group.locationKey}`,
          latitude: group.latitude!,
          longitude: group.longitude!,
          groups: [group],
          totalSpent: group.totalSpent,
          transactionCount: group.transactionCount,
          dominantCategory: group.dominantCategory,
          dominantType: group.dominantType,
          isMultiCategory: false,
        });
      }
    });

    // Compute cluster multi-category & type metadata
    clusters.forEach((cluster) => {
      const categoriesSet = new Set(cluster.groups.map((g) => g.dominantCategory));
      const typesSet = new Set(cluster.groups.map((g) => g.dominantType));
      cluster.isMultiCategory = categoriesSet.size > 1;

      if (typesSet.size === 1) {
        cluster.dominantType = Array.from(typesSet)[0];
      } else {
        cluster.dominantType = 'MIXED';
      }
    });

    return clusters;
  }, [locationGroups, currentZoom]);

  // Filter location groups by search query
  const displayedLocationGroups = useMemo(() => {
    if (!searchQuery.trim()) return locationGroups;
    const q = searchQuery.toLowerCase().trim();
    return locationGroups.filter((g) =>
      g.name.toLowerCase().includes(q) || (g.address && g.address.toLowerCase().includes(q))
    );
  }, [locationGroups, searchQuery]);

  // Top Spending Places
  const topLocations = useMemo(() => {
    return [...locationGroups].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  }, [locationGroups]);

  const maxTopSpent = useMemo(() => {
    return Math.max(...topLocations.map((l) => l.totalSpent), 1);
  }, [topLocations]);

  // Summary Metrics
  const mappedPlacesCount = useMemo(
    () => locationGroups.filter((g) => g.latitude !== undefined && g.longitude !== undefined).length,
    [locationGroups]
  );
  const unmappedPlacesCount = useMemo(
    () => locationGroups.filter((g) => g.latitude === undefined || g.longitude === undefined).length,
    [locationGroups]
  );
  const totalLocationSpending = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const activeFilterCount =
    (typeFilter !== 'ALL' ? 1 : 0) +
    (locationTypeFilter !== 'ALL' ? 1 : 0) +
    (dateFilter !== 'MONTH' ? 1 : 0) +
    (selectedCategoryId !== 'ALL' ? 1 : 0) +
    (selectedAccountId !== 'ALL' ? 1 : 0) +
    (isNearMeActive ? 1 : 0);

  // 4A. Initialize Leaflet Map ONCE on component mount with Mobile/Capacitor WebView protection
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id) {
      (mapContainerRef.current as any)._leaflet_id = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      tap: true,
      bounceAtZoomLimits: false,
    } as any).setView([16.5062, 80.648], 12);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map);

    // Track zoom level changes for adaptive density & marker sizing (WITHOUT camera reset)
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Track camera position for session preservation (Map -> List -> Map or Tab Switch)
    map.on('moveend zoomend', () => {
      if (leafletMapRef.current) {
        const center = leafletMapRef.current.getCenter();
        const zoom = leafletMapRef.current.getZoom();
        sessionStorage.setItem('spendly_map_last_camera', JSON.stringify({ lat: center.lat, lng: center.lng, zoom }));
      }
    });

    leafletMapRef.current = map;

    // Use ResizeObserver for responsive container dimension changes (keyboard, drawer, orientation)
    let resizeObserver: ResizeObserver | null = null;
    if (window.ResizeObserver && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (leafletMapRef.current) {
          requestAnimationFrame(() => {
            if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
          });
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // Capacitor Native Android App Resume Listener
    let capacitorListener: any = null;
    try {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', (state) => {
          if (state.isActive && leafletMapRef.current) {
            setTimeout(() => {
              if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
            }, 100);
          }
        }).then((l) => {
          capacitorListener = l;
        });
      }).catch(() => {});
    } catch (e) {}

    setTimeout(() => {
      if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
    }, 100);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (capacitorListener && typeof capacitorListener.remove === 'function') {
        capacitorListener.remove();
      }
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersRef.current = [];
        hasInitialFitRef.current = false;
      }
    };
  }, []); // Empty dependency array — map persists across rerenders!

  // 4B. Handle Map invalidateSize when switching back from List view
  useEffect(() => {
    if (viewMode === 'MAP' && leafletMapRef.current) {
      setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 50);
    }
  }, [viewMode]);

  // 4C. Initial Map Fit ONCE when location groups first load (or restore session camera)
  useEffect(() => {
    if (!leafletMapRef.current) return;
    if (hasInitialFitRef.current) return;

    // Check for focus location requested from Calendar or Transactions list FIRST
    const focusTxId = sessionStorage.getItem('spendly_map_focus_tx_id');
    if (focusTxId) {
      sessionStorage.removeItem('spendly_map_focus_tx_id');
      const targetGroup = locationGroups.find((g) => g.transactions.some((t) => t.id === focusTxId));
      if (targetGroup && targetGroup.latitude && targetGroup.longitude) {
        setSelectedGroup(targetGroup);
        leafletMapRef.current.flyTo([targetGroup.latitude, targetGroup.longitude], 15, { duration: 0.6 });
        hasInitialFitRef.current = true;
        return;
      }
    }

    // Check if session camera state exists from previous navigation
    const savedCamera = sessionStorage.getItem('spendly_map_last_camera');
    if (savedCamera) {
      try {
        const { lat, lng, zoom } = JSON.parse(savedCamera);
        if (lat && lng && zoom) {
          leafletMapRef.current.setView([lat, lng], zoom, { animate: false });
          hasInitialFitRef.current = true;
          return;
        }
      } catch (e) {
        // Fallthrough to bounds fit
      }
    }

    const mapGroups = locationGroups.filter((g) => g.latitude !== undefined && g.longitude !== undefined);
    if (mapGroups.length > 0) {
      const bounds = L.latLngBounds([]);
      mapGroups.forEach((g) => bounds.extend([g.latitude!, g.longitude!]));
      if (bounds.isValid()) {
        leafletMapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        hasInitialFitRef.current = true;
      }
    }
  }, [locationGroups]);

  // 4D. Dynamically update Leaflet Markers without modifying camera position
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (mapClusters.length === 0) return;

    // Compute sizing density class based on zoom level
    let sizeClass = 'size-medium';
    let iconPx = 21;
    if (currentZoom < 10) {
      sizeClass = 'size-small';
      iconPx = 17;
    } else if (currentZoom >= 14) {
      sizeClass = 'size-large';
      iconPx = 25;
    }

    mapClusters.forEach((cluster) => {
      const isSelected = selectedGroup && cluster.groups.some((g) => g.locationKey === selectedGroup.locationKey);
      const isMultiLocationCluster = cluster.groups.length > 1;

      let customIcon: L.DivIcon;

      if (isMultiLocationCluster) {
        // Distinct Geographic Cluster Pin (Circular Spendly Blue Badge)
        const labelText = `${cluster.groups.length} places • ${cluster.transactionCount} txs`;
        const showLabelPill = isSelected || currentZoom >= 11;

        customIcon = L.divIcon({
          className: 'custom-map-pin-container',
          html: `
            <div class="modern-pin-wrapper ${isSelected ? 'selected' : ''}">
              <div class="modern-pin-body pin-cluster ${sizeClass} ${isSelected ? 'selected' : ''}">
                <div class="modern-pin-inner">
                  <span style="font-size: ${isSelected ? '1rem' : currentZoom < 10 ? '0.78rem' : '0.88rem'}; font-weight: 800;">${cluster.transactionCount}</span>
                </div>
              </div>
              ${showLabelPill ? `<div class="spendly-marker-label">${labelText}</div>` : ''}
            </div>
          `,
          iconSize: isSelected ? [54, 54] : currentZoom < 10 ? [32, 32] : currentZoom >= 14 ? [48, 48] : [40, 40],
          iconAnchor: isSelected ? [27, 27] : currentZoom < 10 ? [16, 16] : currentZoom >= 14 ? [24, 24] : [20, 20],
        });
      } else {
        // Single Location Group Pin (Teardrop Pin with Category Icon & attached Count Badge)
        const primaryGroup = cluster.groups[0];
        const markerInfo = getMarkerSVGDetails(primaryGroup.dominantCategory, primaryGroup.dominantType);

        const currentIconPx = isSelected ? 28 : iconPx;
        const svgInner = `<svg width="${currentIconPx}" height="${currentIconPx}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${markerInfo.svgPath}</svg>`;

        const showLabelPill = isSelected || (currentZoom >= 11 && primaryGroup.totalSpent > 0);
        const labelText = `${formatINRMasked(primaryGroup.totalSpent, settings.hideBalances)} • ${primaryGroup.transactionCount} tx${primaryGroup.transactionCount > 1 ? 's' : ''}`;

        customIcon = L.divIcon({
          className: 'custom-map-pin-container',
          html: `
            <div class="modern-pin-wrapper ${isSelected ? 'selected' : ''}">
              <div class="modern-pin-body ${markerInfo.colorClass} ${sizeClass} ${isSelected ? 'selected' : ''}">
                <div class="modern-pin-inner">
                  ${svgInner}
                </div>
                ${primaryGroup.transactionCount > 1 ? `<div class="spendly-pin-badge">${primaryGroup.transactionCount}</div>` : ''}
              </div>
              ${showLabelPill ? `<div class="spendly-marker-label">${labelText}</div>` : ''}
            </div>
          `,
          iconSize: isSelected ? [54, 60] : currentZoom < 10 ? [32, 38] : currentZoom >= 14 ? [48, 54] : [40, 46],
          iconAnchor: isSelected ? [27, 58] : currentZoom < 10 ? [16, 36] : currentZoom >= 14 ? [24, 52] : [20, 44],
        });
      }

      let zIndex = 100;
      if (isSelected) zIndex = 1000;
      else if (isMultiLocationCluster) zIndex = 300;

      const marker = L.marker([cluster.latitude, cluster.longitude], {
        icon: customIcon,
        zIndexOffset: zIndex,
      }).addTo(map);

      marker.on('click', () => {
        if (isMultiLocationCluster) {
          if (currentZoom < 15) {
            const clusterBounds = L.latLngBounds([]);
            cluster.groups.forEach((g) => {
              if (g.latitude && g.longitude) clusterBounds.extend([g.latitude, g.longitude]);
            });

            if (clusterBounds.isValid() && clusterBounds.getNorthEast().distanceTo(clusterBounds.getSouthWest()) > 10) {
              map.fitBounds(clusterBounds, { padding: [60, 60], maxZoom: 16 });
            } else {
              map.flyTo([cluster.latitude, cluster.longitude], currentZoom + 2, { duration: 0.4 });
            }
          } else {
            setSelectedGroup(cluster.groups[0]);
            map.panTo([cluster.latitude, cluster.longitude], { animate: true });
            if (window.innerWidth <= 768) {
              setIsMobileSheetOpen(true);
            }
          }
        } else {
          setSelectedGroup(cluster.groups[0]);
          map.panTo([cluster.latitude, cluster.longitude], { animate: true });
          if (window.innerWidth <= 768) {
            setIsMobileSheetOpen(true);
          }
        }
      });

      markersRef.current.push(marker);
    });
  }, [mapClusters, currentZoom, selectedGroup, settings.hideBalances]);

  const handleSelectGroup = (group: LocationGroup) => {
    setSelectedGroup(group);
    if (group.latitude !== undefined && group.longitude !== undefined && leafletMapRef.current) {
      leafletMapRef.current.flyTo([group.latitude, group.longitude], 15, { duration: 0.5 });
    }
    if (window.innerWidth <= 768) {
      setIsMobileSheetOpen(true);
    }
  };

  const handleFitTransactions = () => {
    if (!leafletMapRef.current) return;
    const mapGroups = locationGroups.filter((g) => g.latitude !== undefined && g.longitude !== undefined);
    if (mapGroups.length === 0) return;

    const bounds = L.latLngBounds([]);
    mapGroups.forEach((g) => bounds.extend([g.latitude!, g.longitude!]));
    if (bounds.isValid()) {
      leafletMapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  };

  const handleToggleNearMe = async () => {
    if (isNearMeActive) {
      setIsNearMeActive(false);
      return;
    }

    setIsGettingUserGPS(true);
    try {
      const coords = await LocationService.getCurrentCoordinates();
      setUserCoords({ lat: coords.latitude, lng: coords.longitude });
      setIsNearMeActive(true);

      if (leafletMapRef.current) {
        leafletMapRef.current.setView([coords.latitude, coords.longitude], 14, { animate: true });
      }
      showToast('Filtering transactions within 5km radius', 'info');
    } catch (err: any) {
      showToast(err.message || 'Unable to get location', 'warning');
    } finally {
      setIsGettingUserGPS(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Card */}
      <div className="card-level-3 hero-blue-glow" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={24} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>Locations</h2>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            See where your money goes. Explore spending by place and transaction location.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleFitTransactions}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', gap: '6px' }}
            title="Focus map on visible transactions"
          >
            <Maximize2 size={15} color="var(--accent-cyan)" />
            <span>Fit Map</span>
          </button>
          <button
            onClick={handleToggleNearMe}
            className={`btn ${isNearMeActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.82rem', gap: '6px' }}
          >
            <Compass size={16} />
            {isGettingUserGPS ? 'Locating...' : isNearMeActive ? 'Near Me (Active)' : 'Near Me (5km)'}
          </button>
        </div>
      </div>

      {/* 2. Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
        <div className="card-level-2" style={{ padding: '14px 18px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Location Spending
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }} className="tabular-nums">
            {formatINRMasked(totalLocationSpending, settings.hideBalances)}
          </div>
        </div>

        <div className="card-level-2" style={{ padding: '14px 18px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Mapped Places
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {mappedPlacesCount}
          </div>
        </div>

        <div className="card-level-2" style={{ padding: '14px 18px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Unmapped / Manual
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: unmappedPlacesCount > 0 ? 'var(--status-warning)' : 'var(--text-primary)', marginTop: '4px' }}>
            {unmappedPlacesCount}
          </div>
        </div>
      </div>

      {/* 3. Search Bar, Filter Drawer Trigger, & Segmented Control */}
      <div className="card-level-2" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 0 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '36px',
              paddingRight: '12px',
              paddingTop: '8px',
              paddingBottom: '8px',
              fontSize: '0.84rem',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', minHeight: '36px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Filter size={15} color="var(--accent-cyan)" />
            <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
          </button>

          <div style={{ display: 'flex', backgroundColor: 'var(--bg-main)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setViewMode('MAP')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: viewMode === 'MAP' ? 'var(--accent-blue)' : 'transparent',
                color: viewMode === 'MAP' ? '#FFFFFF' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Compass size={15} />
              <span>Map</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: viewMode === 'LIST' ? 'var(--accent-blue)' : 'transparent',
                color: viewMode === 'LIST' ? '#FFFFFF' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <ListIcon size={15} />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Content: Map / List & Desktop Detail Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 340px)', gap: '20px' }} className="maps-responsive-grid">
        <div style={{ position: 'relative', width: '100%', height: '520px' }}>
          {/* LIST View Container */}
          <div
            className="card-level-2"
            style={{
              display: viewMode === 'LIST' ? 'flex' : 'none',
              padding: '20px',
              height: '100%',
              overflowY: 'auto',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Location Summaries ({displayedLocationGroups.length})
            </h3>
            {displayedLocationGroups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                No matching location records found.
              </div>
            ) : (
              displayedLocationGroups.map((loc) => (
                <div
                  key={loc.locationKey}
                  onClick={() => handleSelectGroup(loc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    backgroundColor: selectedGroup?.locationKey === loc.locationKey ? 'rgba(86, 133, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: selectedGroup?.locationKey === loc.locationKey ? '1px solid var(--accent-blue)' : '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CategoryIcon categoryName={loc.dominantCategory} size={18} />
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{loc.name}</h4>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {loc.transactionCount} transaction{loc.transactionCount > 1 ? 's' : ''} • {loc.dominantCategory}
                      </span>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--status-expense)' }} className="tabular-nums">
                    {formatINRMasked(loc.totalSpent, settings.hideBalances)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* MAP Container */}
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: viewMode === 'MAP' ? 'block' : 'none',
              border: '1px solid var(--border-color)',
            }}
          />

          {/* Map Floating Legend Toggle Button */}
          {viewMode === 'MAP' && (
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 400 }}>
              <button
                type="button"
                onClick={() => setIsLegendOpen(!isLegendOpen)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px', borderRadius: '16px', backgroundColor: 'rgba(13, 17, 38, 0.9)', backdropFilter: 'blur(8px)' }}
              >
                <Layers size={14} color="var(--accent-cyan)" />
                <span>Legend</span>
              </button>

              {/* Collapsible Legend Drawer Overlay */}
              {isLegendOpen && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '12px 14px',
                    backgroundColor: 'rgba(13, 17, 38, 0.95)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.75rem',
                    minWidth: '180px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-lavender)', textTransform: 'uppercase' }}>MAP LEGEND</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F43F5E' }} /> Food & Dining
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#A855F7' }} /> Shopping
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B' }} /> Transport & Fuel
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EC4899' }} /> Bills & Rent
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#6366F1' }} /> Education
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} /> Income
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#06B6D4' }} /> Transfer
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5685FF' }} /> Multi-Tx Cluster
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Selected Location Sidebar Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedGroup ? (
            <div className="card-level-2" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-lavender)', textTransform: 'uppercase', fontWeight: 700 }}>SELECTED PLACE</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{selectedGroup.name}</h3>
                  {selectedGroup.address && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedGroup.address}</span>
                  )}
                </div>
                <button onClick={() => setSelectedGroup(null)} className="btn-icon btn-ghost" title="Close details">
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: 'rgba(15, 19, 42, 0.6)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Spent</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--status-expense)', display: 'block' }} className="tabular-nums">
                    {formatINRMasked(selectedGroup.totalSpent, settings.hideBalances)}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Transactions</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>
                    {selectedGroup.transactionCount}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Top Category</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedGroup.dominantCategory}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-lavender)', fontWeight: 700 }}>TRANSACTIONS HERE</span>
                {selectedGroup.transactions.map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} hideBalances={settings.hideBalances} />
                ))}
              </div>

              <div style={{ marginTop: '6px' }}>
                <button onClick={() => setCurrentView('transactions')} className="btn btn-primary" style={{ width: '100%', padding: '8px 12px', fontSize: '0.82rem' }}>
                  View All Transactions
                </button>
              </div>
            </div>
          ) : (
            <div className="card-level-2" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              <Compass size={28} color="var(--accent-cyan)" style={{ marginBottom: '8px' }} />
              <p>Select a location pin or place from the list to view spending details.</p>
            </div>
          )}

          {/* Unmapped Transactions Panel */}
          {unmappedPlacesCount > 0 && (
            <div className="card-level-2" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="var(--status-warning)" />
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Unmapped Places ({unmappedPlacesCount})</h4>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Transactions with text-only locations or missing map coordinates.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                {locationGroups.filter((g) => g.isManual || g.latitude === undefined).map((g) => (
                  <div key={g.locationKey} onClick={() => handleSelectGroup(g)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{g.name}</span>
                    <span style={{ color: 'var(--status-expense)' }} className="tabular-nums">{formatINR(g.totalSpent)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Top Places Section */}
      <div className="card-level-2" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Top Spending Places</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {topLocations.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>No location spending recorded yet.</div>
          ) : (
            topLocations.map((loc, idx) => {
              const barPercent = Math.min(100, Math.round((loc.totalSpent / maxTopSpent) * 100));
              return (
                <div
                  key={loc.locationKey}
                  onClick={() => handleSelectGroup(loc)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr auto',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(15, 19, 42, 0.5)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-glass)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>0{idx + 1}</span>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{loc.name}</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {loc.transactionCount} transaction{loc.transactionCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ height: '5px', width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${barPercent}%`, height: '100%', backgroundColor: 'var(--accent-blue)', borderRadius: '3px' }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--status-expense)' }} className="tabular-nums">
                    {formatINRMasked(loc.totalSpent, settings.hideBalances)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Mobile Location Detail Bottom Sheet */}
      <BottomSheet isOpen={isMobileSheetOpen} onClose={() => setIsMobileSheetOpen(false)} title={selectedGroup?.name || 'Location Details'}>
        {selectedGroup && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', backgroundColor: 'rgba(15, 19, 42, 0.6)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Spent</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--status-expense)', display: 'block' }} className="tabular-nums">
                  {formatINRMasked(selectedGroup.totalSpent, settings.hideBalances)}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Transactions</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>
                  {selectedGroup.transactionCount} transaction{selectedGroup.transactionCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-lavender)' }}>TRANSACTIONS</span>
              {selectedGroup.transactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} hideBalances={settings.hideBalances} />
              ))}
            </div>

            <button onClick={() => { setIsMobileSheetOpen(false); setCurrentView('transactions'); }} className="btn btn-primary" style={{ padding: '10px', width: '100%' }}>
              View All Transactions
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Filter Drawer Sheet */}
      <BottomSheet isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} title="Filter Locations">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '10px 0' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-lavender)', display: 'block', marginBottom: '8px' }}>
              TRANSACTION TYPE
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`btn ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-lavender)', display: 'block', marginBottom: '8px' }}>
              LOCATION STATUS
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['ALL', 'KNOWN', 'UNKNOWN', 'MANUAL'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLocationTypeFilter(l)}
                  className={`btn ${locationTypeFilter === l ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-lavender)', display: 'block', marginBottom: '8px' }}>
              DATE RANGE
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['TODAY', '7DAYS', '30DAYS', 'MONTH', 'ALL'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  className={`btn ${dateFilter === d ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={() => {
                setTypeFilter('ALL');
                setLocationTypeFilter('ALL');
                setDateFilter('ALL');
                setSelectedCategoryId('ALL');
                setSelectedAccountId('ALL');
                setIsNearMeActive(false);
              }}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '10px' }}
            >
              Reset
            </button>
            <button onClick={() => setIsFilterSheetOpen(false)} className="btn btn-primary" style={{ flex: 1, padding: '10px' }}>
              Apply Filters
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
