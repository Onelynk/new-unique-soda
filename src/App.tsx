import React, { useState, useEffect } from 'react';
import { MenuItem, MainTab, CartItem } from './types';
import { INITIAL_MENU_ITEMS } from './data/menuData';
import { BRAND_INFO, SHOP_UPI_ID, SHOP_NAME } from './data/brandData';
import { getRuntimeMenuUrl } from './utils/url';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { MenuSection } from './components/MenuSection';
import { DigitalCardSection } from './components/DigitalCardSection';
import { ItemBottomSheet } from './components/ItemBottomSheet';
import { CartFloatingBar } from './components/CartFloatingBar';
import { CartOrderSheet } from './components/CartOrderSheet';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { ManualPaymentConfirmationModal } from './components/ManualPaymentConfirmationModal';
import { QrCodeModal } from './components/QrCodeModal';
import { ShareModal } from './components/ShareModal';
import { BarManagerDrawer } from './components/BarManagerDrawer';
import { Footer } from './components/Footer';
import {
  PendingPayment,
  getPendingPayment,
  clearPendingPayment,
  redirectToUpiApp,
} from './services/paymentService';
import {
  subscribeToFirestoreMenu,
  fetchFirestoreMenu,
  updateShopSettingsInFirestore,
} from './services/menuFirestoreService';
import { isFirebaseConfigured } from './lib/firebase';

const MENU_STORAGE_KEY = 'nu_cold_drinks_menu_v3';
const UPI_STORAGE_KEY = 'nu_cold_drinks_upi_v3';

