import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBJIOFrcL2qE_FY7O5_5rIPmiaRXLWkL-U",
  authDomain: "unique-soda.firebaseapp.com",
  projectId: "unique-soda",
  storageBucket: "unique-soda.firebasestorage.app",
  messagingSenderId: "226831322614",
  appId: "1:226831322614:web:7e5fce1021c5abd9500bd7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Data provided by the user
const SODA_ITEMS = [
  {
    docId: 'soda_greenApple',
    name: 'GREEN APPLE',
    description: 'Crisp • Chilled • Fizzy. Refreshing tart green apple with micro-carbonated soda over crushed ice.',
    price: 80,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop',
    available: true,
    sortOrder: 1,
    badge: 'POPULAR',
  },
  {
    docId: 'soda_blueberry',
    name: 'BLUEBERRY',
    description: 'Sweet berry • Chilled soda. Sweet mountain blueberries infused with high-fizz triple-filtered chilled soda.',
    price: 80,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1000&auto=format&fit=crop',
    available: true,
    sortOrder: 2,
    badge: 'SIGNATURE',
  },
  {
    docId: 'soda_freshLemon',
    name: 'FRESH LEMON',
    description: 'Fresh citrus • Rock salt • Fizz. Freshly squeezed lemon with rock salt, chilled bubbly soda, and cooling mint.',
    price: 70,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop',
    available: true,
    sortOrder: 3,
    badge: 'CHILLED',
  },
  {
    docId: 'soda_jeeraMasala',
    name: 'JEERA MASALA',
    description: 'Roasted jeera • Black salt • Tangy. Apna classic roasted cumin, black salt, and tangy spices in frosted soda.',
    price: 70,
    image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=1000&auto=format&fit=crop',
    available: true,
    sortOrder: 4,
    badge: 'SIGNATURE',
  },
  {
    docId: 'soda_kalaKhatta',
    name: 'KALA KHATTA',
    description: 'Tangy jamun • Indian spices • Ice cold. Tangy blackberry jamun reduction, rock salt, and tingling carbonated fizz.',
    price: 80,
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?q=80&w=1000&auto=format&fit=crop',
    available: true,
    sortOrder: 5,
    badge: 'POPULAR',
  },
  {
    docId: 'soda_strawberry',
    name: 'STRAWBERRY',
    description: 'Sweet strawberry • Chilled fizz. Sweet Mahabaleshwar strawberry syrup blended with fizzy chilled soda.',
    price: 80,
    image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?q=80&w=1000&auto=format&fit=crop',
    available: true,
    sortOrder: 6,
    badge: 'POPULAR',
  },
  {
    docId: 'soda_blackCurrant',
    name: 'BLACK CURRANT',
    description: 'Dark berries • Micro-bubbles. Juicy dark black currant nectar with tingling purple micro-bubbles.',
    price: 80,
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?q=80&w=1000&auto=format&fit=crop',
    available: true,
    sortOrder: 7,
    badge: 'NEW',
  },
  {
    docId: 'soda_orangeMint',
    name: 'ORANGE MINT',
    description: 'Juicy orange • Crushed mint. Sunny orange with fresh garden mint leaves and sharp chilled effervescence.',
    price: 80,
    image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?q=80&w=1000&auto=format&fit=crop',
    available: true,
    sortOrder: 8,
  },
];

const COLD_COFFEE_ITEM = {
  docId: 'coffee_coldCoffee',
  name: 'COLD COFFEE',
  description: 'Ek hi hai. Par mast hai. ☕ Smooth • Creamy • Chilled. Blended with rich milk and sweet roast espresso.',
  price: 100,
  image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=1000&auto=format&fit=crop',
  available: true,
};

const SOFTY_ITEMS = [
  {
    docId: 'softy_vanilla',
    name: 'VANILLA',
    price: 60,
    image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?q=80&w=1000&auto=format&fit=crop',
    available: true,
    sortOrder: 1,
  },
  {
    docId: 'softy_chocolate',
    name: 'CHOCOLATE',
    price: 70,
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=1000&auto=format&fit=crop',
    available: true,
    sortOrder: 2,
  },
  {
    docId: 'softy_twistChocoVanilla',
    name: 'TWIST (CHOCO-VANILLA)',
    price: 80,
    image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?q=80&w=1000&auto=format&fit=crop',
    available: true,
    sortOrder: 3,
  },
  {
    docId: 'softy_belgianDip',
    name: 'BELGIAN DIP',
    price: 90,
    image: 'https://images.unsplash.com/photo-1549395156-e0c1fe6fc7a5?q=80&w=1000&auto=format&fit=crop',
    available: true,
    sortOrder: 4,
  },
  {
    docId: 'softy_strawberry',
    name: 'STRAWBERRY',
    price: 70,
    image: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?q=80&w=1000&auto=format&fit=crop',
    available: true,
    sortOrder: 5,
  },
];

