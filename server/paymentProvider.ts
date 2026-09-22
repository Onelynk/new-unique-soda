import crypto from 'crypto';

export type PaymentStatus = 'CREATED' | 'PENDING' | 'PAID' | 'FAILED';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface PaymentOrder {
  orderId: string;
  orderNumber: string; // e.g. "NU-042"
  transactionId: string;
  amount: number;
  currency: 'INR';
  merchantUpiId: string;
  items: OrderItem[];
  status: PaymentStatus;
  upiIntentUrl: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  failureReason?: string;
  paymentDetails?: Record<string, any>;
}

export interface CreatePaymentParams {
  items: OrderItem[];
  amount: number;
  merchantUpiId: string;
  customerNote?: string;
  clientReturnUrl?: string;
}

export class StandardUpiGatewayProvider {
  readonly name = 'DirectUpiIntentProvider';

  private generateOrderId(): { orderId: string; orderNumber: string } {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = Math.floor(100 + Math.random() * 900);
    const shortSeq = String(seq).padStart(3, '0');
    return {
      orderId: `NU-${dateStr}-${shortSeq}`,
      orderNumber: `NU${shortSeq}`,
    };
  }

  private generateTransactionId(): string {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `TXN-UPI-${Date.now()}-${randomHex}`;
  }

  async createPayment(params: CreatePaymentParams) {
    const { orderId, orderNumber } = this.generateOrderId();
    const transactionId = this.generateTransactionId();
    const cleanMerchant = (params.merchantUpiId || 'newuniquecolddrinks@okaxis').trim();
    const formattedAmount = params.amount.toFixed(2);
    const note = `Order ${orderNumber} - New Unique Cold Drinks`;

    // Standard NPCI UPI URI Scheme (direct launch for default UPI app: Google Pay, PhonePe, Paytm, etc.)
    const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(cleanMerchant)}&pn=${encodeURIComponent('NEW UNIQUE COLD DRINKS')}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(note)}&tr=${encodeURIComponent(transactionId)}`;

    return {
      orderId,
      orderNumber,
      transactionId,
      amount: params.amount,
      currency: 'INR' as const,
      merchantUpiId: cleanMerchant,
      upiIntentUrl,
      status: 'PENDING' as PaymentStatus,
    };
  }
}
