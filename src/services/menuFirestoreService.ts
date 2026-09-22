import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured, TARGET_FIREBASE_PROJECT_ID } from '../lib/firebase';
import { MenuItem, MenuCategory } from '../types';
import { INITIAL_MENU_ITEMS } from '../data/menuData';
import { BRAND_INFO } from '../data/brandData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const currentAuth = auth;
  const user = currentAuth?.currentUser || null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
      tenantId: user?.tenantId,
      providerInfo: user?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn(`[Firestore ${operationType.toUpperCase()} Error on '${path}']:`, errInfo.error);
  return errInfo;
}

/**
 * Converts a category and name into a clean, human-readable document ID.
 */
export function getDocId(category: string, name: string): string {
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
  return `${category.toLowerCase()}_${cleanName}`;
}

export interface FirestoreSodaItem {
  id?: string;
  name: string;
  category?: string;
  description: string;
  price: number;
  image?: string;
  available: boolean;
  sortOrder: number;
}

export interface FirestoreCoffeeItem {
  id?: string;
  name: string;
  category?: string;
  description: string;
  price: number;
  image?: string;
  available: boolean;
}

export interface FirestoreSoftyItem {
  id?: string;
  name: string;
  category?: string;
  description?: string;
  price: number;
  image?: string;
  available: boolean;
  sortOrder: number;
}

export interface FirestoreShopSettings {
  shopName: string;
  tagline: string;
  address: string;
  upiId: string;
  googleMapsUrl: string;
}

/**
 * Optimizes image URLs for mobile screens (e.g. Unsplash dynamic compression)
 */
