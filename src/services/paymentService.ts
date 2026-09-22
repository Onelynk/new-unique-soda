import { CartItem } from '../types';

export interface UpiOrderDetails {
  orderId: string;
  orderNumber: string;
  transactionId: string;
  amount: number;
  currency: 'INR';
  merchantUpiId: string;
  merchantName: string;
  upiIntentUrl: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
}

export interface PendingPayment {
  orderId: string;
  orderNumber: string;
  transactionId: string;
  amount: number;
  currency: 'INR';
  merchantUpiId: string;
  merchantName: string;
  upiIntentUrl: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  cartItems: CartItem[];
  createdAt: number;
}

const PENDING_PAYMENT_STORAGE_KEY = 'nu_pending_upi_payment';

/**
 * Builds a standard NPCI UPI Intent URI for launching default UPI apps (Google Pay, PhonePe, Paytm, etc.)
 */
export function buildUpiIntentUrl(params: {
  merchantUpiId: string;
  merchantName: string;
  amount: number;
  note: string;
  transactionRefId: string;
}): string {
  const pa = encodeURIComponent(params.merchantUpiId.trim());
  const pn = encodeURIComponent(params.merchantName.trim());
  const am = encodeURIComponent(params.amount.toFixed(2));
  const tn = encodeURIComponent(params.note);
  const tr = encodeURIComponent(params.transactionRefId);

  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}&tr=${tr}`;
}

/**
 * Directs the browser/device to the default UPI app using the URL intent
 */
export function redirectToUpiApp(upiUrl: string): void {
  if (typeof window !== 'undefined') {
    // Navigating to upi:// launches the device's default UPI app / intent handler
    window.location.href = upiUrl;
  }
}

/**
 * Creates client-side order details with a unique order number and UPI intent URL
 */
export function createUpiOrder(
  cart: CartItem[],
  totalAmount: number,
  merchantUpiId: string,
  merchantName: string = 'NEW UNIQUE COLD DRINKS'
): UpiOrderDetails {
  const timestamp = Date.now();
  const shortNum = Math.floor(100 + Math.random() * 900);
  const orderNumber = `NU-${shortNum}`;
  const orderId = `ORD-${timestamp}-${shortNum}`;
  const transactionId = `TXN-${timestamp}-${Math.floor(1000 + Math.random() * 9000)}`;

  const upiIntentUrl = buildUpiIntentUrl({
    merchantUpiId,
    merchantName,
    amount: totalAmount,
    note: `Order ${orderNumber} - ${merchantName}`,
    transactionRefId: transactionId,
  });

  return {
    orderId,
    orderNumber,
    transactionId,
    amount: totalAmount,
    currency: 'INR',
    merchantUpiId,
    merchantName,
    upiIntentUrl,
    items: cart.map((ci) => ({
      id: ci.item.id,
      name: ci.item.name,
      quantity: ci.quantity,
      price: ci.item.price,
    })),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Persists pending payment details in storage across app-switch or page reloads
 */
export function savePendingPayment(order: PendingPayment): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(order));
  } catch (e) {
    console.warn('Could not save pending UPI payment', e);
  }
}

/**
 * Retrieves the pending payment if it was initiated within the last 45 minutes
 */
export function getPendingPayment(): PendingPayment | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PENDING_PAYMENT_STORAGE_KEY);
    if (!raw) return null;
    const data: PendingPayment = JSON.parse(raw);
    // Discard if older than 45 minutes
    if (Date.now() - (data.createdAt || 0) > 45 * 60 * 1000) {
      clearPendingPayment();
      return null;
    }
    return data;
  } catch (e) {
    console.warn('Could not read pending UPI payment', e);
    return null;
  }
}

/**
 * Clears any pending payment from storage
 */
export function clearPendingPayment(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
  } catch (e) {
    console.warn('Could not clear pending UPI payment', e);
  }
}
