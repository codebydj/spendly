import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import type { TransactionType } from '../../types/finance';
import { ArrowLeftRight, Check, Sparkles, CheckCircle2, MapPin, Navigation, X, Loader2, Plus } from 'lucide-react';
import { LocationService, type LocationResult } from '../../services/locationService';
import { SelectLocationMapModal } from '../modals/SelectLocationMapModal';
import { suggestCategoryForMerchant } from '../../utils/calculations';

export const AddTransactionModal: React.FC = () => {
  const {
    isAddTransactionOpen,
    setIsAddTransactionOpen,
    accounts,
    categories,
    transactions,
    addTransaction,
    showToast,
  } = useApp();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [customCategoryName, setCustomCategoryName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [note, setNote] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [customPaymentMethod, setCustomPaymentMethod] = useState<string>('');
  const [suggestedCatId, setSuggestedCatId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Location State
  const [locationName, setLocationName] = useState<string>('');
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationPlaceId, setLocationPlaceId] = useState<string | undefined>(undefined);
  const [locationQuery, setLocationQuery] = useState<string>('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationResult[]>([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState<boolean>(false);
  const [isGettingGPS, setIsGettingGPS] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);

  // Form Reset Function: Reset all fields for new transaction
  const resetFormState = () => {
    const now = new Date();
    setType('EXPENSE');
    setAmount('');
    setNote('');
    setCustomCategoryName('');
    setCustomPaymentMethod('');
    setPaymentMethod('UPI');
    setDate(now.toISOString().slice(0, 10));
    setTime(now.toTimeString().slice(0, 5));
    setLocationName('');
    setLocationAddress('');
    setLatitude(undefined);
    setLongitude(undefined);
    setLocationPlaceId(undefined);
    setLocationQuery('');
    setLocationSuggestions([]);
    setIsSearchingLocations(false);
    setShowSuggestions(false);
    setSuggestedCatId(null);
    setIsSuccess(false);

    if (accounts.length > 0) {
      setAccountId(accounts[0].id);
      if (accounts.length > 1) {
        setToAccountId(accounts[1].id);
      }
    }
    if (categories.length > 0) {
      const defaultExpCat = categories.find((c) => c.type === 'EXPENSE');
      setCategoryId(defaultExpCat ? defaultExpCat.id : categories[0].id);
    }
  };

  // Reset form completely whenever modal opens
  useEffect(() => {
    if (isAddTransactionOpen) {
      resetFormState();
    }
  }, [isAddTransactionOpen]);

  // Debounced Place Search with Loading & Abort Control
  useEffect(() => {
    if (!locationQuery || locationQuery.trim().length < 2) {
      setLocationSuggestions([]);
      setIsSearchingLocations(false);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingLocations(true);
    setShowSuggestions(true);

    let active = true;

    const timer = setTimeout(async () => {
      const results = await LocationService.searchPlaces(locationQuery, transactions);
      if (active) {
        setLocationSuggestions(results);
        setIsSearchingLocations(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [locationQuery, transactions]);

  const handleUseCurrentLocation = async () => {
    setIsGettingGPS(true);
    try {
      const coords = await LocationService.getCurrentLocation();
      const details = await LocationService.reverseGeocode(coords.latitude, coords.longitude);
      setLocationName(details.name);
      setLocationAddress(details.address || '');
      setLatitude(details.latitude);
      setLongitude(details.longitude);
      setLocationPlaceId(details.placeId);
      setLocationQuery(details.name);
      setShowSuggestions(false);
      showToast(`Location set: ${details.name}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Location access is turned off. You can enter a place manually instead.', 'warning');
    } finally {
      setIsGettingGPS(false);
    }
  };

  const handleSelectSuggestion = (item: LocationResult) => {
    setLocationName(item.name);
    setLocationAddress(item.address || '');
    setLatitude(item.latitude);
    setLongitude(item.longitude);
    setLocationPlaceId(item.placeId);
    setLocationQuery(item.name);
    setShowSuggestions(false);
  };

  const handleClearLocation = () => {
    setLocationName('');
    setLocationAddress('');
    setLatitude(undefined);
    setLongitude(undefined);
    setLocationPlaceId(undefined);
    setLocationQuery('');
    setLocationSuggestions([]);
    setShowSuggestions(false);
  };

  // Smart Category Suggestion algorithm & Merchant Memory
  useEffect(() => {
    if (!note.trim() || type === 'TRANSFER') {
      setSuggestedCatId(null);
      return;
    }

    const suggested = suggestCategoryForMerchant(note, categories);
    if (suggested && suggested !== categoryId) {
      setSuggestedCatId(suggested);
    } else {
      setSuggestedCatId(null);
    }
  }, [note, type, categories, categoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }
    if (!accountId) return;

    if (type === 'TRANSFER' && accountId === toAccountId) {
      showToast('Source and Destination accounts must be different for transfers', 'warning');
      return;
    }

    let finalCategoryId = categoryId;
    if (type === 'TRANSFER') {
      const transferCat = categories.find((c) => c.name === 'Transfer');
      finalCategoryId = transferCat ? transferCat.id : categories[0].id;
    }

    const selectedCatObj = categories.find((c) => c.id === categoryId);
    const isOtherCat = selectedCatObj?.name.toLowerCase() === 'other';

    let userNote = note.trim();
    if (isOtherCat && customCategoryName.trim()) {
      userNote = userNote ? `${customCategoryName.trim()} • ${userNote}` : customCategoryName.trim();
    }

    const finalPaymentMethod = paymentMethod === 'Other' && customPaymentMethod.trim() ? customPaymentMethod.trim() : paymentMethod;
    const finalLocName = locationName.trim() || locationQuery.trim() || undefined;

    addTransaction({
      type,
      amount: parsedAmount,
      accountId,
      toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
      categoryId: finalCategoryId,
      date,
      time,
      note: userNote || (type === 'TRANSFER' ? 'Internal Account Transfer' : 'Quick Entry'),
      paymentMethod: finalPaymentMethod,
      locationName: finalLocName,
      locationAddress: locationAddress.trim() || undefined,
      latitude,
      longitude,
      locationPlaceId,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setAmount('');
      setNote('');
      handleClearLocation();
      setSuggestedCatId(null);
      setIsAddTransactionOpen(false);
    }, 450);
  };

  const handleCloseModal = () => {
    resetFormState();
    setIsAddTransactionOpen(false);
  };

  const suggestedCategoryObj = categories.find((c) => c.id === suggestedCatId);

  return (
    <Modal
      isOpen={isAddTransactionOpen}
      onClose={handleCloseModal}
      title="Add Transaction"
      subtitle="Fast transaction entry for your accounts."
    >
      {isSuccess ? (
        <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={36} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Transaction Saved</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {type === 'EXPENSE' ? '-' : type === 'INCOME' ? '+' : ''}₹{parseFloat(amount || '0').toLocaleString()}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Transaction Type Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px',
              backgroundColor: 'rgba(10, 14, 22, 0.9)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map((t) => {
              const isActive = type === t;
              let activeBg = 'var(--bg-surface-elevated)';
              let activeColor = 'var(--accent-emerald)';
              if (t === 'EXPENSE' && isActive) activeColor = 'var(--status-expense)';
              if (t === 'TRANSFER' && isActive) activeColor = 'var(--accent-blue)';

              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    if (t === 'INCOME') {
                      const sal = categories.find((c) => c.type === 'INCOME');
                      if (sal) setCategoryId(sal.id);
                    } else if (t === 'EXPENSE') {
                      const exp = categories.find((c) => c.type === 'EXPENSE');
                      if (exp) setCategoryId(exp.id);
                    }
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isActive ? activeBg : 'transparent',
                    color: isActive ? activeColor : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.84rem',
                    border: isActive ? '1px solid var(--border-strong)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Amount Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Amount (₹)
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: type === 'EXPENSE' ? 'var(--status-expense)' : type === 'INCOME' ? 'var(--accent-emerald)' : 'var(--accent-blue)',
                }}
              >
                ₹
              </span>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  height: '56px',
                  backgroundColor: 'rgba(18, 23, 34, 0.95)',
                }}
                className="tabular-nums"
                autoFocus
              />
            </div>
          </div>

          {/* Note / Merchant Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Note / Merchant Name
            </label>
            <input
              type="text"
              placeholder="e.g. Swiggy, Amazon, Salary, Rent..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ width: '100%' }}
            />

            {/* Smart Category Suggestion Badge */}
            {suggestedCategoryObj && (
              <div
                style={{
                  marginTop: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--accent-emerald-subtle)',
                  border: '1px solid var(--accent-emerald-border)',
                  fontSize: '0.8rem',
                  color: 'var(--accent-emerald)',
                }}
              >
                <Sparkles size={14} />
                <span>Suggested category: <strong>{suggestedCategoryObj.name}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryId(suggestedCategoryObj.id);
                    setSuggestedCatId(null);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    backgroundColor: 'var(--accent-emerald)',
                    color: '#042f2e',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    marginLeft: '4px',
                  }}
                >
                  <Check size={12} /> Apply
                </button>
              </div>
            )}
          </div>

          {/* Account Pickers */}
          {type === 'TRANSFER' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  From Account
                </label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ width: '100%' }}>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (₹{acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  To Account
                </label>
                <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} style={{ width: '100%' }}>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (₹{acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Account
                </label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ width: '100%' }}>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (₹{acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Category
                </label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: '100%' }}>
                  {categories
                    .filter((c) => (type === 'INCOME' ? c.type === 'INCOME' : c.type === 'EXPENSE'))
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
                {categories.find((c) => c.id === categoryId)?.name.toLowerCase() === 'other' && (
                  <div style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      placeholder="e.g. College fees, Gift, Repair"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      style={{ width: '100%', fontSize: '0.82rem', padding: '6px 10px' }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Date, Time & Payment Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Date
              </label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', fontSize: '0.82rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Time
              </label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: '100%', fontSize: '0.82rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Payment Method
              </label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%', fontSize: '0.82rem' }}>
                <option value="UPI">UPI</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
              {paymentMethod === 'Other' && (
                <div style={{ marginTop: '6px' }}>
                  <input
                    type="text"
                    placeholder="Custom method..."
                    value={customPaymentMethod}
                    onChange={(e) => setCustomPaymentMethod(e.target.value)}
                    style={{ width: '100%', fontSize: '0.78rem', padding: '4px 8px' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Location Field (Optional) */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Location <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="btn btn-secondary"
                  style={{
                    padding: '4px 10px',
                    minHeight: '30px',
                    fontSize: '0.76rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <MapPin size={13} color="var(--accent-cyan)" />
                  <span>Pick on map</span>
                </button>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isGettingGPS}
                  className="btn btn-secondary"
                  style={{
                    padding: '4px 10px',
                    minHeight: '30px',
                    fontSize: '0.76rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {isGettingGPS ? <Loader2 size={13} style={{ animation: 'spin 1.5s linear infinite' }} /> : <Navigation size={13} color="var(--accent-cyan)" />}
                  <span>{isGettingGPS ? 'Locating...' : 'Use current location'}</span>
                </button>
              </div>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MapPin size={16} color="var(--accent-cyan)" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search a place (e.g. Starbucks, Benz Circle)..."
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  setLocationName(e.target.value);
                }}
                onFocus={() => {
                  if (locationSuggestions.length > 0) setShowSuggestions(true);
                }}
                style={{
                  width: '100%',
                  paddingLeft: '36px',
                  paddingRight: (locationName || locationQuery) ? '36px' : '12px',
                  fontSize: '0.86rem',
                }}
              />
              {(locationName || locationQuery) && (
                <button
                  type="button"
                  onClick={handleClearLocation}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && locationQuery.trim().length >= 2 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  marginTop: '4px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  maxHeight: '240px',
                  overflowY: 'auto',
                }}
              >
                {/* 1. Loading State */}
                {isSearchingLocations ? (
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    <Loader2 size={15} style={{ animation: 'spin 1.5s linear infinite' }} />
                    <span>Searching places for "{locationQuery.trim()}"...</span>
                  </div>
                ) : locationSuggestions.length > 0 ? (
                  /* 2. Real Results Found */
                  <>
                    <div style={{ padding: '6px 12px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Places & Landmarks ({locationSuggestions.length})
                    </div>
                    {locationSuggestions.map((item, idx) => (
                      <button
                        key={item.placeId || idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 14px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                        }}
                      >
                        <MapPin size={16} color={item.isSaved ? 'var(--accent-cyan)' : 'var(--accent-lavender)'} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                            {item.isSaved && (
                              <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(34, 211, 238, 0.15)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                                Saved
                              </span>
                            )}
                          </div>
                          {item.address && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.address}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}

                    {/* Secondary Manual Fallback */}
                    <button
                      type="button"
                      onClick={() => {
                        setLocationName(locationQuery.trim());
                        setLocationAddress('');
                        setLatitude(undefined);
                        setLongitude(undefined);
                        setLocationPlaceId(undefined);
                        setShowSuggestions(false);
                        showToast(`Set custom location: "${locationQuery.trim()}"`, 'info');
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Plus size={13} />
                      <span>Can't find exact place? Use "{locationQuery.trim()}" as custom location</span>
                    </button>
                  </>
                ) : (
                  /* 3. Search Finished & 0 Results */
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Couldn't find an exact place matching "{locationQuery.trim()}".
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLocationName(locationQuery.trim());
                        setLocationAddress('');
                        setLatitude(undefined);
                        setLongitude(undefined);
                        setLocationPlaceId(undefined);
                        setShowSuggestions(false);
                        showToast(`Set custom location: "${locationQuery.trim()}"`, 'info');
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(34, 211, 238, 0.08)',
                        border: '1px solid rgba(34, 211, 238, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--accent-cyan)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Plus size={14} />
                      <span>Add "{locationQuery.trim()}" as custom location</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Save Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', minHeight: '44px' }}>
              {type === 'TRANSFER' ? (
                <>
                  <ArrowLeftRight size={16} /> Save Transfer
                </>
              ) : (
                `Save ${type.charAt(0) + type.slice(1).toLowerCase()}`
              )}
            </button>
          </div>
        </form>
      )}

      <SelectLocationMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialLocation={latitude && longitude ? { name: locationName, address: locationAddress, latitude, longitude } : undefined}
        onSelectLocation={(loc) => {
          setLocationName(loc.name);
          setLocationAddress(loc.address || '');
          setLatitude(loc.latitude);
          setLongitude(loc.longitude);
          setLocationPlaceId(loc.placeId);
          setLocationQuery(loc.name);
        }}
      />
    </Modal>
  );
};
