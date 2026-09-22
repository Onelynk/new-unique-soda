import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import { INITIAL_MENU_ITEMS } from '../data/menuData';
import { BRAND_INFO } from '../data/brandData';
import dotenv from 'dotenv';

// Load environment variables for CLI execution
dotenv.config();

export const TARGET_FIREBASE_PROJECT_ID = 'unique-soda';

export interface MigrationSummary {
  success: boolean;
  totalMigrated: number;
  sodaCount: number;
  coffeeCount: number;
  softyCount: number;
  shopSettingsMigrated: boolean;
  migratedIds: string[];
  message: string;
}

/**
 * Converts a category and name into a clean, human-readable document ID.
 * Examples:
 * - Green Apple (soda) -> "soda_greenApple"
 * - Cold Coffee (coffee) -> "coffee_coldCoffee"
 * - Vanilla (softy) -> "softy_vanilla"
 */
export function getDocId(category: string, name: string): string {
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
  return `${category.toLowerCase()}_${cleanName}`;
}

/**
 * Executes migration of all existing menu items and shop settings into the 'menu' Firestore collection.
 * Can be run from the CLI (via npm run migrate:menu) or called in-browser from Bar Manager.
 */
export async function migrateMenuDataToFirestore(providedDb?: any): Promise<MigrationSummary> {
  let firestoreDb = providedDb;

  if (!firestoreDb) {
    const apiKey =
      process.env.VITE_FIREBASE_API_KEY ||
      process.env.FIREBASE_API_KEY ||
      '';

    const projectId =
      process.env.VITE_FIREBASE_PROJECT_ID ||
      TARGET_FIREBASE_PROJECT_ID;

    const firebaseConfig = {
      apiKey,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: `${projectId}.firebasestorage.app`,
    };

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    firestoreDb = getFirestore(app);
  }

  const migratedIds: string[] = [];
  let sodaCount = 0;
  let coffeeCount = 0;
  let softyCount = 0;

  console.log(`[Migration] Starting menu migration to project: ${TARGET_FIREBASE_PROJECT_ID}`);
  console.log(`[Migration] Target collection: 'menu'`);

  // Use a batch write for atomic consistency
  const batch = writeBatch(firestoreDb);

  // 1. SODA ITEMS (multiple flavours)
  // Fields: name, description, price, image, available, sortOrder
  const sodas = INITIAL_MENU_ITEMS.filter((item) => item.category === 'soda');
  for (let i = 0; i < sodas.length; i++) {
    const soda = sodas[i];
    const docId = getDocId('soda', soda.name);
    const docRef = doc(firestoreDb, 'menu', docId);

    const data = {
      name: soda.name,
      category: 'soda',
      description: soda.subtitle || soda.description || '',
      price: Number(soda.price) || 80,
      image: soda.image || '',
      available: soda.available !== false,
      sortOrder: i + 1,
    };

    batch.set(docRef, data);
    migratedIds.push(`menu/${docId}`);
    sodaCount++;
  }

  // 2. COLD COFFEE (ONLY ONE item)
  // Fields: name, description, price, image, available
  const coffeeItem = INITIAL_MENU_ITEMS.find((item) => item.category === 'coffee') || {
    name: 'COLD COFFEE',
    category: 'coffee' as const,
    subtitle: 'Ek hi hai. Par mast hai. ☕',
    description: 'Smooth • Creamy • Chilled. Blended with rich milk and sweet roast espresso.',
    price: 100,
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=1000&auto=format&fit=crop',
    available: true,
  };

  const coffeeDocId = 'coffee_coldCoffee';
  const coffeeDocRef = doc(firestoreDb, 'menu', coffeeDocId);
  batch.set(coffeeDocRef, {
    name: 'COLD COFFEE',
    category: 'coffee',
    description: coffeeItem.subtitle || coffeeItem.description || 'Ek hi hai. Par mast hai. ☕',
    price: Number(coffeeItem.price) || 100,
    image: coffeeItem.image || '',
    available: coffeeItem.available !== false,
  });
  migratedIds.push(`menu/${coffeeDocId}`);
  coffeeCount = 1;

  // 3. SOFTY ITEMS (multiple flavours)
  // Fields: name, price, image, available, sortOrder
  const softies = INITIAL_MENU_ITEMS.filter((item) => item.category === 'softy');
  for (let i = 0; i < softies.length; i++) {
    const softy = softies[i];
    const docId = getDocId('softy', softy.name);
    const docRef = doc(firestoreDb, 'menu', docId);

    const data = {
      name: softy.name,
      category: 'softy',
      price: Number(softy.price) || 60,
      image: softy.image || '',
      available: softy.available !== false,
      sortOrder: i + 1,
    };

    batch.set(docRef, data);
    migratedIds.push(`menu/${docId}`);
    softyCount++;
  }

  // 4. SHOP SETTINGS (settings/shop)
  // Fields: shopName, tagline, address, googleMapsUrl, upiId
  const settingsDocRef = doc(firestoreDb, 'settings', 'shop');
  batch.set(settingsDocRef, {
    shopName: 'NEW UNIQUE COLD DRINKS',
    tagline: BRAND_INFO.subtitle || 'Soda • Cold Coffee • Softy',
    address: BRAND_INFO.address,
    googleMapsUrl: BRAND_INFO.mapsUrl,
    upiId: BRAND_INFO.shopUpiId,
  });

  // Commit all writes to Firestore
  await batch.commit();

  const totalMigrated = sodaCount + coffeeCount + softyCount;
  const message = `Successfully migrated ${totalMigrated} menu items (${sodaCount} sodas, ${coffeeCount} cold coffee, ${softyCount} softies) and shop settings into the 'menu' collection of ${TARGET_FIREBASE_PROJECT_ID}.`;

  console.log(`[Migration] SUCCESS: ${message}`);

  return {
    success: true,
    totalMigrated,
    sodaCount,
    coffeeCount,
    softyCount,
    shopSettingsMigrated: true,
    migratedIds,
    message,
  };
}

