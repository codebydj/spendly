import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Transaction, TransactionType } from '../types/finance';
import { MapPin, Filter, Sparkles, X, ChevronRight, Compass, ExternalLink, List as ListIcon, Search, Pencil, Plus } from 'lucide-react';
import { LocationService } from '../services/locationService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationGroup {
  locationKey: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isUnknown: boolean;
  isManual: boolean;
  totalSpent: number;
  transactionCount: number;
  transactions: Transaction[];
  categoryBreakdown: { [categoryName: string]: number };
}

export const MapsView: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    settings,
    showToast,
    editTransaction,
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // View & Filter State
  const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [locationTypeFilter, setLocationTypeFilter] = useState<'ALL' | 'KNOWN' | 'UNKNOWN' | 'MANUAL'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'MONTH'>('MONTH');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<LocationGroup | null>(null);

  // Near me filter
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingUserGPS, setIsGettingUserGPS] = useState(false);

  // Edit Location Modal State
  const [isEditLocationOpen, setIsEditLocationOpen] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [editAddressInput, setEditAddressInput] = useState('');
  const [editLatInput, setEditLatInput] = useState('');
  const [editLngInput, setEditLngInput] = useState('');
  const [isSavingLocationEdit, setIsSavingLocationEdit] = useState(false);

  // Manual Add Location Modal State
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [selectedTxForManualLoc, setSelectedTxForManualLoc] = useState<string>('');
  const [manualNameInput, setManualNameInput] = useState('');
  const [manualAddressInput, setManualAddressInput] = useState('');
  const [manualLatInput, setManualLatInput] = useState('');
  const [manualLngInput, setManualLngInput] = useState('');

  // 1. Filter Transactions based on controls
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStr = todayStr.slice(0, 7);

    return transactions.filter((tx) => {
      const hasCoords = tx.latitude !== undefined && tx.longitude !== undefined && !isNaN(tx.latitude) && !isNaN(tx.longitude);
      const hasLocationName = Boolean((tx.locationName && tx.locationName.trim()) || (tx.locationAddress && tx.locationAddress.trim()));

      // Must have EITHER valid lat/lng OR a location name/address
      if (!hasCoords && !hasLocationName) {
        return false;
      }

      // Location Type Filter
      if (locationTypeFilter === 'KNOWN' && (!hasLocationName || !hasCoords)) return false;
      if (locationTypeFilter === 'UNKNOWN' && (hasLocationName || !hasCoords)) return false;
      if (locationTypeFilter === 'MANUAL' && hasCoords) return false;

      // Type Filter
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;

      // Account Filter
      if (selectedAccountId !== 'ALL' && tx.accountId !== selectedAccountId && tx.toAccountId !== selectedAccountId) {
        return false;
      }

      // Category Filter
      if (selectedCategoryId !== 'ALL' && tx.categoryId !== selectedCategoryId) return false;

      // Date Filter
      if (dateFilter === 'TODAY' && tx.date !== todayStr) return false;
      if (dateFilter === 'MONTH' && !tx.date.startsWith(monthStr)) return false;
      if (dateFilter === '7DAYS') {
        const txDate = new Date(tx.date).getTime();
        const past7 = now.getTime() - 7 * 84600000;
        if (txDate < past7) return false;
      }
      if (dateFilter === '30DAYS') {
        const txDate = new Date(tx.date).getTime();
        const past30 = now.getTime() - 30 * 84600000;
        if (txDate < past30) return false;
      }

      // Near Me Filter (~5km radius check)
      if (isNearMeActive && userCoords && hasCoords) {
        const distanceKm = getHaversineDistance(userCoords.lat, userCoords.lng, tx.latitude!, tx.longitude!);
        if (distanceKm > 5) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, dateFilter, selectedCategoryId, selectedAccountId, locationTypeFilter, isNearMeActive, userCoords]);

  // Haversine distance calculator
  function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
          transactionCount: 0,
          transactions: [],
          categoryBreakdown: {},
        };
      }

      const group = groupsMap[key];
      group.transactions.push(tx);
      group.transactionCount += 1;
      if (tx.type === 'EXPENSE') {
        group.totalSpent += tx.amount;
      }
      group.categoryBreakdown[catName] = (group.categoryBreakdown[catName] || 0) + tx.amount;
    });

    return Object.values(groupsMap);
  }, [filteredTransactions, categories]);

  // Filter location groups by search query
  const displayedLocationGroups = useMemo(() => {
    if (!searchQuery.trim()) return locationGroups;
    const q = searchQuery.toLowerCase().trim();
    return locationGroups.filter((g) =>
      g.name.toLowerCase().includes(q) || (g.address && g.address.toLowerCase().includes(q))
    );
  }, [locationGroups, searchQuery]);

  // Top Spending Locations sorted by totalSpent
  const topLocations = useMemo(() => {
    return [...locationGroups].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  }, [locationGroups]);

  // Real Location Statistics
  const knownLocationsCount = useMemo(() => locationGroups.filter((g) => !g.isUnknown && !g.isManual).length, [locationGroups]);
  const unknownLocationsCount = useMemo(() => locationGroups.filter((g) => g.isUnknown || g.isManual).length, [locationGroups]);
  const totalLocationSpending = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  // 3. Initialize & Update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([16.5062, 80.648], 12);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add Markers for LocationGroups that have coordinates
    const mapGroups = locationGroups.filter((g) => g.latitude !== undefined && g.longitude !== undefined);

    if (mapGroups.length > 0) {
      const bounds = L.latLngBounds([]);

      mapGroups.forEach((group) => {
        const point = L.latLng(group.latitude!, group.longitude!);
        bounds.extend(point);

        const isSelected = selectedGroup?.locationKey === group.locationKey;
        const isUnknown = group.isUnknown;

        const pinSvg = isUnknown
          ? `<span style="font-weight:800; font-size:0.75rem;">?</span>`
          : `<svg width="${isSelected ? 22 : 18}" height="${isSelected ? 22 : 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

        const customIcon = L.divIcon({
          className: 'custom-map-pin-container',
          html: `
            <div class="modern-pin-wrapper">
              <div class="modern-pin-body ${isSelected ? 'selected' : ''}" style="${isUnknown ? 'background: linear-gradient(135deg, #f59e0b, #d97706);' : ''}">
                <div class="modern-pin-inner">
                  ${group.transactionCount > 1 ? group.transactionCount : pinSvg}
                </div>
              </div>
              <div class="modern-pin-pulse"></div>
            </div>
          `,
          iconSize: [48, 56],
          iconAnchor: [24, 52],
        });

        const marker = L.marker([group.latitude!, group.longitude!], { icon: customIcon }).addTo(map);

        marker.on('click', () => {
          setSelectedGroup(group);
          map.panTo([group.latitude!, group.longitude!], { animate: true });
        });

        markersRef.current.push(marker);
      });

      if (!selectedGroup && mapGroups.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [locationGroups, selectedGroup]);

  // Handle Near Me Toggle
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

  // Open Edit Location Modal for Selected Group
  const handleOpenEditLocation = (group: LocationGroup) => {
    setEditNameInput(group.isUnknown ? '' : group.name);
    setEditAddressInput(group.address || '');
    setEditLatInput(group.latitude !== undefined ? String(group.latitude) : '');
    setEditLngInput(group.longitude !== undefined ? String(group.longitude) : '');
    setIsEditLocationOpen(true);
  };

  // Save Edit Location
  const handleSaveLocationEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || selectedGroup.transactions.length === 0) return;

    const newName = editNameInput.trim();
    const newAddress = editAddressInput.trim();
    const parsedLat = editLatInput.trim() ? parseFloat(editLatInput.trim()) : undefined;
    const parsedLng = editLngInput.trim() ? parseFloat(editLngInput.trim()) : undefined;

    if (!newName && !newAddress) {
      showToast('Please enter a location name or address', 'warning');
      return;
    }

    setIsSavingLocationEdit(true);

    try {
      // Update all transactions in this group
      for (const tx of selectedGroup.transactions) {
        await editTransaction(tx.id, {
          ...tx,
          locationName: newName || undefined,
          locationAddress: newAddress || undefined,
          latitude: parsedLat !== undefined && !isNaN(parsedLat) ? parsedLat : undefined,
          longitude: parsedLng !== undefined && !isNaN(parsedLng) ? parsedLng : undefined,
        });
      }

      showToast(`Updated location for ${selectedGroup.transactions.length} transaction(s)`, 'success');
      setIsEditLocationOpen(false);
      setSelectedGroup(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update location', 'danger');
    } finally {
      setIsSavingLocationEdit(false);
    }
  };

  // Open Add Manual Location Modal
  const handleOpenAddManualModal = () => {
    setManualNameInput('');
    setManualAddressInput('');
    setManualLatInput('');
    setManualLngInput('');
    setSelectedTxForManualLoc(transactions.length > 0 ? transactions[0].id : '');
    setIsAddManualOpen(true);
  };

  // Save Manual Location to Transaction
  const handleSaveManualLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxForManualLoc) {
      showToast('Please select a transaction', 'warning');
      return;
    }

    const name = manualNameInput.trim();
    const address = manualAddressInput.trim();
    const lat = manualLatInput.trim() ? parseFloat(manualLatInput.trim()) : undefined;
    const lng = manualLngInput.trim() ? parseFloat(manualLngInput.trim()) : undefined;

    if (!name && !address) {
      showToast('Please enter a location name or address', 'warning');
      return;
    }

    const targetTx = transactions.find((t) => t.id === selectedTxForManualLoc);
    if (!targetTx) return;

    await editTransaction(targetTx.id, {
      ...targetTx,
      locationName: name || undefined,
      locationAddress: address || undefined,
      latitude: lat !== undefined && !isNaN(lat) ? lat : undefined,
      longitude: lng !== undefined && !isNaN(lng) ? lng : undefined,
    });

    showToast('Manual location saved successfully', 'success');
    setIsAddManualOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Card */}
      <div className="card-level-3 hero-emerald-glow" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={22} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Transaction Maps & Locations</h2>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            Tracked physical locations, unknown coordinates, and custom manual transaction places.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleOpenAddManualModal}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.84rem' }}
          >
            <Plus size={15} color="var(--accent-cyan)" />
            <span>Add Manual Location</span>
          </button>

          <button
            type="button"
            onClick={handleToggleNearMe}
            disabled={isGettingUserGPS}
            className="btn"
            style={{
              padding: '8px 16px',
              minHeight: '38px',
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isNearMeActive ? 'var(--accent-cyan)' : 'var(--bg-surface)',
              color: isNearMeActive ? '#000000' : 'var(--text-secondary)',
              fontWeight: 700,
              border: '1px solid var(--border-color)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Compass size={15} style={{ animation: isGettingUserGPS ? 'spin 1.5s linear infinite' : 'none' }} />
            <span>{isNearMeActive ? 'Near Me (Active)' : 'Transactions near me'}</span>
          </button>
        </div>
      </div>

      {/* 2. Real Location Statistics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div className="card-level-2" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            LOCATION SPENDING
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }} className="tabular-nums">
            {settings.hideBalances ? '₹•••••' : `₹${totalLocationSpending.toLocaleString()}`}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Total spent at tracked locations</span>
        </div>

        <div className="card-level-2" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            TOTAL LOCATIONS
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
            {locationGroups.length}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Unique place groups</span>
        </div>

        <div className="card-level-2" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            KNOWN PLACES
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
            {knownLocationsCount}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Resolved place names</span>
        </div>

        <div className="card-level-2" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            UNKNOWN / MANUAL
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
            {unknownLocationsCount}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Coordinates or custom text</span>
        </div>
      </div>

      {/* 3. Filter Bar & View Toggle */}
      <div className="card-level-2" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            <Filter size={14} color="var(--accent-cyan)" />
            <span>Filters:</span>
          </div>

          {/* Location Type Filter */}
          <select value={locationTypeFilter} onChange={(e) => setLocationTypeFilter(e.target.value as any)} style={{ padding: '6px 10px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: 'var(--bg-surface-elevated)' }}>
            <option value="ALL">All Location Types</option>
            <option value="KNOWN">Known Places Only</option>
            <option value="UNKNOWN">Unknown Locations</option>
            <option value="MANUAL">Manual / Text Only</option>
          </select>

          {/* Transaction Type Filter */}
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
            <option value="ALL">All Types</option>
            <option value="EXPENSE">Expenses</option>
            <option value="INCOME">Income</option>
            <option value="TRANSFER">Transfers</option>
          </select>

          {/* Date Filter */}
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)} style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
            <option value="MONTH">This Month</option>
            <option value="TODAY">Today</option>
            <option value="7DAYS">Last 7 Days</option>
            <option value="30DAYS">Last 30 Days</option>
            <option value="ALL">All Time</option>
          </select>

          {/* Category Filter */}
          <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Account Filter */}
          <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
            <option value="ALL">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search & View Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '30px', paddingRight: '10px', height: '34px', fontSize: '0.8rem', width: '170px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(10, 14, 22, 0.9)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setViewMode('MAP')}
              style={{
                padding: '5px 12px',
                fontSize: '0.78rem',
                fontWeight: viewMode === 'MAP' ? 700 : 500,
                backgroundColor: viewMode === 'MAP' ? 'var(--accent-violet-subtle)' : 'transparent',
                color: viewMode === 'MAP' ? 'var(--accent-lavender)' : 'var(--text-muted)',
                border: viewMode === 'MAP' ? '1px solid var(--accent-violet-border)' : 'none',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <MapPin size={13} /> Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              style={{
                padding: '5px 12px',
                fontSize: '0.78rem',
                fontWeight: viewMode === 'LIST' ? 700 : 500,
                backgroundColor: viewMode === 'LIST' ? 'var(--accent-violet-subtle)' : 'transparent',
                color: viewMode === 'LIST' ? 'var(--accent-lavender)' : 'var(--text-muted)',
                border: viewMode === 'LIST' ? '1px solid var(--accent-violet-border)' : 'none',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <ListIcon size={13} /> List
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Content Grid (Interactive Map / List + Right Details Panel) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 340px)', gap: '20px', flexWrap: 'wrap' }} className="maps-responsive-grid">
        {viewMode === 'LIST' ? (
          <div className="card-level-2" style={{ padding: '20px', height: '520px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                  onClick={() => setSelectedGroup(loc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    backgroundColor: selectedGroup?.locationKey === loc.locationKey ? 'var(--accent-violet-subtle)' : 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-md)',
                    border: selectedGroup?.locationKey === loc.locationKey ? '1px solid var(--accent-violet-border)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: loc.isUnknown ? '#F59E0B' : 'var(--text-primary)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{loc.name}</span>
                      {loc.isUnknown && (
                        <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontWeight: 700 }}>
                          Unknown
                        </span>
                      )}
                      {loc.isManual && (
                        <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(96, 165, 250, 0.15)', color: 'var(--accent-blue)', fontWeight: 700 }}>
                          Manual
                        </span>
                      )}
                    </div>
                    {loc.address && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>{loc.address}</div>}
                    <div style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                      {loc.transactionCount} transaction{loc.transactionCount > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }} className="tabular-nums">
                      ₹{loc.totalSpent.toLocaleString()}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>total spent</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Left Interactive Map Container */
          <div className="card-level-2" style={{ padding: '0', position: 'relative', overflow: 'hidden', height: '520px', borderRadius: 'var(--radius-lg)' }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }} />

            {/* Overlay if zero map markers */}
            {locationGroups.filter((g) => g.latitude !== undefined && g.longitude !== undefined).length === 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(10, 14, 26, 0.85)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  zIndex: 400,
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent-violet-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-lavender)' }}>
                  <MapPin size={24} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No GPS Map Coordinates</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '340px' }}>
                  Transactions with GPS coordinates render on this map. You can also view text-only manual locations in List mode.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Right Side Panel: Selected Group Details & Top Locations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedGroup ? (
            <div className="card-level-3 hero-emerald-glow" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} color={selectedGroup.isUnknown ? '#F59E0B' : 'var(--accent-cyan)'} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedGroup.name}</h3>
                  </div>
                  {selectedGroup.address && (
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>{selectedGroup.address}</p>
                  )}
                  {selectedGroup.isUnknown && (
                    <span style={{ fontSize: '0.7rem', color: '#F59E0B', display: 'inline-block', marginTop: '4px', fontWeight: 600 }}>
                      ⚠️ Unknown location name - click Edit Location to assign a name
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedGroup(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Total Spent</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                    ₹{selectedGroup.totalSpent.toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Transactions</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedGroup.transactionCount}
                  </div>
                </div>
              </div>

              {/* Recent Transactions at this Location */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Transactions at this Location</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                  {selectedGroup.transactions.map((tx) => (
                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '6px 8px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.merchant || tx.note || 'Transaction'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{tx.date} • {tx.time}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: tx.type === 'EXPENSE' ? 'var(--status-expense)' : 'var(--accent-cyan)' }}>
                        ₹{tx.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleOpenEditLocation(selectedGroup)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '8px', fontSize: '0.78rem', justifyContent: 'center' }}
                >
                  <Pencil size={14} />
                  <span>Edit Location</span>
                </button>

                {selectedGroup.latitude !== undefined && selectedGroup.longitude !== undefined ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedGroup.latitude},${selectedGroup.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '8px', fontSize: '0.78rem', justifyContent: 'center', textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} color="var(--accent-cyan)" />
                    <span>Open in Maps</span>
                  </a>
                ) : selectedGroup.address ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedGroup.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '8px', fontSize: '0.78rem', justifyContent: 'center', textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} color="var(--accent-cyan)" />
                    <span>Search Maps</span>
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            /* Top Spending Locations Section */
            <div className="card-level-2" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--accent-lavender)" />
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Top Spending Locations
                </h3>
              </div>

              {topLocations.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No location spending data available yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {topLocations.map((loc, idx) => (
                    <div
                      key={loc.locationKey}
                      onClick={() => {
                        setSelectedGroup(loc);
                        if (loc.latitude !== undefined && loc.longitude !== undefined && leafletMapRef.current) {
                          leafletMapRef.current.panTo([loc.latitude, loc.longitude], { animate: true });
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-cyan)', width: '16px' }}>#{idx + 1}</span>
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>{loc.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{loc.transactionCount} transactions</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          ₹{loc.totalSpent.toLocaleString()}
                        </span>
                        <ChevronRight size={14} color="var(--text-muted)" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Edit Location Modal */}
      {isEditLocationOpen && selectedGroup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(8, 10, 24, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsEditLocationOpen(false)}
        >
          <div
            className="card-level-3"
            style={{ width: '100%', maxWidth: '440px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Pencil size={18} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Edit Location Information</h3>
              </div>
              <button type="button" onClick={() => setIsEditLocationOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLocationEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MVR College of Engineering"
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Address / City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paritala, Kanchikacherla, AP"
                  value={editAddressInput}
                  onChange={(e) => setEditAddressInput(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Latitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="16.5762"
                    value={editLatInput}
                    onChange={(e) => setEditLatInput(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Longitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="80.4501"
                    value={editLngInput}
                    onChange={(e) => setEditLngInput(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsEditLocationOpen(false)} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSavingLocationEdit} className="btn btn-primary" style={{ padding: '8px 20px' }}>
                  {isSavingLocationEdit ? 'Saving...' : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Manual Location Modal */}
      {isAddManualOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(8, 10, 24, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsAddManualOpen(false)}
        >
          <div
            className="card-level-3"
            style={{ width: '100%', maxWidth: '460px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Add Manual Transaction Location</h3>
              </div>
              <button type="button" onClick={() => setIsAddManualOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveManualLocation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Target Transaction *
                </label>
                <select
                  value={selectedTxForManualLoc}
                  onChange={(e) => setSelectedTxForManualLoc(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem' }}
                >
                  {transactions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.merchant || t.note || 'Tx'} — ₹{t.amount.toLocaleString()} ({t.date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hostel Paritala, Local Shop"
                  value={manualNameInput}
                  onChange={(e) => setManualNameInput(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Address / Locality (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near College Gate, Paritala"
                  value={manualAddressInput}
                  onChange={(e) => setManualAddressInput(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Latitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 16.5762"
                    value={manualLatInput}
                    onChange={(e) => setManualLatInput(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Longitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 80.4501"
                    value={manualLngInput}
                    onChange={(e) => setManualLngInput(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddManualOpen(false)} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px' }}>
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
