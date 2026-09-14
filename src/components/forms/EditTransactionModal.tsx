import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import type { Transaction, TransactionType } from '../../types/finance';
import { Trash2, MapPin, Navigation, Loader2, Plus } from 'lucide-react';
import { LocationService, type LocationResult } from '../../services/locationService';
import { SelectLocationMapModal } from '../modals/SelectLocationMapModal';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const {
    accounts,
    categories,
    transactions,
    editTransaction,
    deleteTransaction,
    showToast,
  } = useApp();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');

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

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setAccountId(transaction.accountId);
      setToAccountId(transaction.toAccountId || (accounts.length > 1 ? accounts[1].id : ''));
      setCategoryId(transaction.categoryId);
      setDate(transaction.date);
      setTime(transaction.time);
      setNote(transaction.note || '');
      setPaymentMethod(transaction.paymentMethod || 'UPI');

      setLocationName(transaction.locationName || '');
      setLocationAddress(transaction.locationAddress || '');
      setLatitude(transaction.latitude);
      setLongitude(transaction.longitude);
      setLocationPlaceId(transaction.locationPlaceId);
      setLocationQuery(transaction.locationName || '');
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  }, [transaction, accounts]);

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
      showToast(`Location updated: ${details.name}`, 'info');
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

  const handleRemoveLocation = () => {
    setLocationName('');
    setLocationAddress('');
    setLatitude(undefined);
    setLongitude(undefined);
    setLocationPlaceId(undefined);
    setLocationQuery('');
    setLocationSuggestions([]);
    setShowSuggestions(false);
    showToast('Location removed from transaction', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }

    let finalCategoryId = categoryId;
    if (type === 'TRANSFER') {
      const transferCat = categories.find((c) => c.name === 'Transfer');
      finalCategoryId = transferCat ? transferCat.id : categories[0].id;
    }

    const finalLocName = locationName.trim() || locationQuery.trim() || undefined;

    editTransaction(transaction.id, {
      type,
      amount: parsedAmount,
      accountId,
      toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
      categoryId: finalCategoryId,
      date,
      time,
      note: note.trim() || (type === 'TRANSFER' ? 'Internal Account Transfer' : 'Quick Entry'),
      paymentMethod,
      locationName: finalLocName,
      locationAddress: locationAddress.trim() || undefined,
      latitude: finalLocName ? latitude : undefined,
      longitude: finalLocName ? longitude : undefined,
      locationPlaceId: finalLocName ? locationPlaceId : undefined,
    });

    onClose();
  };

  const handleDelete = () => {
    if (transaction && confirm(`Are you sure you want to delete this transaction?`)) {
      deleteTransaction(transaction.id);
      onClose();
    }
  };

  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Transaction"
      subtitle="Modify or update transaction details & location."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Transaction Type Selector */}
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
            let activeColor = 'var(--accent-emerald)';
            if (t === 'EXPENSE' && isActive) activeColor = 'var(--status-expense)';
            if (t === 'TRANSFER' && isActive) activeColor = 'var(--accent-blue)';

            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: isActive ? activeColor : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.84rem',
                  border: isActive ? '1px solid var(--border-strong)' : 'none',
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
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '38px',
                fontSize: '1.4rem',
                fontWeight: 800,
                height: '52px',
              }}
              className="tabular-nums"
            />
          </div>
        </div>

        {/* Note / Merchant */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Note / Merchant Name
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        {/* Account Pickers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {type === 'TRANSFER' ? 'From Account' : 'Account'}
            </label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ width: '100%' }}>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {type === 'TRANSFER' ? 'To Account' : 'Category'}
            </label>
            {type === 'TRANSFER' ? (
              <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} style={{ width: '100%' }}>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            ) : (
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: '100%' }}>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

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
          </div>
        </div>

        {/* Location Section */}
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
                style={{ padding: '4px 10px', minHeight: '30px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <MapPin size={13} color="var(--accent-cyan)" />
                <span>Pick on map</span>
              </button>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isGettingGPS}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', minHeight: '30px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                {isGettingGPS ? <Loader2 size={13} style={{ animation: 'spin 1.5s linear infinite' }} /> : <Navigation size={13} color="var(--accent-cyan)" />}
                <span>{isGettingGPS ? 'Locating...' : 'Use current location'}</span>
              </button>

              {(locationName || locationQuery) && (
                <button
                  type="button"
                  onClick={handleRemoveLocation}
                  className="btn btn-danger"
                  style={{ padding: '4px 10px', minHeight: '30px', fontSize: '0.76rem' }}
                >
                  Remove location
                </button>
              )}
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
              style={{ width: '100%', paddingLeft: '36px', fontSize: '0.86rem' }}
            />
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

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-danger"
            style={{ padding: '8px 16px', minHeight: '40px', fontSize: '0.84rem' }}
          >
            <Trash2 size={15} /> Delete
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', minHeight: '40px' }}>
              Save Changes
            </button>
          </div>
        </div>
      </form>

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