const SHOP_SETTINGS = {
  shopName: 'NEW UNIQUE COLD DRINKS',
  tagline: 'Soda • Cold Coffee • Softy',
  address: 'Shop No. 4, College Corner, Opp. City High School, Sangli, Maharashtra 416416',
  googleMapsUrl: 'https://maps.google.com/?q=New+Unique+Cold+Drinks+Sangli',
  upiId: 'unique.drinks@okhdfcbank',
};

async function main() {
  console.log('--- STARTING FIRESTORE UPDATE FOR unique-soda ---');
  const updatedDocs: string[] = [];

  // 1. SODA (in /menu/{id} and /menu/soda/items/{id})
  for (const item of SODA_ITEMS) {
    const sodaData = {
      name: item.name,
      category: 'soda',
      description: item.description,
      price: item.price,
      image: item.image,
      available: item.available,
      sortOrder: item.sortOrder,
      ...(item.badge ? { badge: item.badge } : {}),
    };

    // Direct /menu/{docId}
    await setDoc(doc(db, 'menu', item.docId), sodaData, { merge: true });
    updatedDocs.push(`menu/${item.docId}`);

    // Subcollection /menu/soda/items/{docId}
    await setDoc(doc(db, 'menu', 'soda', 'items', item.docId), sodaData, { merge: true });
    updatedDocs.push(`menu/soda/items/${item.docId}`);
    console.log(`Updated SODA: ${item.name} (ID: ${item.docId})`);
  }

  // 2. COLD COFFEE (Strictly ONE item)
  const coffeeData = {
    name: COLD_COFFEE_ITEM.name,
    category: 'coffee',
    description: COLD_COFFEE_ITEM.description,
    price: COLD_COFFEE_ITEM.price,
    image: COLD_COFFEE_ITEM.image,
    available: COLD_COFFEE_ITEM.available,
  };

  // Direct /menu/coffee_coldCoffee
  await setDoc(doc(db, 'menu', COLD_COFFEE_ITEM.docId), coffeeData, { merge: true });
  updatedDocs.push(`menu/${COLD_COFFEE_ITEM.docId}`);

  // Document /menu/coldCoffee
  await setDoc(doc(db, 'menu', 'coldCoffee'), coffeeData, { merge: true });
  updatedDocs.push(`menu/coldCoffee`);
  console.log(`Updated COLD COFFEE: ${COLD_COFFEE_ITEM.name}`);

  // 3. SOFTY (Multiple items)
  for (const item of SOFTY_ITEMS) {
    const softyData = {
      name: item.name,
      category: 'softy',
      price: item.price,
      image: item.image,
      available: item.available,
      sortOrder: item.sortOrder,
    };

    // Direct /menu/{docId}
    await setDoc(doc(db, 'menu', item.docId), softyData, { merge: true });
    updatedDocs.push(`menu/${item.docId}`);

    // Subcollection /menu/softy/items/{docId}
    await setDoc(doc(db, 'menu', 'softy', 'items', item.docId), softyData, { merge: true });
    updatedDocs.push(`menu/softy/items/${item.docId}`);
    console.log(`Updated SOFTY: ${item.name} (ID: ${item.docId})`);
  }

  // 4. SETTINGS/SHOP (settings/shop)
  await setDoc(doc(db, 'settings', 'shop'), SHOP_SETTINGS, { merge: true });
  updatedDocs.push('settings/shop');
  console.log('Updated SETTINGS: settings/shop');

  // VERIFY READ
  console.log('\n--- VERIFYING FIRESTORE READ CAPABILITY ---');
  const snap = await getDocs(collection(db, 'menu'));
  console.log(`Successfully read ${snap.size} documents from 'menu' collection.`);
  
  const settingsSnap = await getDoc(doc(db, 'settings', 'shop'));
  if (settingsSnap.exists()) {
    console.log('Successfully read settings/shop:', settingsSnap.data()?.shopName);
  } else {
    console.warn('settings/shop not found!');
  }

  console.log('\nTOTAL DOCUMENTS UPDATED/CREATED:', updatedDocs.length);
  console.log(JSON.stringify(updatedDocs, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed with error:', err);
  process.exit(1);
});