// Allow direct execution via CLI: tsx src/scripts/migrateMenuToFirestore.ts
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('migrateMenuToFirestore')) {
  migrateMenuDataToFirestore()
    .then((res) => {
      console.log('\n--- MIGRATION REPORT ---');
      console.log(res.message);
      console.log('Migrated Document IDs:', res.migratedIds);
      process.exit(0);
    })
    .catch((err: any) => {
      console.error('\n--- MIGRATION FAILED ---');
      if (err?.code === 'permission-denied') {
        console.error('\n[DIAGNOSTIC: PERMISSION_DENIED]');
        console.error(`Firebase project '${TARGET_FIREBASE_PROJECT_ID}' successfully connected, but Firestore Security Rules on the server rejected the write.`);
        console.error('\nMissing Permission:');
        console.error("Firestore Security Rules on project 'unique-soda' do not allow client writes to /menu and /settings/shop without authentication.");
        console.error('\nTo permit initial database seeding:');
        console.error('1. Open Firebase Console -> Firestore Database -> Rules tab for project unique-soda:');
        console.error('   https://console.firebase.google.com/project/unique-soda/firestore/rules');
        console.error('2. Temporarily permit write access for initial seeding:');
        console.error('   match /menu/{document=**} { allow read, write: if true; }');
        console.error('   match /settings/{doc=**} { allow read, write: if true; }');
        console.error('3. Re-run: npm run migrate:menu');
        console.error('4. Publish the production rules from firestore.rules:');
        console.error('   match /menu/{document=**} { allow read: if true; allow write: if request.auth != null; }');
        console.error('   match /settings/{settingId} { allow read: if true; allow write: if request.auth != null; }\n');
      } else {
        console.error(err);
      }
      process.exit(1);
    });
}