export function optimizeMenuImage(url?: string): string {
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    if (!url.includes('w=') && !url.includes('width=')) {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}auto=format&fit=crop&w=600&q=80`;
    }
  }
  return url;
}

/**
 * Converts a string name to a clean document ID (e.g. "Green Apple" -> "greenApple")
 */
export function toDocSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Standard parser to convert a Firestore document from the 'menu' collection into a typed MenuItem.
 */
export function parseDocToMenuItem(docId: string, data: any): MenuItem | null {
  if (!data) return null;
  const rawCat = (data.category || '').toString().toLowerCase();
  const category: MenuCategory =
    rawCat === 'coffee' || rawCat === 'coldcoffee'
      ? 'coffee'
      : rawCat === 'softy'
      ? 'softy'
      : 'soda';

  const sortOrder = typeof data.sortOrder === 'number' ? data.sortOrder : 99;
  const itemNum = sortOrder < 10 ? `0${sortOrder}` : `${sortOrder}`;
  const isAvailable = data.available !== false;
  const price = Number(data.price) || 0;
  const name = (data.name || docId).toUpperCase();
  const subtitle = data.description || data.subtitle || '';
  const description = data.description || data.subtitle || '';
  const image = optimizeMenuImage(data.image || '');

  return {
    id: docId,
    itemNumber: itemNum,
    name,
    category,
    subtitle,
    description,
    price,
    image,
    available: isAvailable,
    badge: data.badge,
  };
}

/**
 * Directly fetches menu items and shop settings from the 'menu' and 'settings' collections.
 */
export async function fetchFirestoreMenu(): Promise<{
  items: MenuItem[];
  shopSettings?: FirestoreShopSettings;
} | null> {
  if (!isFirebaseConfigured || !db) return null;
  const firestoreDb = db as Firestore;

  try {
    const menuColRef = collection(firestoreDb, 'menu');
    const snap = await getDocs(menuColRef);

    if (snap.empty) return null;

    const sodas: MenuItem[] = [];
    const coffees: MenuItem[] = [];
    const softies: MenuItem[] = [];

    snap.forEach((docSnap) => {
      const parsed = parseDocToMenuItem(docSnap.id, docSnap.data());
      if (parsed) {
        if (parsed.category === 'soda') sodas.push(parsed);
        else if (parsed.category === 'coffee') coffees.push(parsed);
        else if (parsed.category === 'softy') softies.push(parsed);
      }
    });

    sodas.sort((a, b) => parseInt(a.itemNumber, 10) - parseInt(b.itemNumber, 10));
    softies.sort((a, b) => parseInt(a.itemNumber, 10) - parseInt(b.itemNumber, 10));
    const singleCoffee = coffees.slice(0, 1);

    const allItems = [...sodas, ...singleCoffee, ...softies];

    let shopSettings: FirestoreShopSettings | undefined;
    try {
      const settingsSnap = await getDoc(doc(firestoreDb, 'settings', 'shop'));
      if (settingsSnap.exists()) {
        shopSettings = settingsSnap.data() as FirestoreShopSettings;
      }
    } catch (e) {
      // Ignore settings fetch warning
    }

    return { items: allItems, shopSettings };
  } catch (err) {
    console.warn('Failed to fetch from Firestore menu collection:', err);
    return null;
  }
}

/**
 * Subscribes to real-time menu and shop settings updates from Cloud Firestore.
 * Handles primary /menu collection and /settings/shop with bulletproof error callbacks.
 */
export function subscribeToFirestoreMenu(
  onMenuUpdate: (items: MenuItem[]) => void,
  onSettingsUpdate: (settings: FirestoreShopSettings) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  const firestoreDb = db as Firestore;
  const unsubs: Unsubscribe[] = [];

  // 1. PRIMARY LISTENER: Direct /menu collection
  // Handles all catalog items: sodas, single cold coffee, and soft serve items
  try {
    const directMenuColRef = collection(firestoreDb, 'menu');
    const unsubDirect = onSnapshot(
      directMenuColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const directSodas: MenuItem[] = [];
          const directCoffee: MenuItem[] = [];
          const directSofties: MenuItem[] = [];

          snapshot.forEach((docSnap) => {
            const item = parseDocToMenuItem(docSnap.id, docSnap.data());
            if (item) {
              if (item.category === 'soda') {
                directSodas.push(item);
              } else if (item.category === 'coffee') {
                directCoffee.push(item);
              } else if (item.category === 'softy') {
                directSofties.push(item);
              }
            }
          });

          if (directSodas.length > 0 || directCoffee.length > 0 || directSofties.length > 0) {
            directSodas.sort((a, b) => parseInt(a.itemNumber, 10) - parseInt(b.itemNumber, 10));
            directSofties.sort((a, b) => parseInt(a.itemNumber, 10) - parseInt(b.itemNumber, 10));
            const singleCoffee = directCoffee.slice(0, 1);
            onMenuUpdate([...directSodas, ...singleCoffee, ...directSofties]);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'menu');
        if (onError) onError(err);
      }
    );
    unsubs.push(unsubDirect);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'menu');
    if (onError) onError(err);
  }

  // 2. SETTINGS LISTENER: Listen to /settings/shop
  try {
    const settingsDocRef = doc(firestoreDb, 'settings', 'shop');
    const unsubSettings = onSnapshot(
      settingsDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as FirestoreShopSettings;
          onSettingsUpdate({
            shopName: data.shopName || BRAND_INFO.name,
            tagline: data.tagline || BRAND_INFO.subtitle,
            address: data.address || BRAND_INFO.address,
            upiId: data.upiId || BRAND_INFO.shopUpiId,
            googleMapsUrl: data.googleMapsUrl || BRAND_INFO.mapsUrl,
          });
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'settings/shop');
      }
    );
    unsubs.push(unsubSettings);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'settings/shop');
  }

  return () => {
    unsubs.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        // ignore
      }
    });
  };
}

/**
 * Updates item availability directly in Firestore with dual-write guarantee
 */
export async function updateItemAvailabilityInFirestore(
  item: MenuItem,
  available: boolean
): Promise<boolean> {
  let directSuccess = false;

  // 1. Direct Client Firestore Write
  if (isFirebaseConfigured && db) {
    const firestoreDb = db as Firestore;
    const docIds = new Set<string>();
    if (item.id) docIds.add(item.id);
    docIds.add(getDocId(item.category, item.name));
    docIds.add(toDocSlug(item.name));

    if (item.category === 'coffee' || item.name.toLowerCase().includes('coffee')) {
      docIds.add('coffee_coldCoffee');
      docIds.add('coldCoffee');
    }

    try {
      for (const docId of docIds) {
        await setDoc(doc(firestoreDb, 'menu', docId), { available }, { merge: true });
        if (item.category === 'soda') {
          await setDoc(doc(firestoreDb, 'menu', 'soda', 'items', docId), { available }, { merge: true }).catch(() => {});
        } else if (item.category === 'softy') {
          await setDoc(doc(firestoreDb, 'menu', 'softy', 'items', docId), { available }, { merge: true }).catch(() => {});
        }
      }
      directSuccess = true;
    } catch (err) {
      console.warn('Direct client update availability in Firestore failed, using server sync:', err);
    }
  }

  // 2. Server API Route sync to guarantee Firestore update
  try {
    const res = await fetch('/api/firebase/item/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item, available }),
    });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.warn('Server sync error for item availability:', err);
  }

  return directSuccess;
}

/**
 * Updates item price directly in Firestore with dual-write guarantee
 */
export async function updateItemPriceInFirestore(
  item: MenuItem,
  price: number
): Promise<boolean> {
  let directSuccess = false;

  // 1. Direct Client Firestore Write
  if (isFirebaseConfigured && db) {
    const firestoreDb = db as Firestore;
    const docIds = new Set<string>();
    if (item.id) docIds.add(item.id);
    docIds.add(getDocId(item.category, item.name));
    docIds.add(toDocSlug(item.name));

    if (item.category === 'coffee' || item.name.toLowerCase().includes('coffee')) {
      docIds.add('coffee_coldCoffee');
      docIds.add('coldCoffee');
    }

    try {
      for (const docId of docIds) {
        await setDoc(doc(firestoreDb, 'menu', docId), { price: Number(price) }, { merge: true });
        if (item.category === 'soda') {
          await setDoc(doc(firestoreDb, 'menu', 'soda', 'items', docId), { price: Number(price) }, { merge: true }).catch(() => {});
        } else if (item.category === 'softy') {
          await setDoc(doc(firestoreDb, 'menu', 'softy', 'items', docId), { price: Number(price) }, { merge: true }).catch(() => {});
        }
      }
      directSuccess = true;
    } catch (err) {
      console.warn('Direct client update price in Firestore failed, using server sync:', err);
    }
  }

  // 2. Server API Route sync
  try {
    const res = await fetch('/api/firebase/item/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item, price: Number(price) }),
    });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.warn('Server sync error for item price:', err);
  }

  return directSuccess;
}

/**
 * Updates shop settings (UPI ID, address, shopName, tagline) in Firestore
 */
export async function updateShopSettingsInFirestore(
  settings: Partial<FirestoreShopSettings>
): Promise<boolean> {
  let directSuccess = false;

  // 1. Direct Client Firestore Write
  if (isFirebaseConfigured && db) {
    const firestoreDb = db as Firestore;
    try {
      await setDoc(doc(firestoreDb, 'settings', 'shop'), settings, { merge: true });
      directSuccess = true;
    } catch (err) {
      console.warn('Direct client update settings failed, using server sync:', err);
    }
  }

  // 2. Server API Route sync
  try {
    const res = await fetch('/api/firebase/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.warn('Server sync error for settings:', err);
  }

  return directSuccess;
}

/**
 * Adds an item to the 'menu' collection in Firestore
 */
export async function addItemToFirestoreMenu(item: MenuItem): Promise<boolean> {
  let directSuccess = false;
  const docId = getDocId(item.category, item.name);

  const itemData = {
    name: item.name,
    category: item.category,
    description: item.subtitle || item.description || '',
    price: Number(item.price) || 0,
    image: item.image || '',
    available: item.available !== false,
    sortOrder: parseInt(item.itemNumber, 10) || 99,
    badge: item.badge || null,
  };

  if (isFirebaseConfigured && db) {
    const firestoreDb = db as Firestore;
    try {
      await setDoc(doc(firestoreDb, 'menu', docId), itemData);
      if (item.category === 'soda') {
        await setDoc(doc(firestoreDb, 'menu', 'soda', 'items', docId), itemData).catch(() => {});
      } else if (item.category === 'softy') {
        await setDoc(doc(firestoreDb, 'menu', 'softy', 'items', docId), itemData).catch(() => {});
      }
      directSuccess = true;
    } catch (err) {
      console.warn('Direct client add item failed, using server sync:', err);
    }
  }

  try {
    const res = await fetch('/api/firebase/item/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn('Server sync error for add item:', err);
  }

  return directSuccess;
}

/**
 * Deletes an item from the 'menu' collection in Firestore
 */
export async function deleteItemFromFirestoreMenu(itemOrId: MenuItem | string): Promise<boolean> {
  let directSuccess = false;
  const docIds = new Set<string>();

  if (typeof itemOrId === 'string') {
    docIds.add(itemOrId);
  } else {
    if (itemOrId.id) docIds.add(itemOrId.id);
    const cat = itemOrId.category || 'soda';
    docIds.add(getDocId(cat, itemOrId.name));
    docIds.add(toDocSlug(itemOrId.name));
    if (cat === 'coffee' || itemOrId.name.toLowerCase().includes('coffee')) {
      docIds.add('coffee_coldCoffee');
      docIds.add('coldCoffee');
    }
  }

  if (isFirebaseConfigured && db) {
    const firestoreDb = db as Firestore;
    try {
      for (const id of docIds) {
        await deleteDoc(doc(firestoreDb, 'menu', id)).catch(() => {});
        await deleteDoc(doc(firestoreDb, 'menu', 'soda', 'items', id)).catch(() => {});
        await deleteDoc(doc(firestoreDb, 'menu', 'softy', 'items', id)).catch(() => {});
      }
      directSuccess = true;
    } catch (err) {
      console.warn('Failed to delete item from Firestore menu:', err);
    }
  }

  try {
    const res = await fetch('/api/firebase/item/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: typeof itemOrId === 'string' ? itemOrId : itemOrId.id,
        item: typeof itemOrId === 'object' ? itemOrId : undefined,
      }),
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn('Server sync error for delete item:', err);
  }

  return directSuccess;
}

/**
 * Executes migration/population of all existing menu items and shop settings into the 'menu' Firestore collection.
 * Pure Firebase Web SDK implementation without Node-specific modules (process.cwd / dotenv).
 */
export async function migrateMenuDataToFirestore(providedDb?: any): Promise<{
  success: boolean;
  totalMigrated: number;
  sodaCount: number;
  coffeeCount: number;
  softyCount: number;
  shopSettingsMigrated: boolean;
  migratedIds: string[];
  message: string;
}> {
  const firestoreDb = (providedDb || db) as Firestore;
  if (!firestoreDb) {
    return {
      success: false,
      totalMigrated: 0,
      sodaCount: 0,
      coffeeCount: 0,
      softyCount: 0,
      shopSettingsMigrated: false,
      migratedIds: [],
      message: `Firebase is not connected to ${TARGET_FIREBASE_PROJECT_ID}.`,
    };
  }

  const migratedIds: string[] = [];
  let sodaCount = 0;
  let coffeeCount = 0;
  let softyCount = 0;

  // 1. SODA ITEMS (Fields: name, description, price, image, available, sortOrder)
  const sodas = INITIAL_MENU_ITEMS.filter((item) => item.category === 'soda');
  for (let i = 0; i < sodas.length; i++) {
    const soda = sodas[i];
    const docId = getDocId('soda', soda.name);
    const data = {
      name: soda.name,
      description: soda.subtitle || soda.description || '',
      price: Number(soda.price) || 80,
      image: soda.image || '',
      available: soda.available !== false,
      sortOrder: i + 1,
      category: 'soda',
      ...(soda.badge ? { badge: soda.badge } : {}),
    };

    // Write to direct /menu/{docId}
    await setDoc(doc(firestoreDb, 'menu', docId), data, { merge: true });
    migratedIds.push(`menu/${docId}`);

    // Write to subcollection /menu/soda/items/{docId}
    await setDoc(doc(firestoreDb, 'menu', 'soda', 'items', docId), data, { merge: true });
    migratedIds.push(`menu/soda/items/${docId}`);

    sodaCount++;
  }

  // 2. COLD COFFEE (Strictly ONE document with: name, description, price, image, available)
  const coffeeItem = INITIAL_MENU_ITEMS.find((item) => item.category === 'coffee') || {
    name: 'COLD COFFEE',
    category: 'coffee' as const,
    subtitle: 'Ek hi hai. Par mast hai. ☕',
    description: 'Smooth • Creamy • Chilled. Blended with rich milk and sweet roast espresso.',
    price: 100,
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=1000&auto=format&fit=crop',
    available: true,
  };

  const coffeeData = {
    name: 'COLD COFFEE',
    description: coffeeItem.subtitle || coffeeItem.description || 'Ek hi hai. Par mast hai. ☕ Smooth • Creamy • Chilled.',
    price: Number(coffeeItem.price) || 100,
    image: coffeeItem.image || '',
    available: coffeeItem.available !== false,
    category: 'coffee',
  };

  // Direct /menu/coffee_coldCoffee
  await setDoc(doc(firestoreDb, 'menu', 'coffee_coldCoffee'), coffeeData, { merge: true });
  migratedIds.push('menu/coffee_coldCoffee');

  // Single document /menu/coldCoffee
  await setDoc(doc(firestoreDb, 'menu', 'coldCoffee'), coffeeData, { merge: true });
  migratedIds.push('menu/coldCoffee');
  coffeeCount = 1;

  // 3. SOFTIES (Fields: name, price, image, available, sortOrder)
  const softies = INITIAL_MENU_ITEMS.filter((item) => item.category === 'softy');
  for (let i = 0; i < softies.length; i++) {
    const softy = softies[i];
    const docId = getDocId('softy', softy.name);
    const softyData = {
      name: softy.name,
      price: Number(softy.price) || 60,
      image: softy.image || '',
      available: softy.available !== false,
      sortOrder: i + 1,
      category: 'softy',
    };

    // Direct /menu/{docId}
    await setDoc(doc(firestoreDb, 'menu', docId), softyData, { merge: true });
    migratedIds.push(`menu/${docId}`);

    // Subcollection /menu/softy/items/{docId}
    await setDoc(doc(firestoreDb, 'menu', 'softy', 'items', docId), softyData, { merge: true });
    migratedIds.push(`menu/softy/items/${docId}`);

    softyCount++;
  }

  // 4. SHOP SETTINGS (settings/shop with: shopName, tagline, address, googleMapsUrl, upiId)
  const settingsDocRef = doc(firestoreDb, 'settings', 'shop');
  await setDoc(settingsDocRef, {
    shopName: 'NEW UNIQUE COLD DRINKS',
    tagline: BRAND_INFO.subtitle || 'Soda • Cold Coffee • Softy',
    address: BRAND_INFO.address,
    googleMapsUrl: BRAND_INFO.mapsUrl,
    upiId: BRAND_INFO.shopUpiId,
  }, { merge: true });
  migratedIds.push('settings/shop');

  const totalMigrated = sodaCount + coffeeCount + softyCount;
  return {
    success: true,
    totalMigrated,
    sodaCount,
    coffeeCount,
    softyCount,
    shopSettingsMigrated: true,
    migratedIds,
    message: `Successfully migrated ${totalMigrated} menu items and shop settings into the 'menu' collection of ${TARGET_FIREBASE_PROJECT_ID}.`,
  };
}

/**
 * Seeds or initializes the Firestore database with the New Unique Cold Drinks menu
 * following the requested clean structure:
 * /menu/{slug} with { name, category, description, price, image, available, sortOrder }
 * /settings/shop with { shopName, tagline, address, upiId, googleMapsUrl }
 */
export async function seedFirestoreMenu(): Promise<{ success: boolean; message: string }> {
  if (!isFirebaseConfigured || !db) {
    return {
      success: false,
      message: `Firebase is not connected to ${TARGET_FIREBASE_PROJECT_ID}. Please enter your Firebase Web API Key in Bar Manager settings or .env.`,
    };
  }

  const firestoreDb = db as Firestore;

  try {
    const result = await migrateMenuDataToFirestore(firestoreDb);
    return {
      success: result.success,
      message: result.message,
    };
  } catch (err: any) {
    console.error('Error seeding Firestore:', err);
    return {
      success: false,
      message: err.message || 'Failed to seed Firestore menu database.',
    };
  }
}
