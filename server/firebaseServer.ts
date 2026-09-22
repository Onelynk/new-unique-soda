import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBJIOFrcL2qE_FY7O5_5rIPmiaRXLWkL-U',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'unique-soda.firebaseapp.com',
  projectId: 'unique-soda',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'unique-soda.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '226831322614',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:226831322614:web:7e5fce1021c5abd9500bd7',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

function toDocSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

function getDocId(category: string, name: string): string {
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
  return `${category.toLowerCase()}_${cleanName}`;
}

export async function serverUpdateItemAvailability(item: { id?: string; name: string; category?: string }, available: boolean) {
  const docIds = new Set<string>();
  if (item.id) docIds.add(item.id);
  const cat = item.category || 'soda';
  docIds.add(getDocId(cat, item.name));
  docIds.add(toDocSlug(item.name));

  if (cat === 'coffee' || item.name.toLowerCase().includes('coffee')) {
    docIds.add('coffee_coldCoffee');
    docIds.add('coldCoffee');
  }

  for (const docId of docIds) {
    await setDoc(doc(db, 'menu', docId), { available }, { merge: true });
    if (cat === 'soda') {
      await setDoc(doc(db, 'menu', 'soda', 'items', docId), { available }, { merge: true });
    } else if (cat === 'softy') {
      await setDoc(doc(db, 'menu', 'softy', 'items', docId), { available }, { merge: true });
    }
  }
  return true;
}

export async function serverUpdateItemPrice(item: { id?: string; name: string; category?: string }, price: number) {
  const docIds = new Set<string>();
  if (item.id) docIds.add(item.id);
  const cat = item.category || 'soda';
  docIds.add(getDocId(cat, item.name));
  docIds.add(toDocSlug(item.name));

  if (cat === 'coffee' || item.name.toLowerCase().includes('coffee')) {
    docIds.add('coffee_coldCoffee');
    docIds.add('coldCoffee');
  }

  for (const docId of docIds) {
    await setDoc(doc(db, 'menu', docId), { price: Number(price) }, { merge: true });
    if (cat === 'soda') {
      await setDoc(doc(db, 'menu', 'soda', 'items', docId), { price: Number(price) }, { merge: true });
    } else if (cat === 'softy') {
      await setDoc(doc(db, 'menu', 'softy', 'items', docId), { price: Number(price) }, { merge: true });
    }
  }
  return true;
}

export async function serverUpdateShopSettings(settings: { shopName?: string; tagline?: string; address?: string; upiId?: string; googleMapsUrl?: string }) {
  await setDoc(doc(db, 'settings', 'shop'), settings, { merge: true });
  return true;
}

export async function serverAddItem(item: { name: string; category: string; description?: string; price: number; image?: string; available?: boolean; sortOrder?: number; badge?: string }) {
  const docId = getDocId(item.category, item.name);
  const data = {
    name: item.name.toUpperCase(),
    category: item.category,
    description: item.description || '',
    price: Number(item.price) || 0,
    image: item.image || '',
    available: item.available !== false,
    sortOrder: Number(item.sortOrder) || 99,
    badge: item.badge || null,
  };

  await setDoc(doc(db, 'menu', docId), data, { merge: true });
  if (item.category === 'soda') {
    await setDoc(doc(db, 'menu', 'soda', 'items', docId), data, { merge: true });
  } else if (item.category === 'softy') {
    await setDoc(doc(db, 'menu', 'softy', 'items', docId), data, { merge: true });
  }
  return { docId, data };
}

export async function serverDeleteItem(itemOrId: { id?: string; name?: string; category?: string } | string) {
  const docIds = new Set<string>();
  if (typeof itemOrId === 'string') {
    docIds.add(itemOrId);
  } else {
    if (itemOrId.id) docIds.add(itemOrId.id);
    const cat = itemOrId.category || 'soda';
    if (itemOrId.name) {
      docIds.add(getDocId(cat, itemOrId.name));
      docIds.add(toDocSlug(itemOrId.name));
    }
    if (cat === 'coffee' || (itemOrId.name && itemOrId.name.toLowerCase().includes('coffee'))) {
      docIds.add('coffee_coldCoffee');
      docIds.add('coldCoffee');
    }
  }

  for (const id of docIds) {
    await deleteDoc(doc(db, 'menu', id)).catch(() => {});
    await deleteDoc(doc(db, 'menu', 'soda', 'items', id)).catch(() => {});
    await deleteDoc(doc(db, 'menu', 'softy', 'items', id)).catch(() => {});
  }
  return true;
}

export { db as serverFirestore };
