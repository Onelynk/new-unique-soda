import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, MenuCategory } from '../types';
import {
  X,
  Plus,
  Trash2,
  Check,
  SlidersHorizontal,
  CreditCard,
  RotateCcw,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Clock,
  AlertCircle,
  Database,
  Cloud,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  Delete,
} from 'lucide-react';
import {
  isFirebaseConfigured,
  TARGET_FIREBASE_PROJECT_ID,
  getResolvedFirebaseConfig,
} from '../lib/firebase';
import {
  updateItemAvailabilityInFirestore,
  updateItemPriceInFirestore,
  addItemToFirestoreMenu,
  deleteItemFromFirestoreMenu,
  seedFirestoreMenu,
  updateShopSettingsInFirestore,
} from '../services/menuFirestoreService';

const ADMIN_PASSWORD = '1739';

interface BarManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onUpdateItems: (items: MenuItem[]) => void;
  onResetToDefault: () => void;
  shopUpiId: string;
  onUpdateShopUpiId: (upiId: string) => void;
}

export const BarManagerDrawer: React.FC<BarManagerDrawerProps> = ({
  isOpen,
  onClose,
  menuItems,
  onUpdateItems,
  onResetToDefault,
  shopUpiId,
  onUpdateShopUpiId,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'add' | 'settings' | 'orders'>('inventory');
  const [saveToast, setSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('UPDATED LIVE');
  const [confirmReset, setConfirmReset] = useState(false);
  const [tempUpi, setTempUpi] = useState(shopUpiId);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [seedingStatus, setSeedingStatus] = useState<'idle' | 'seeding' | 'success' | 'error'>('idle');
  const [seedingMsg, setSeedingMsg] = useState('');
  const [isSavingUpi, setIsSavingUpi] = useState(false);
  const [upiFeedback, setUpiFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Password / PIN Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('shop_owner_auth_token') === 'verified_1739';
    }
    return false;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus PIN input when modal opens and not authenticated
  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      setPinInput('');
      setPinError('');
      const timer = setTimeout(() => {
        pinInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isAuthenticated]);

  const handleVerifyPassword = (enteredPin?: string) => {
    const pin = (enteredPin !== undefined ? enteredPin : pinInput).trim();
    if (pin === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPinError('');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('shop_owner_auth_token', 'verified_1739');
      }
    } else {
      setPinError('Incorrect password. Access denied.');
      setPinInput('');
      pinInputRef.current?.focus();
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPinInput('');
    setPinError('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('shop_owner_auth_token');
      localStorage.removeItem('shop_owner_auth_token');
    }
  };

  const handleLockAndClose = () => {
    handleLogout();
    onClose();
  };

  // Lock and close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleLockAndClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleNumpadPress = (digit: string) => {
    if (pinInput.length < 8) {
      const next = pinInput + digit;
      setPinInput(next);
      setPinError('');
      if (next.length === 4) {
        if (next === ADMIN_PASSWORD) {
          handleVerifyPassword(next);
        } else {
          setPinError('Incorrect password. Access denied.');
        }
      }
    }
  };

  const handleNumpadDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError('');
  };

  const handleNumpadClear = () => {
    setPinInput('');
    setPinError('');
  };

  // Form state for adding new item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<MenuCategory>('soda');
  const [newItemSubtitle, setNewItemSubtitle] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('80');
  const [newItemBadge, setNewItemBadge] = useState<'SIGNATURE' | 'POPULAR' | 'CHILLED' | 'NEW' | undefined>(undefined);

  const fetchLiveOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setLiveOrders(data.orders || []);
      }
    } catch (e) {
      console.warn('Failed to load orders', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSeedMenu = async () => {
    setSeedingStatus('seeding');
    const result = await seedFirestoreMenu();
    if (result.success) {
      setSeedingStatus('success');
      setSeedingMsg(result.message);
      setTimeout(() => setSeedingStatus('idle'), 4000);
    } else {
      setSeedingStatus('error');
      setSeedingMsg(result.message);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'orders') {
      fetchLiveOrders();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const currentConfig = getResolvedFirebaseConfig();

  const triggerToast = (msg = 'UPDATED LIVE') => {
    setToastMessage(msg);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleToggleAvailability = (id: string) => {
    const targetItem = menuItems.find((item) => item.id === id);
    const updated = menuItems.map((item) =>
      item.id === id ? { ...item, available: !item.available } : item
    );
    onUpdateItems(updated);
    if (targetItem) {
      updateItemAvailabilityInFirestore(targetItem, !targetItem.available);
    }
    triggerToast(targetItem?.available ? 'MARKED SOLD OUT' : 'MARKED IN STOCK');
  };

  const handleUpdatePrice = (id: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    const targetItem = menuItems.find((item) => item.id === id);
    const updated = menuItems.map((item) =>
      item.id === id ? { ...item, price: newPrice } : item
    );
    onUpdateItems(updated);
    if (targetItem) {
      updateItemPriceInFirestore(targetItem, newPrice);
    }
    triggerToast(`PRICE UPDATED: ₹${newPrice}`);
  };

  const handleDeleteItem = (itemOrId: MenuItem | string) => {
    const targetItem = typeof itemOrId === 'string'
      ? menuItems.find((item) => item.id === itemOrId)
      : itemOrId;
    const idToDelete = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;

    // Immediately remove from current state
    const updated = menuItems.filter((item) => item.id !== idToDelete);
    onUpdateItems(updated);

    // Delete in Firestore (dual-write: client + server API)
    if (targetItem) {
      deleteItemFromFirestoreMenu(targetItem);
      triggerToast(`DELETED "${targetItem.name}"`);
    } else {
      deleteItemFromFirestoreMenu(idToDelete);
      triggerToast('ITEM DELETED');
    }
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const nextIndex = menuItems.length + 1;
    const itemNum = nextIndex < 10 ? `0${nextIndex}` : `${nextIndex}`;

    const newItem: MenuItem = {
      id: `custom-${Date.now()}`,
      itemNumber: itemNum,
      name: newItemName.trim().toUpperCase(),
      category: newItemCategory,
      subtitle: newItemSubtitle.trim() || 'Handcrafted fresh pour · Chilled',
      description: newItemSubtitle.trim() || 'Handcrafted fresh pour · Chilled',
      price: Number(newItemPrice) || 80,
      badge: newItemBadge,
      available: true,
    };

    onUpdateItems([...menuItems, newItem]);
    addItemToFirestoreMenu(newItem);
    triggerToast();

    // Reset Form
    setNewItemName('');
    setNewItemSubtitle('');
    setNewItemPrice('80');
    setNewItemBadge(undefined);
    setActiveTab('inventory');
  };

  const handleSaveUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUpi = tempUpi.trim();
    if (!cleanUpi) return;
    setIsSavingUpi(true);
    setUpiFeedback(null);
    onUpdateShopUpiId(cleanUpi);
    try {
      const success = await updateShopSettingsInFirestore({ upiId: cleanUpi });
      if (success) {
        setUpiFeedback({
          type: 'success',
          msg: `Saved & Synced to Firebase: ${cleanUpi}`,
        });
        setTimeout(() => setUpiFeedback(null), 5000);
      } else {
        setUpiFeedback({
          type: 'error',
          msg: 'Saved locally, but Firebase sync failed. Please check connection.',
        });
      }
    } catch (err: any) {
      setUpiFeedback({
        type: 'error',
        msg: err.message || 'Failed to update in Firebase',
      });
    } finally {
      setIsSavingUpi(false);
      triggerToast();
    }
  };

  // 1. PIN LOCK SCREEN IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/85 backdrop-blur-xs animate-fade-in">
        <div
          className="relative w-full max-w-xl h-full bg-[#0a0714] border-l border-purple-500/40 shadow-2xl flex flex-col justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header */}
          <div className="p-5 sm:p-6 border-b border-purple-950/60 flex items-center justify-between bg-[#0e0818]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#170e28] rounded-xs border border-purple-800/40 text-purple-300">
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg text-[#faf7fd] font-medium tracking-wide">
                    SHOP OWNER PORTAL
                  </h3>
                  <span className="text-[9px] font-mono tracking-widest text-amber-300 bg-amber-950/80 px-2 py-0.5 border border-amber-600/50 uppercase rounded-2xs">
                    LOCKED
                  </span>
                </div>
                <p className="text-xs text-[#9d8bb8] font-sans">
                  Owner authentication required for /adminpanel
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#8c7e9f] hover:text-[#faf7fd] bg-[#160c26] rounded-xs border border-purple-900/40 transition-colors cursor-pointer"
              title="Close and exit"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* PIN Lock Body */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 overflow-y-auto">
            <div className="w-full max-w-sm flex flex-col items-center text-center">
              {/* Security Key Icon */}
              <div className="relative mb-5">
                <div className="w-16 h-16 rounded-full bg-purple-950/80 border border-purple-600/40 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-950/50">
                  <KeyRound className="w-8 h-8 text-amber-300" />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-[#0a0714] rounded-full border border-purple-500/50 text-amber-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>

              <h2 className="text-xl font-serif font-semibold text-[#faf7fd] tracking-wide mb-1.5">
                Enter Owner Password
              </h2>
              <p className="text-xs text-[#9d8bb8] mb-5 max-w-xs leading-relaxed">
                Please enter the 4-digit PIN to access live orders, prices, stock availability, and shop settings.
              </p>

              {/* PIN Indicator Dots */}
              <div className="flex items-center justify-center gap-3 mb-5">
                {[0, 1, 2, 3].map((index) => {
                  const filled = pinInput.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                        filled
                          ? 'bg-amber-300 border-amber-300 scale-110 shadow-sm shadow-amber-400/50'
                          : 'bg-[#150e26] border-purple-800/60'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Password Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyPassword();
                }}
                className="w-full mb-4"
              >
                <div className="relative mb-3">
                  <input
                    ref={pinInputRef}
                    type={showPassword ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError('');
                    }}
                    placeholder="Enter 4-digit PIN"
                    className="w-full bg-[#130b22] border border-purple-800/50 focus:border-amber-400/80 rounded-md py-3 pl-10 pr-10 text-center font-mono text-lg tracking-widest text-[#faf7fd] placeholder:text-[#6a5b82] outline-none transition-all"
                  />
                  <Lock className="w-4 h-4 text-[#8c7e9f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-[#8c7e9f] hover:text-[#faf7fd] absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {pinError && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-rose-300 bg-rose-950/60 border border-rose-800/60 rounded py-2 px-3 mb-3">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>{pinError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 active:scale-[0.99] text-white font-medium text-xs font-mono tracking-wider uppercase rounded-md shadow-md hover:shadow-purple-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock Portal</span>
                </button>
              </form>

              {/* Touch Numpad for Quick Mobile Access */}
              <div className="w-full max-w-[240px] grid grid-cols-3 gap-2 mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleNumpadPress(digit)}
                    className="h-11 bg-[#140c24] hover:bg-[#201239] active:bg-purple-900/50 border border-purple-900/40 rounded-md font-mono text-base font-semibold text-[#faf7fd] transition-colors flex items-center justify-center cursor-pointer select-none"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleNumpadClear}
                  className="h-11 bg-[#120a20] hover:bg-[#1c0f32] active:bg-purple-950 border border-purple-950/60 rounded-md font-mono text-xs font-medium text-[#9d8bb8] transition-colors flex items-center justify-center cursor-pointer select-none"
                  title="Clear input"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadPress('0')}
                  className="h-11 bg-[#140c24] hover:bg-[#201239] active:bg-purple-900/50 border border-purple-900/40 rounded-md font-mono text-base font-semibold text-[#faf7fd] transition-colors flex items-center justify-center cursor-pointer select-none"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleNumpadDelete}
                  className="h-11 bg-[#120a20] hover:bg-[#1c0f32] active:bg-purple-950 border border-purple-950/60 rounded-md font-mono text-xs font-medium text-[#9d8bb8] transition-colors flex items-center justify-center cursor-pointer select-none"
                  title="Backspace"
                >
                  ⌫
                </button>
              </div>

              <div className="text-[10px] text-[#786a91] font-mono flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Secured store owner portal • /adminpanel</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="p-4 border-t border-purple-950/60 bg-[#0c0717] flex items-center justify-between text-xs text-[#8c7e9f]">
            <span className="font-mono text-[10px]">Private URL: /adminpanel</span>
            <button
              onClick={onClose}
              className="text-xs text-purple-400 hover:text-purple-300 font-mono transition-colors cursor-pointer"
            >
              Exit to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-xs animate-fade-in"
      onClick={handleLockAndClose}
    >
      <div
        className="relative w-full max-w-xl h-full bg-[#0a0714] border-l border-purple-500/40 shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-purple-950/60 flex items-center justify-between bg-[#0e0818]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#170e28] rounded-xs border border-purple-800/40 text-purple-300">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg text-[#faf7fd] font-medium tracking-wide">
                  SHOP OWNER PORTAL
                </h3>
                <span className="text-[9px] font-mono tracking-widest text-[#d8b4fe] bg-purple-950/80 px-2 py-0.5 border border-purple-700/50 uppercase rounded-2xs">
                  /adminpanel
                </span>
              </div>
              <p className="text-xs text-[#9d8bb8] font-sans">
                Adjust stock, update prices, configure UPI ID, or add new beverages.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 text-xs text-[#d8b4fe] hover:text-white bg-[#1a0e30] hover:bg-[#271549] rounded-xs border border-purple-800/40 transition-colors flex items-center gap-1.5 cursor-pointer font-mono"
              title="Lock Portal (requires password to re-enter)"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Lock</span>
            </button>

            <button
              onClick={handleLockAndClose}
              className="p-2 text-[#8c7e9f] hover:text-[#faf7fd] hover:bg-[#201037] bg-[#160c26] rounded-xs border border-purple-900/40 transition-colors cursor-pointer"
              title="Lock and Close Portal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-purple-950/60 px-6 bg-[#0c0717]">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-4 text-xs font-mono tracking-wider uppercase border-b-2 transition-colors ${
              activeTab === 'inventory'
                ? 'border-purple-500 text-purple-200 font-semibold'
                : 'border-transparent text-[#8c7e9f] hover:text-[#d8b4fe]'
            }`}
          >
            Items ({menuItems.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`py-3 px-4 text-xs font-mono tracking-wider uppercase border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'border-purple-500 text-purple-200 font-semibold'
                : 'border-transparent text-[#8c7e9f] hover:text-[#d8b4fe]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs font-mono tracking-wider uppercase border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-purple-500 text-purple-200 font-semibold'
                : 'border-transparent text-[#8c7e9f] hover:text-[#d8b4fe]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>UPI Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 text-xs font-mono tracking-wider uppercase border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'border-purple-500 text-purple-200 font-semibold'
                : 'border-transparent text-[#8c7e9f] hover:text-[#d8b4fe]'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Live Orders</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          
          {/* Inventory Manager Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#8c7e9f] pb-1">
                <div className="flex items-center gap-2">
                  <span>ITEM & CATEGORY</span>
                  {menuItems.some((i) => !i.available) && (
                    <span className="text-[10px] text-red-300 font-bold bg-red-950/70 border border-red-700/60 px-2 py-0.5 rounded-2xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      {menuItems.filter((i) => !i.available).length} Out of Stock
                    </span>
                  )}
                </div>
                <span>STATUS & PRICING</span>
              </div>

              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xs border transition-all ${
                    item.available
                      ? 'bg-[#120a1f] border-purple-900/40 hover:border-purple-800/60'
                      : 'bg-[#210912] border-red-600/70 ring-1 ring-red-500/40 shadow-xs shadow-red-950/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-mono text-xs font-semibold ${item.available ? 'text-purple-400' : 'text-red-400'}`}>
                          {item.itemNumber}
                        </span>
                        <h4 className={`font-serif text-sm sm:text-base font-medium truncate ${item.available ? 'text-[#faf7fd]' : 'text-red-100 font-semibold'}`}>
                          {item.name}
                        </h4>
                        <span className={`px-1.5 py-0.5 text-[9px] font-mono uppercase rounded-2xs ${
                          item.available
                            ? 'bg-purple-950/60 border border-purple-800/40 text-purple-300'
                            : 'bg-red-950/90 border border-red-700/60 text-red-300'
                        }`}>
                          {item.category}
                        </span>
                        {!item.available && (
                          <span className="px-1.5 py-0.5 bg-red-900/70 border border-red-500/80 text-red-200 text-[9px] font-mono font-bold tracking-wider uppercase rounded-2xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            Sold Out
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${item.available ? 'text-[#9d8bb8]' : 'text-red-200/80 font-sans'}`}>
                        {item.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      className={`p-1.5 rounded-xs transition-colors cursor-pointer group ${
                        item.available
                          ? 'text-[#8c7e9f] hover:text-red-400 hover:bg-red-950/40'
                          : 'text-red-300 hover:text-red-100 hover:bg-red-900/50'
                      }`}
                      title={`Delete ${item.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>

                  <div className={`mt-3 pt-2.5 border-t flex items-center justify-between ${
                    item.available ? 'border-purple-950/60' : 'border-red-900/50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono ${item.available ? 'text-[#8c7e9f]' : 'text-red-300 font-bold'}`}>₹</span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleUpdatePrice(item.id, parseInt(e.target.value))}
                        className={`w-16 font-mono text-xs px-2 py-1 rounded-2xs focus:outline-hidden ${
                          item.available
                            ? 'bg-[#180e28] border border-purple-800/40 text-white focus:border-purple-400'
                            : 'bg-[#2b0c17] border border-red-700/70 text-red-100 focus:border-red-400'
                        }`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(item.id)}
                      className={`px-3 py-1 rounded-2xs text-[10px] font-mono tracking-wider uppercase transition-colors cursor-pointer font-semibold ${
                        item.available
                          ? 'bg-purple-600 hover:bg-purple-500 text-white'
                          : 'bg-red-900/90 hover:bg-red-800 text-red-100 border border-red-500/80 shadow-xs shadow-red-950/60'
                      }`}
                    >
                      {item.available ? 'In Stock' : 'Sold Out'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Item Tab */}
          {activeTab === 'add' && (
            <form onSubmit={handleAddNewItem} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#d8b4fe] mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BLUEBERRY BLAZE"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-[#140b22] border border-purple-800/40 text-white text-xs p-3 rounded-xs focus:border-purple-400 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#d8b4fe] mb-1">
                    Category (Only 3 Allowed)
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as MenuCategory)}
                    className="w-full bg-[#140b22] border border-purple-800/40 text-white text-xs p-3 rounded-xs focus:border-purple-400 focus:outline-hidden"
                  >
                    <option value="soda">01 — SODA</option>
                    <option value="coffee">02 — COLD COFFEE</option>
                    <option value="softy">03 — SOFTY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#d8b4fe] mb-1">
                    Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full bg-[#140b22] border border-purple-800/40 text-white text-xs p-3 rounded-xs focus:border-purple-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#d8b4fe] mb-1">
                  Subtitle / Flavour Profile
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wild blueberry puree · Fizzy soda"
                  value={newItemSubtitle}
                  onChange={(e) => setNewItemSubtitle(e.target.value)}
                  className="w-full bg-[#140b22] border border-purple-800/40 text-white text-xs p-3 rounded-xs focus:border-purple-400 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-mono font-semibold text-xs tracking-wider uppercase rounded-xs transition-colors shadow-[0_0_15px_rgba(147,51,234,0.4)]"
              >
                Add to Live Menu
              </button>
            </form>
          )}

          {/* Settings & Firebase Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Firebase Cloud Firestore Menu Database */}
              <div className="p-4 bg-[#140b22] border border-purple-800/40 rounded-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-mono font-semibold text-[#faf7fd] uppercase">
                      Firebase Menu Database
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isFirebaseConfigured
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isFirebaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    {isFirebaseConfigured ? 'LIVE FIRESTORE' : 'OFFLINE / STANDBY'}
                  </span>
                </div>

                <p className="text-xs text-[#a79bbd] leading-relaxed">
                  Firebase Cloud Firestore is the single source of truth for all menu categories (<code className="text-purple-300 font-mono">menu/soda/items</code>, <code className="text-purple-300 font-mono">menu/coldCoffee</code>, <code className="text-purple-300 font-mono">menu/softy/items</code>) and shop settings.
                </p>

                {/* Firebase Connection & Credentials */}
                <div className="p-4 bg-[#140b22] border border-purple-800/40 rounded-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-mono font-semibold text-[#faf7fd] uppercase">
                        Firebase Project Connection
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60">
                      {TARGET_FIREBASE_PROJECT_ID}
                    </span>
                  </div>

                  <p className="text-xs text-[#a79bbd] leading-relaxed">
                    Connected strictly to project <strong className="text-purple-300 font-mono">{TARGET_FIREBASE_PROJECT_ID}</strong> using Vercel production environment variables.
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-purple-950/60 font-mono text-[11px]">
                    <div className="flex justify-between p-1.5 bg-[#0d0716] rounded-xs border border-purple-950/60">
                      <span className="text-[#8c7e9f]">VITE_FIREBASE_PROJECT_ID</span>
                      <span className="text-emerald-400 font-semibold">{TARGET_FIREBASE_PROJECT_ID}</span>
                    </div>
                    <div className="flex justify-between p-1.5 bg-[#0d0716] rounded-xs border border-purple-950/60">
                      <span className="text-[#8c7e9f]">VITE_FIREBASE_API_KEY</span>
                      <span className="text-purple-300">
                        {currentConfig.apiKey ? `${currentConfig.apiKey.slice(0, 8)}...` : 'Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between p-1.5 bg-[#0d0716] rounded-xs border border-purple-950/60">
                      <span className="text-[#8c7e9f]">VITE_FIREBASE_AUTH_DOMAIN</span>
                      <span className="text-purple-300">{currentConfig.authDomain || 'Default'}</span>
                    </div>
                    <div className="flex justify-between p-1.5 bg-[#0d0716] rounded-xs border border-purple-950/60">
                      <span className="text-[#8c7e9f]">VITE_FIREBASE_STORAGE_BUCKET</span>
                      <span className="text-purple-300">{currentConfig.storageBucket || 'Default'}</span>
                    </div>
                  </div>
                </div>

                {/* Firestore Seeding Action */}
                <div className="pt-2 border-t border-purple-950/60 space-y-2">
                  <button
                    type="button"
                    onClick={handleSeedMenu}
                    disabled={seedingStatus === 'seeding'}
                    className="w-full py-2.5 px-3 bg-[#1e0e33] hover:bg-[#271242] border border-purple-700/60 hover:border-purple-500 text-purple-200 hover:text-white font-mono text-xs font-semibold rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${seedingStatus === 'seeding' ? 'animate-spin' : ''}`} />
                    <span>
                      {seedingStatus === 'seeding'
                        ? 'SEEDING FIRESTORE...'
                        : 'INITIALIZE / SEED MENU TO FIRESTORE'}
                    </span>
                  </button>

                  {seedingMsg && (
                    <div
                      className={`text-[11px] font-mono p-2 rounded-xs flex items-center gap-1.5 ${
                        seedingStatus === 'success'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/60'
                          : 'bg-red-950/60 text-red-300 border border-red-900/60'
                      }`}
                    >
                      {seedingStatus === 'success' ? (
                        <Check className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{seedingMsg}</span>
                    </div>
                  )}

                  <p className="text-[10px] font-mono text-[#74668b]">
                    Writes all 14 Sodas, Cold Coffee & Softies to your Firestore project structure.
                  </p>
                </div>
              </div>

              {/* UPI Form */}
              <form onSubmit={handleSaveUpi} className="space-y-4">
                <div className="p-4 bg-[#140b22] border border-purple-800/40 rounded-xs space-y-2">
                  <div className="text-xs font-mono font-semibold text-[#faf7fd] uppercase">
                    UPI Intent Configuration
                  </div>
                  <p className="text-xs text-[#a79bbd] leading-relaxed">
                    Payments trigger the native intent <code className="text-purple-300 font-mono">upi://pay?pa=...</code> opening Google Pay, PhonePe, or Paytm directly.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#d8b4fe] mb-1">
                    Active Shop UPI ID (VPA)
                  </label>
                  <input
                    type="text"
                    required
                    value={tempUpi}
                    onChange={(e) => setTempUpi(e.target.value)}
                    placeholder="e.g. yourshop@okhdfcbank"
                    className="w-full bg-[#140b22] border border-purple-800/40 text-white text-xs p-3 rounded-xs focus:border-purple-400 focus:outline-hidden font-mono"
                  />
                  <p className="text-[10px] font-mono text-[#74668b] mt-1">
                    Default from config: <span className="text-purple-300">{shopUpiId}</span>
                  </p>
                </div>

                {upiFeedback && (
                  <div
                    className={`text-[11px] font-mono p-2.5 rounded-xs flex items-center gap-1.5 ${
                      upiFeedback.type === 'success'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        : 'bg-red-950/80 text-red-300 border border-red-800/60'
                    }`}
                  >
                    {upiFeedback.type === 'success' ? (
                      <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                    )}
                    <span>{upiFeedback.msg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingUpi}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-mono font-semibold text-xs tracking-wider uppercase rounded-xs transition-colors shadow-[0_0_15px_rgba(147,51,234,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSavingUpi && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSavingUpi ? 'SAVING TO FIREBASE...' : 'SAVE & SYNC TO FIREBASE'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Live Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#a79bbd] uppercase">
                  SERVER ORDER REGISTRY ({liveOrders.length})
                </span>
                <button
                  onClick={fetchLiveOrders}
                  disabled={loadingOrders}
                  className="text-xs font-mono text-purple-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                  <span>REFRESH</span>
                </button>
              </div>

              {liveOrders.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-[#746589] border border-purple-950/60 rounded-xs">
                  NO ORDERS RECORDED ON SERVER YET
                </div>
              ) : (
                <div className="space-y-2.5">
                  {liveOrders.map((ord) => (
                    <div
                      key={ord.orderId}
                      className="p-3.5 bg-[#130b22] border border-purple-900/40 rounded-xs space-y-2 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#faf7fd] tracking-wider">
                          ORDER #{ord.orderNumber || ord.orderId}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === 'PAID'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                              : ord.status === 'FAILED'
                              ? 'bg-red-950/80 text-red-300 border border-red-700/50'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-700/50'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#a79bbd] space-y-0.5">
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className="text-purple-300 font-bold">₹{ord.amount}</span>
                        </div>
                        <div className="flex justify-between truncate">
                          <span>Txn:</span>
                          <span className="text-[#8c7e9f] truncate max-w-[200px]">{ord.transactionId}</span>
                        </div>
                        {ord.paymentDetails?.bankRrn && (
                          <div className="flex justify-between">
                            <span>Bank Ref:</span>
                            <span className="text-emerald-400">{ord.paymentDetails.bankRrn}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[10px] text-[#6b5d7e]">
                          <span>Created:</span>
                          <span>{new Date(ord.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {ord.items && ord.items.length > 0 && (
                        <div className="pt-1.5 border-t border-purple-950/80 text-[11px] text-[#d8b4fe]">
                          {ord.items.map((it: any) => `${it.name} × ${it.quantity}`).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-purple-950/60 flex items-center justify-between bg-[#0e0818]">
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetToDefault();
                  setConfirmReset(false);
                  triggerToast('RESET TO DEFAULTS');
                }}
                className="text-xs font-mono font-semibold text-red-400 hover:text-red-300 bg-red-950/60 border border-red-800/60 px-2.5 py-1 rounded-xs transition-colors cursor-pointer"
              >
                Confirm Reset?
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="text-xs font-mono text-[#8c7e9f] hover:text-white px-2 py-1 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-xs font-mono text-[#8c7e9f] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          )}

          {saveToast && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 animate-fade-in font-semibold bg-emerald-950/60 px-2 py-1 rounded-xs border border-emerald-800/40">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="uppercase">{toastMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
