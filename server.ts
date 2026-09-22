import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { StandardUpiGatewayProvider, PaymentOrder } from './server/paymentProvider';
import { orderStore } from './server/orderStore';
import {
  serverUpdateItemAvailability,
  serverUpdateItemPrice,
  serverUpdateShopSettings,
  serverAddItem,
  serverDeleteItem,
} from './server/firebaseServer';

const PORT = 3000;
const paymentProvider = new StandardUpiGatewayProvider();

async function startServer() {
  const app = express();

  // Parse JSON payloads
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'NEW UNIQUE COLD DRINKS — Direct UPI Payment Engine',
      provider: paymentProvider.name,
      time: new Date().toISOString(),
    });
  });

  // 1. Create Direct UPI Order
  app.post('/api/payment/create', async (req: Request, res: Response) => {
    try {
      const { items, amount, merchantUpiId } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order must contain at least one item' });
      }

      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid order amount' });
      }

      // Calculate server-authoritative item sum
      const calculatedTotal = items.reduce(
        (sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
        0
      );

      // Verify client amount matches server calculated items total
      if (Math.abs(calculatedTotal - amount) > 0.01) {
        return res.status(400).json({
          error: `Amount mismatch: client requested ₹${amount}, but items total ₹${calculatedTotal}`,
        });
      }

      const cleanMerchantUpi = (merchantUpiId || 'newuniquecolddrinks@okaxis').trim();

      // Generate direct UPI intent URL
      const paymentIntent = await paymentProvider.createPayment({
        items,
        amount: calculatedTotal,
        merchantUpiId: cleanMerchantUpi,
      });

      const newOrder: PaymentOrder = {
        orderId: paymentIntent.orderId,
        orderNumber: paymentIntent.orderNumber,
        transactionId: paymentIntent.transactionId,
        amount: paymentIntent.amount,
        currency: 'INR',
        merchantUpiId: paymentIntent.merchantUpiId,
        items,
        status: 'PENDING',
        upiIntentUrl: paymentIntent.upiIntentUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      orderStore.createOrder(newOrder);

      return res.status(201).json({
        success: true,
        orderId: newOrder.orderId,
        orderNumber: newOrder.orderNumber,
        transactionId: newOrder.transactionId,
        amount: newOrder.amount,
        currency: newOrder.currency,
        merchantUpiId: newOrder.merchantUpiId,
        upiIntentUrl: newOrder.upiIntentUrl,
        status: newOrder.status,
      });
    } catch (error: any) {
      console.error('[Payment Create Error]', error);
      return res.status(500).json({ error: error.message || 'Failed to initialize UPI order' });
    }
  });

  // 2. Query Order Status
  app.get('/api/payment/status/:orderId', (req: Request, res: Response) => {
    const { orderId } = req.params;
    const order = orderStore.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: `Order ${orderId} not found` });
    }

    return res.json({
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      transactionId: order.transactionId,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      items: order.items,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  });

  // 3. Confirm / Complete Order
  app.post('/api/payment/confirm/:orderId', (req: Request, res: Response) => {
    const { orderId } = req.params;
    const order = orderStore.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: `Order ${orderId} not found` });
    }

    const updated = orderStore.updateOrderStatus(order.orderId, 'PAID');
    return res.json({ success: true, order: updated });
  });

  // 4. View All Orders (for Bar / Counter Staff)
  app.get('/api/orders', (_req: Request, res: Response) => {
    const orders = orderStore.getAllOrders();
    res.json({ orders });
  });

  // 5. Firebase Live Menu Updates
  app.post('/api/firebase/item/availability', async (req: Request, res: Response) => {
    try {
      const { item, available } = req.body;
      if (!item) return res.status(400).json({ error: 'Item required' });
      await serverUpdateItemAvailability(item, Boolean(available));
      return res.json({ success: true, item: item.name, available });
    } catch (err: any) {
      console.error('[Firebase server update availability error]:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/firebase/item/price', async (req: Request, res: Response) => {
    try {
      const { item, price } = req.body;
      if (!item || typeof price !== 'number') return res.status(400).json({ error: 'Item and valid price required' });
      await serverUpdateItemPrice(item, price);
      return res.json({ success: true, item: item.name, price });
    } catch (err: any) {
      console.error('[Firebase server update price error]:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/firebase/settings', async (req: Request, res: Response) => {
    try {
      const settings = req.body;
      if (!settings) return res.status(400).json({ error: 'Settings object required' });
      await serverUpdateShopSettings(settings);
      return res.json({ success: true, settings });
    } catch (err: any) {
      console.error('[Firebase server update settings error]:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/firebase/item/add', async (req: Request, res: Response) => {
    try {
      const item = req.body;
      if (!item || !item.name) return res.status(400).json({ error: 'Item name required' });
      const result = await serverAddItem(item);
      return res.json({ success: true, result });
    } catch (err: any) {
      console.error('[Firebase server add item error]:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/firebase/item/delete', async (req: Request, res: Response) => {
    try {
      const { id, item } = req.body;
      const target = item || id;
      if (!target) return res.status(400).json({ error: 'Item or item id required' });
      await serverDeleteItem(target);
      return res.json({ success: true, deleted: target });
    } catch (err: any) {
      console.error('[Firebase server delete item error]:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NEW UNIQUE COLD DRINKS backend running on port ${PORT}`);
  });
}

startServer();
