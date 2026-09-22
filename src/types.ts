export type MainTab = 'menu' | 'card';

export type MenuCategory = 'soda' | 'coffee' | 'softy';

export interface MenuItem {
  id: string;
  itemNumber: string; // e.g. "01", "02"
  name: string;
  category: MenuCategory;
  subtitle: string; // e.g. "Crisp apple · Chilled soda"
  description: string;
  price: number;
  image?: string;
  badge?: 'SIGNATURE' | 'POPULAR' | 'CHILLED' | 'NEW';
  available: boolean;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export type PaymentStatus = 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';

export interface VerifiedPaymentOrder {
  orderId: string;
  orderNumber: string; // e.g. "NU042"
  transactionId: string;
  amount: number;
  currency: 'INR';
  merchantUpiId: string;
  status: PaymentStatus;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  upiIntentUrl?: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  failureReason?: string;
  paymentDetails?: {
    bankRrn?: string;
    payerVpa?: string;
    verifiedBy?: 'WEBHOOK' | 'STATUS_API' | 'MANUAL_VERIFY';
  };
}

export interface Order {
  id: string; // e.g. "NU042"
  orderId?: string; // e.g. "NU-20260918-042"
  transactionId?: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'UPI';
  upiRef: string;
  createdAt: string;
  status?: PaymentStatus;
  verifiedAt?: string;
}

export interface ShopInfo {
  name: string;
  legalName: string;
  tagline: string;
  subtitle: string;
  description: string;
  address: string;
  city: string;
  pinCode: string;
  landmark: string;
  phone: string;
  displayPhone: string;
  whatsapp: string;
  whatsappMessage: string;
  instagram: string;
  instagramHandle: string;
  mapsUrl: string;
  shopUpiId: string;
  hours: {
    weekdays: string;
    weekends: string;
  };
}