export default function App() {
  // Navigation: MENU | CARD
  const [currentTab, setCurrentTab] = useState<MainTab>('menu');

  // Active Category state (synced with hero selection)
  const [activeCategory, setActiveCategory] = useState<import('./types').MenuCategory>('soda');

  // Menu items state driven by Cloud Firestore
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(MENU_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse cached menu items', e);
        }
      }
    }
    return INITIAL_MENU_ITEMS;
  });

  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // Shop UPI ID with persistence
  const [shopUpiId, setShopUpiId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(UPI_STORAGE_KEY);
      if (saved) return saved;
    }
    return SHOP_UPI_ID;
  });

  // Friendly error state compliant with Section 19
  const [hasFirebaseError, setHasFirebaseError] = useState(false);

  // Initial fetch and real-time Cloud Firestore subscription for menu items & shop configuration
  useEffect(() => {
    let isMounted = true;

    // 1. Immediate fetch from 'menu' collection
    fetchFirestoreMenu()
      .then((data) => {
        if (!isMounted) return;
        if (data && data.items && data.items.length > 0) {
          setMenuItems(data.items);
          setHasFirebaseError(false);
          setIsLoadingMenu(false);
          try {
            localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(data.items));
          } catch (e) {}
        }
        if (data && data.shopSettings && data.shopSettings.upiId) {
          setShopUpiId(data.shopSettings.upiId);
          try {
            localStorage.setItem(UPI_STORAGE_KEY, data.shopSettings.upiId);
          } catch (e) {}
        }
      })
      .catch((err) => {
        console.warn('Direct fetch from Firestore failed:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingMenu(false);
        }
      });

    // 2. Real-time subscription to 'menu' collection and 'settings/shop'
    const unsubscribe = subscribeToFirestoreMenu(
      (firestoreItems) => {
        if (!isMounted) return;
        if (firestoreItems && firestoreItems.length > 0) {
          setMenuItems(firestoreItems);
          setHasFirebaseError(false);
          setIsLoadingMenu(false);
          try {
            localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(firestoreItems));
          } catch (e) {
            // Storage quota warning safely handled
          }
        }
      },
      (shopSettings) => {
        if (!isMounted) return;
        if (shopSettings && shopSettings.upiId) {
          setShopUpiId(shopSettings.upiId);
          try {
            localStorage.setItem(UPI_STORAGE_KEY, shopSettings.upiId);
          } catch (e) {}
        }
      },
      (_err) => {
        if (!isMounted) return;
        setIsLoadingMenu(false);
        // Fallback to initial items if empty so user is never locked out
        setMenuItems((current) => {
          if (!current || current.length === 0) {
            return INITIAL_MENU_ITEMS;
          }
          return current;
        });
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Item Bottom Sheet selection
  const [selectedItemForSheet, setSelectedItemForSheet] = useState<MenuItem | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);

  // Order Confirmation Modal
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: string;
    items: CartItem[];
    total: number;
  } | null>(null);

  // Manual Payment Confirmation on return from UPI app
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);

  // Helper to check if URL points to adminpanel
  const isDirectAdminUrl = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path === '/adminpanel' ||
      path === '/admin-panel' ||
      path === '/admin' ||
      hash === '#adminpanel' ||
      search.includes('adminpanel')
    );
  };

  // Dialogs & drawers
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(isDirectAdminUrl);

  // Sync /adminpanel route on browser popstate/hashchange
  useEffect(() => {
    const handleUrlChange = () => {
      if (isDirectAdminUrl()) {
        setIsManagerOpen(true);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleOpenManager = () => {
    setIsManagerOpen(true);
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      if (path !== '/adminpanel') {
        window.history.pushState({ panel: 'admin' }, '', '/adminpanel');
      }
    }
  };

  const handleCloseManager = () => {
    setIsManagerOpen(false);
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      if (path === '/adminpanel' || path === '/admin-panel' || path === '/admin') {
        window.history.pushState(null, '', '/');
      }
    }
  };

  // Return-to-page experience: Detect when user returns from UPI app and prompt friendly manual confirmation
  useEffect(() => {
    const checkForPendingPayment = () => {
      // If already viewing an order confirmation, don't interrupt
      if (confirmedOrder) return;

      const pending = getPendingPayment();
      if (pending) {
        setPendingPayment(pending);
        setIsOrderSheetOpen(false);
      }
    };

    // 1. Check immediately upon page load / return
    checkForPendingPayment();

    // 2. Check whenever user returns or switches back to this browser tab (from GPay, PhonePe, Paytm, etc.)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForPendingPayment();
      }
    };

    // 3. Check when window regains focus
    const handleFocus = () => {
      checkForPendingPayment();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Clean up any remaining URL search parameters
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [confirmedOrder]);

  // Save menu changes
  const handleUpdateMenuItems = (items: MenuItem[]) => {
    setMenuItems(items);
    if (typeof window !== 'undefined') {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
    }
  };

  const handleResetToDefault = () => {
    setMenuItems(INITIAL_MENU_ITEMS);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MENU_STORAGE_KEY);
    }
  };

  // Save UPI ID
  const handleUpdateShopUpiId = (id: string) => {
    setShopUpiId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(UPI_STORAGE_KEY, id);
    }
    updateShopSettingsInFirestore({ upiId: id }).catch((err) => {
      console.warn('Failed to update UPI ID in Firestore:', err);
    });
  };

  // Cart operations
  const handleAddToCart = (item: MenuItem, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + quantity } : c
        );
      }
      return [...prev, { item, quantity }];
    });
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((c) => c.item.id !== itemId));
    } else {
      setCart((prev) =>
        prev.map((c) => (c.item.id === itemId ? { ...c, quantity: newQuantity } : c))
      );
    }
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handlePaymentCompleted = (order: {
    id: string;
    orderNumber: string;
    transactionId: string;
    items: CartItem[];
    total: number;
    verifiedAt?: string;
    bankRrn?: string;
  }) => {
    setConfirmedOrder({
      id: order.orderNumber || order.id,
      items: [...order.items],
      total: order.total,
    });
    setCart([]);
  };

  const handleCloseConfirmation = () => {
    setConfirmedOrder(null);
    setCurrentTab('menu');
  };

  // Handlers for manual payment confirmation when returning from UPI app
  const handleConfirmManualPayment = () => {
    if (!pendingPayment) return;

    setConfirmedOrder({
      id: pendingPayment.orderNumber || pendingPayment.orderId,
      items: pendingPayment.cartItems || [],
      total: pendingPayment.amount,
    });

    clearPendingPayment();
    setPendingPayment(null);
    setCart([]);
    setCurrentTab('menu');
  };

  const handleReopenUpi = () => {
    if (pendingPayment?.upiIntentUrl) {
      redirectToUpiApp(pendingPayment.upiIntentUrl);
    }
  };

  const handleCancelManualPayment = () => {
    clearPendingPayment();
    setPendingPayment(null);
  };

  // Scroll smoothly when tab is toggled
  const handleSelectTab = (tab: MainTab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic share handler: native Web Share API on mobile, with fallback to Share & QR modal
  const handleShareMenu = async () => {
    const runtimeUrl = getRuntimeMenuUrl();
    const shareTitle = SHOP_NAME;
    const shareText = `${SHOP_NAME}\nSoda • Cold Coffee • Softy\nScan to open menu:\n${runtimeUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: runtimeUrl,
        });
        return;
      } catch (err) {
        // Fallback to modal if share was dismissed or not completed
      }
    }
    setIsShareModalOpen(true);
  };

  if (hasFirebaseError) {
    return (
      <div id="firebase-error-view" className="min-h-screen bg-[#0a0712] text-[#fdf8f4] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-sm w-full bg-[#120a1c] border border-purple-900/40 rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#faf7fd] tracking-tight">Something went wrong.</h1>
            <p className="text-sm text-[#a79bbd]">Please try again.</p>
          </div>
          <div className="space-y-3">
            <button
              id="error-try-again-btn"
              onClick={() => {
                setHasFirebaseError(false);
                window.location.reload();
              }}
              className="w-full py-3.5 px-6 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer shadow-lg shadow-purple-900/30"
            >
              TRY AGAIN
            </button>
            <button
              id="error-offline-menu-btn"
              onClick={() => {
                setMenuItems(INITIAL_MENU_ITEMS);
                setHasFirebaseError(false);
              }}
              className="w-full py-2.5 px-6 bg-transparent hover:bg-purple-950/40 text-purple-300 font-mono text-xs tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer border border-purple-900/40"
            >
              VIEW OFFLINE MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0712] text-[#fdf8f4] font-sans selection:bg-purple-600/40 selection:text-white">
      
      {/* 00 — Top Navigation (MENU | CARD) */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenQr={() => setIsQrModalOpen(true)}
        isManagerOpen={isManagerOpen}
        onShare={handleShareMenu}
      />

      {/* Main View Container */}
      <main>
        {currentTab === 'menu' ? (
          <>
            {/* 01 — HERO SECTION */}
            <HeroSection
              onViewMenu={() => {
                const el = document.getElementById('menu');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onSelectCategory={(cat) => setActiveCategory(cat)}
              onShareMenu={handleShareMenu}
              onOpenQr={() => setIsQrModalOpen(true)}
              onOpenCard={() => handleSelectTab('card')}
            />

            {/* 02 — MENU SECTION (SODA | COLD COFFEE | SOFTY) */}
            <MenuSection
              menuItems={menuItems}
              activeCategory={activeCategory}
              onCategoryChange={(cat) => setActiveCategory(cat)}
              selectedItem={selectedItemForSheet}
              onSelectItem={(item) => setSelectedItemForSheet(item)}
              onAddToCart={handleAddToCart}
              onOpenQr={() => setIsQrModalOpen(true)}
              onShareMenu={handleShareMenu}
            />
          </>
        ) : (
          <>
            {/* 03 — DIGITAL BUSINESS CARD SECTION */}
            <DigitalCardSection
              onExploreMenu={() => handleSelectTab('menu')}
              onShare={handleShareMenu}
            />
          </>
        )}
      </main>

      {/* Minimal Footer */}
      <Footer
        onSelectTab={handleSelectTab}
        onOpenManager={handleOpenManager}
      />

      {/* ITEM INTERACTION: Minimal Bottom Sheet */}
      <ItemBottomSheet
        item={selectedItemForSheet}
        onClose={() => setSelectedItemForSheet(null)}
        onAddToCart={handleAddToCart}
      />

      {/* STICKY / FLOATING CART BAR */}
      <CartFloatingBar
        cart={cart}
        onOpenOrder={() => setIsOrderSheetOpen(true)}
      />

      {/* CART & UPI PAYMENT FLOW SHEET */}
      <CartOrderSheet
        isOpen={isOrderSheetOpen}
        cart={cart}
        shopUpiId={shopUpiId}
        onClose={() => setIsOrderSheetOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        onPaymentCompleted={handlePaymentCompleted}
      />

      {/* ORDER CONFIRMATION MODAL */}
      <OrderConfirmationModal
        isOpen={Boolean(confirmedOrder)}
        orderId={confirmedOrder?.id || ''}
        items={confirmedOrder?.items || []}
        total={confirmedOrder?.total || 0}
        onClose={handleCloseConfirmation}
      />

      {/* FRIENDLY MANUAL PAYMENT CONFIRMATION (RETURN FROM UPI APP) */}
      <ManualPaymentConfirmationModal
        isOpen={Boolean(pendingPayment)}
        pendingPayment={pendingPayment}
        shopUpiId={shopUpiId}
        onConfirm={handleConfirmManualPayment}
        onReopenUpi={handleReopenUpi}
        onCancel={handleCancelManualPayment}
      />

      {/* QR CODE MODAL (DYNAMIC RUNTIME QR & FULLSCREEN) */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      {/* SHARE MODAL (FALLBACK & COPY LINK) */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onOpenQr={() => {
          setIsShareModalOpen(false);
          setIsQrModalOpen(true);
        }}
      />

      {/* BAR OWNER PORTAL DRAWER */}
      <BarManagerDrawer
        isOpen={isManagerOpen}
        onClose={handleCloseManager}
        menuItems={menuItems}
        onUpdateItems={handleUpdateMenuItems}
        onResetToDefault={handleResetToDefault}
        shopUpiId={shopUpiId}
        onUpdateShopUpiId={handleUpdateShopUpiId}
      />

    </div>
  );
}
