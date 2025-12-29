# Konverteringsguide: Firestore → Supabase

## Grundläggande koncept

### Firestore vs Supabase

| Firestore | Supabase |
|-----------|----------|
| NoSQL document database | PostgreSQL (relational) |
| Collections | Tables |
| Documents | Rows |
| Subcollections | Foreign keys / Relations |
| Real-time with onSnapshot | Real-time with subscriptions |
| Security rules | Row Level Security (RLS) |

## Vanliga operationer

### 1. Hämta alla dokument från en collection

**Firestore:**
```javascript
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const q = query(
  collection(db, 'orders'),
  where('organizationId', '==', orgId)
);
const snapshot = await getDocs(q);
const orders = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

**Supabase:**
```javascript
import { supabase } from '../supabase';

const { data: orders, error } = await supabase
  .from('orders')
  .select('*')
  .eq('organization_id', orgId);
```

**Eller med helper:**
```javascript
import { getOrganizationRecords } from '../utils/supabaseHelpers';

const orders = await getOrganizationRecords('orders');
```

### 2. Hämta ett enskilt dokument

**Firestore:**
```javascript
import { doc, getDoc } from 'firebase/firestore';

const docRef = doc(db, 'orders', orderId);
const docSnap = await getDoc(docRef);
const order = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
```

**Supabase:**
```javascript
const { data: order, error } = await supabase
  .from('orders')
  .select('*')
  .eq('id', orderId)
  .single();
```

**Eller med helper:**
```javascript
import { getRecordById } from '../utils/supabaseHelpers';

const order = await getRecordById('orders', orderId);
```

### 3. Skapa ett nytt dokument

**Firestore:**
```javascript
import { addDoc, collection } from 'firebase/firestore';

const docRef = await addDoc(collection(db, 'orders'), {
  title: 'New Order',
  customerId: 'abc123',
  organizationId: orgId,
  createdAt: new Date()
});
console.log('Created with ID:', docRef.id);
```

**Supabase:**
```javascript
const { data, error } = await supabase
  .from('orders')
  .insert([{
    title: 'New Order',
    customer_id: 'abc123',
    organization_id: orgId,
    created_at: new Date().toISOString()
  }])
  .select()
  .single();
```

**Eller med helper:**
```javascript
import { createOrganizationRecord } from '../utils/supabaseHelpers';

const order = await createOrganizationRecord('orders', {
  title: 'New Order',
  customer_id: 'abc123'
});
```

### 4. Uppdatera ett dokument

**Firestore:**
```javascript
import { doc, updateDoc } from 'firebase/firestore';

await updateDoc(doc(db, 'orders', orderId), {
  status: 'Pågående',
  updatedAt: new Date()
});
```

**Supabase:**
```javascript
const { data, error } = await supabase
  .from('orders')
  .update({
    status: 'Pågående',
    updated_at: new Date().toISOString()
  })
  .eq('id', orderId);
```

**Eller med helper:**
```javascript
import { updateRecord } from '../utils/supabaseHelpers';

await updateRecord('orders', orderId, {
  status: 'Pågående'
});
```

### 5. Radera ett dokument

**Firestore:**
```javascript
import { doc, deleteDoc } from 'firebase/firestore';

await deleteDoc(doc(db, 'orders', orderId));
```

**Supabase:**
```javascript
const { error } = await supabase
  .from('orders')
  .delete()
  .eq('id', orderId);
```

**Eller med helper:**
```javascript
import { deleteRecord } from '../utils/supabaseHelpers';

await deleteRecord('orders', orderId);
```

### 6. Real-time listeners

**Firestore:**
```javascript
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const q = query(
  collection(db, 'orders'),
  where('organizationId', '==', orgId)
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  const orders = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  setOrders(orders);
});

// Cleanup
return () => unsubscribe();
```

**Supabase:**
```javascript
const subscription = supabase
  .channel('orders_changes')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE, eller *
      schema: 'public',
      table: 'orders',
      filter: `organization_id=eq.${orgId}`
    },
    (payload) => {
      console.log('Change received!', payload);
      // Refresh data
      fetchOrders();
    }
  )
  .subscribe();

