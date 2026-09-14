import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Transaction, TransactionType } from '../types/finance';
import { MapPin, Filter, Sparkles, X, ChevronRight, Compass } from 'lucide-react';
import { LocationService } from '../services/locationService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationGroup {
  locationKey: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
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
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Filters State
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'MONTH'>('MONTH');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<LocationGroup | null>(null);

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
      // Must have valid lat & lng coordinates
      if (tx.latitude === undefined || tx.longitude === undefined || isNaN(tx.latitude) || isNaN(tx.longitude)) {
        return false;
      }

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
      if (isNearMeActive && userCoords) {
        const distanceKm = getHaversineDistance(userCoords.lat, userCoords.lng, tx.latitude, tx.longitude);
        if (distanceKm > 5) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, dateFilter, selectedCategoryId, selectedAccountId, isNearMeActive, userCoords]);

  // Haversine formula to compute distance in KM
  function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // 2. Group transactions by approximate coordinates (Round lat/lng to ~100m accuracy)
  const locationGroups = useMemo(() => {
    const groupsMap: { [key: string]: LocationGroup } = {};

    filteredTransactions.forEach((tx) => {
      if (tx.latitude === undefined || tx.longitude === undefined) return;

      // Group nearby coordinates (rounded to 3 decimal places ~110m)
      const approxLat = Number(tx.latitude.toFixed(3));
      const approxLng = Number(tx.longitude.toFixed(3));
      const key = `${approxLat}_${approxLng}`;

      const catName = categories.find((c) => c.id === tx.categoryId)?.name || 'General';

      if (!groupsMap[key]) {
        groupsMap[key] = {
          locationKey: key,
          name: tx.locationName || 'Tracked Location',
          address: tx.locationAddress,
          latitude: tx.latitude,
          longitude: tx.longitude,
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

  // Top Spending Locations sorted by totalSpent
  const topLocations = useMemo(() => {
    return [...locationGroups].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  }, [locationGroups]);

  // Overall Location Statistics
  const totalLocationSpending = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  // 3. Initialize & Update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      // Default initial view (Vijayawada / India coordinates if no markers, otherwise marker centroid)
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

    // Add Markers for each LocationGroup
    if (locationGroups.length > 0) {
      const bounds = L.latLngBounds([]);

      locationGroups.forEach((group) => {
        const point = L.latLng(group.latitude, group.longitude);
        bounds.extend(point);

        // Custom HTML Pin Marker
        const isSelected = selectedGroup?.locationKey === group.locationKey;

        const customIcon = L.divIcon({
          className: 'custom-map-pin-container',
          html: `
            <div style="
              width: ${isSelected ? '36px' : '30px'};
              height: ${isSelected ? '36px' : '30px'};
              border-radius: 50%;
              background: linear-gradient(135deg, #06b6d4, #8b5cf6);
              border: 2px solid #ffffff;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-weight: 800;
              font-size: 0.72rem;
              cursor: pointer;
              transition: transform 0.2s ease;
            ">
              ${group.transactionCount > 1 ? group.transactionCount : '📍'}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([group.latitude, group.longitude], { icon: customIcon }).addTo(map);

        marker.on('click', () => {
          setSelectedGroup(group);
          map.panTo([group.latitude, group.longitude], { animate: true });
        });

        markersRef.current.push(marker);
      });

      if (!selectedGroup && locationGroups.length > 0) {
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
      const coords = await LocationService.getCurrentLocation();
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
      <div className="card-level-3 hero-emerald-glow" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Transaction Maps</h2>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            Visualize where your tracked financial transactions took place.
          </p>
        </div>

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

      {/* 2. Location Statistics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
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
            TRACKED LOCATIONS
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
            {locationGroups.length}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Distinct physical locations</span>
        </div>

        <div className="card-level-2" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            TRACKED TRANSACTIONS
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-lavender)', marginTop: '4px' }}>
            {filteredTransactions.length}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Entries with GPS coordinates</span>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="card-level-2" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          <Filter size={14} color="var(--accent-cyan)" />
          <span>Filters:</span>
        </div>

        {/* Type Filter */}
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

      {/* 4. Main Content Grid (Interactive Map + Right Insights Panel) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 340px)', gap: '20px', flexWrap: 'wrap' }} className="maps-responsive-grid">
        {/* Left Interactive Map Container */}
        <div className="card-level-2" style={{ padding: '0', position: 'relative', overflow: 'hidden', height: '520px', borderRadius: 'var(--radius-lg)' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }} />

          {/* Map Overlay helper if zero markers */}
          {locationGroups.length === 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(10, 14, 26, 0.82)',
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
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Tracked Location Markers</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '340px' }}>
                Add location coordinates to your transactions when entering them to see them rendered on this interactive map.
              </p>
            </div>
          )}
        </div>

        {/* Right Side Panel: Top Locations & Location Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Selected Location Bottom Sheet / Side Panel */}
          {selectedGroup ? (
            <div className="card-level-3 hero-emerald-glow" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} color="var(--accent-cyan)" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedGroup.name}</h3>
                  </div>
                  {selectedGroup.address && (
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>{selectedGroup.address}</p>
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

              {/* Category Breakdown */}
              <div style={{ fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Spending Breakdown</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {Object.entries(selectedGroup.categoryBreakdown).map(([cat, amt]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>{cat}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{amt.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transactions List */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Recent Transactions</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                  {selectedGroup.transactions.map((tx) => (
                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '6px 8px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.merchant || tx.note}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{tx.date} • {tx.time}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: tx.type === 'EXPENSE' ? 'var(--status-expense)' : 'var(--accent-cyan)' }}>
                        ₹{tx.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
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
                        if (leafletMapRef.current) {
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

          {/* Location Insights Card */}
          {topLocations.length > 0 && (
            <div className="card-level-2" style={{ padding: '16px 18px', backgroundColor: 'var(--accent-violet-subtle)', border: '1px solid var(--accent-violet-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-lavender)', fontSize: '0.8rem', fontWeight: 700 }}>
                <Sparkles size={14} />
                <span>Location Insight</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: '6px', lineHeight: 1.4 }}>
                Most of your tracked spending happens around <strong>{topLocations[0].name}</strong> with {topLocations[0].transactionCount} visits totaling ₹{topLocations[0].totalSpent.toLocaleString()}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
