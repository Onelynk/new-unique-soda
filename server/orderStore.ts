import { PaymentOrder, PaymentStatus } from './paymentProvider';

class OrderStore {
  private orders = new Map<string, PaymentOrder>();

  // Map transactionId -> orderId to prevent duplicate transaction IDs
  private transactionIndex = new Map<string, string>();

  createOrder(order: PaymentOrder): PaymentOrder {
    if (this.transactionIndex.has(order.transactionId)) {
      throw new Error(`Transaction ID ${order.transactionId} has already been used.`);
    }

    this.orders.set(order.orderId, order);
    this.transactionIndex.set(order.transactionId, order.orderId);
    return order;
  }

  getOrder(orderId: string): PaymentOrder | undefined {
    return this.orders.get(orderId);
  }

  getOrderByTransactionId(transactionId: string): PaymentOrder | undefined {
    const orderId = this.transactionIndex.get(transactionId);
    if (!orderId) return undefined;
    return this.orders.get(orderId);
  }

  getAllOrders(): PaymentOrder[] {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  updateOrderStatus(
    orderId: string,
    status: PaymentStatus,
    details?: Partial<PaymentOrder['paymentDetails']> & { failureReason?: string }
  ): PaymentOrder | undefined {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    // Transition guards: once an order is PAID, it cannot be reverted
    if (order.status === 'PAID') {
      return order;
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();

    if (status === 'PAID') {
      order.verifiedAt = new Date().toISOString();
    }

    if (details?.failureReason) {
      order.failureReason = details.failureReason;
    }

    if (details) {
      order.paymentDetails = {
        ...order.paymentDetails,
        ...details,
      };
    }

    this.orders.set(orderId, order);
    return order;
  }
}

export const orderStore = new OrderStore();