// Cleanup
return () => {
  subscription.unsubscribe();
};
```

### 7. Querying med flera villkor

**Firestore:**
```javascript
const q = query(
  collection(db, 'orders'),
  where('organizationId', '==', orgId),
  where('status', '==', 'Pågående'),
  where('priority', '==', 'Hög')
);
```

**Supabase:**
```javascript
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('organization_id', orgId)
  .eq('status', 'Pågående')
  .eq('priority', 'Hög');
```

**Eller med helper:**
```javascript
import { queryWithFilters } from '../utils/supabaseHelpers';

const orders = await queryWithFilters('orders', [
  { field: 'status', operator: '==', value: 'Pågående' },
  { field: 'priority', operator: '==', value: 'Hög' }
]);
```

### 8. Joins (nya möjligheter med Supabase!)

**Firestore:** Måste göra separata queries och joinera manuellt i kod

**Supabase:** Inbyggt stöd för joins via foreign keys
```javascript
// Hämta orders med customer-data i en query
const { data: orders, error } = await supabase
  .from('orders')
  .select(`
    *,
    customer:customers(*)
  `)
  .eq('organization_id', orgId);

// orders innehåller nu:
// [
//   {
//     id: '...',
//     title: '...',
//     customer: {
//       id: '...',
//       name: 'Kund AB',
//       ...
//     }
//   }
// ]
```

## Fältnamn-konvertering

### Firestore (camelCase) → Supabase (snake_case)

| Firestore | Supabase |
|-----------|----------|
| `organizationId` | `organization_id` |
| `customerId` | `customer_id` |
| `orderNumber` | `order_number` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| `workType` | `work_type` |
| `billingType` | `billing_type` |

**Tips:** Använd helper-funktionerna `toSnakeCase()` och `toCamelCase()` för automatisk konvertering.

## Collection/Table mapping

| Firestore Collection | Supabase Table |
|---------------------|----------------|
| `organizations` | `organizations` |
| `users` | `schedulable_users` |
| `customers` | `customers` |
| `orders` | `orders` |
| `tidsrapporteringar` | `time_reports` |
| `scheduledJobs` | `scheduled_jobs` |
| `articles` | `articles` |
| `settings` | `settings` |

## Steg-för-steg konvertering av en fil

1. **Byt imports:**
   ```javascript
   // TA BORT:
   import { db } from '../firebase/config';
   import { collection, getDocs, ... } from 'firebase/firestore';

   // LÄGG TILL:
   import { supabase } from '../supabase';
   import { getOrganizationRecords, ... } from '../utils/supabaseHelpers';
   ```

2. **Konvertera fältnamn:** camelCase → snake_case

3. **Konvertera queries:** Använd Supabase-syntax eller helper-funktioner

4. **Uppdatera error handling:** Supabase returnerar `{ data, error }`

5. **Testa:** Kontrollera att allt fungerar

## Exempel: Komplett filkonvertering

Se `Dashboard.jsx` som exempel - den har konverterats från Firestore till Supabase.

## Vanliga fallgropar

1. **Glöm inte `.eq('organization_id', orgId)`** - alla queries måste filtrera på organization!

2. **`.single()` vs array:** `.single()` returnerar ett objekt, utan `.single()` får du en array

3. **Error handling:** Supabase kastar inte errors automatiskt, kolla `if (error)` efter varje query

4. **created_at/updated_at:** Supabase har triggers för `updated_at`, men `created_at` måste sättas manuellt

5. **UUID vs auto-increment:** Supabase använder UUID som default, Firestore genererade random IDs

## Testning

Efter varje konvertering, testa:
- [ ] Läsa data
- [ ] Skapa ny data
- [ ] Uppdatera data
- [ ] Radera data
- [ ] Real-time updates (om används)
- [ ] Filtrering och sökning

## Filer som behöver konverteras

- [ ] Dashboard.jsx
- [ ] NewOrder.jsx
- [ ] OrderDetails.jsx
- [ ] CustomerList.jsx
- [ ] CustomerDetails.jsx
- [ ] NewCustomer.jsx
- [ ] RapporteraTid.jsx
- [ ] ReportsPage.jsx
- [ ] Schema.jsx
- [ ] SettingsPage.jsx
- [ ] UserSettings.jsx
- [ ] OrganizationSettings.jsx
- [ ] TimeCodeSettings.jsx
- [ ] ArticlePicker.jsx
- [ ] ImportCustomers.jsx
- [ ] MigrationPage.jsx
