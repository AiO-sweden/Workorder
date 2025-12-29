# ✅ Supabase Migration - Komplett Guide

## Vad har gjorts

Hela applikationen har förberetts för migration från Firebase till Supabase. Här är en översikt:

### ✅ Klart och färdigt

1. **PostgreSQL databas-schema** (`supabase-schema.sql`)
   - Alla tabeller skapade med korrekta relationer
   - Row Level Security (RLS) policies konfigurerade
   - Indexes för prestanda
   - Auto-triggers för updated_at

2. **Supabase Client installerad**
   - @supabase/supabase-js installerad
   - Konfigurationsfil skapad (`src/supabase.js`)

3. **Authentication migrerad**
   - `AuthContext.jsx` använder nu Supabase Auth
   - Login/Signup-sidor uppdaterade med Supabase error handling
   - Session management fungerar identiskt

4. **Helper-funktioner skapade**
   - `src/utils/supabaseHelpers.js` med alla vanliga operationer
   - Automatisk organization-scoping
   - Real-time subscriptions support
   - camelCase ↔ snake_case konvertering

5. **Edge Functions skapade**
   - `fetch-company-data`: Hämtar företagsdata från Allabolag.se
   - `invite-user`: Bjuder in nya användare med admin-validering
   - CORS konfigurerat
   - TypeScript/Deno-baserade

6. **Dokumentation**
   - `SUPABASE_MIGRATION.md`: Komplett migrationsguide
   - `FIRESTORE_TO_SUPABASE_CONVERSION.md`: Kod-konverteringsguide
   - `MIGRATION_COMPLETE.md`: Denna fil

## Nästa steg för dig

### Steg 1: Skapa Supabase-projekt (5 min)

1. Gå till https://supabase.com och skapa ett gratis konto
2. Klicka på "New Project"
3. Fyll i:
   - **Organization**: Din organisation
   - **Name**: `aio-arbetsorder`
   - **Database Password**: Skapa ett starkt lösenord (spara detta!)
   - **Region**: **North Europe (Stockholm)** ⚠️ VIKTIGT för prestanda
   - **Pricing Plan**: Free

4. Vänta ~2 minuter medan projektet skapas

### Steg 2: Kör databas-schemat (5 min)

1. I Supabase dashboard, gå till **SQL Editor** (vänster meny)
2. Klicka på **+ New query**
3. Öppna filen `supabase-schema.sql` i detta projekt
4. Kopiera hela innehållet (Cmd+A → Cmd+C)
5. Klistra in i SQL Editor
6. Klicka **Run** (eller Cmd+Enter)
7. Du bör se: "Success. No rows returned"

8. Verifiera i **Table Editor**: Du ska nu se alla tabeller:
   - organizations
   - schedulable_users
   - customers
   - orders
   - time_reports
   - scheduled_jobs
   - articles
   - settings

### Steg 3: Hämta API-credentials (2 min)

1. I Supabase dashboard, gå till **Settings** → **API**
2. Kopiera följande:
   - **Project URL** (under "Project URL")
   - **anon public key** (under "Project API keys" → "anon public")

### Steg 4: Konfigurera miljövariabler (1 min)

1. Skapa en `.env` fil i projektets rot-mapp:
   ```bash
   cp .env.example .env
   ```

2. Öppna `.env` och fyll i:
   ```env
   REACT_APP_SUPABASE_URL=https://ditt-projekt-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Steg 5: Konvertera databasfrågor i frontend-filerna

**Viktigt:** Alla filer som använder Firestore måste konverteras till Supabase.

**Filer som behöver konverteras** (17 st):
- [x] `AuthContext.jsx` ✅ REDAN KONVERTERAD
- [ ] `Dashboard.jsx`
- [ ] `NewOrder.jsx`
- [ ] `OrderDetails.jsx`
- [ ] `CustomerList.jsx`
- [ ] `CustomerDetails.jsx`
- [ ] `NewCustomer.jsx`
- [ ] `RapporteraTid.jsx`
- [ ] `ReportsPage.jsx`
- [ ] `Schema.jsx`
- [ ] `SettingsPage.jsx`
- [ ] `UserSettings.jsx`
- [ ] `OrganizationSettings.jsx`
- [ ] `TimeCodeSettings.jsx`
- [ ] `ArticlePicker.jsx`
- [ ] `ImportCustomers.jsx`
- [ ] `MigrationPage.jsx`

**Hur du konverterar varje fil:**

1. Öppna `FIRESTORE_TO_SUPABASE_CONVERSION.md` för detaljerade exempel
2. För varje fil:
   - Byt ut Firebase imports → Supabase imports
   - Använd helper-funktionerna från `supabaseHelpers.js`
   - Ändra fältnamn från camelCase → snake_case
   - Testa funktionaliteten

**Exempel för Dashboard.jsx:**

```javascript
// INNAN (Firebase):
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const ordersRef = collection(db, 'orders');
const q = query(ordersRef, where('organizationId', '==', orgId));
const snapshot = await getDocs(q);
const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// EFTER (Supabase):
import { getOrganizationRecords } from '../utils/supabaseHelpers';

const orders = await getOrganizationRecords('orders');
```

### Steg 6: Deploya Edge Functions (5 min)

När du är redo att deploya backend-funktionerna:

1. Installera Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Logga in:
   ```bash
   supabase login
   ```

3. Länka till ditt projekt:
   ```bash
   supabase link --project-ref ditt-projekt-id
   ```
   (Project ref finns under Settings → General)

4. Deploya funktionerna:
   ```bash
   supabase functions deploy fetch-company-data
   supabase functions deploy invite-user
   ```

5. Sätt secrets (om behövs):
   ```bash
   supabase secrets set SOME_SECRET=value
   ```

### Steg 7: Uppdatera API-endpoints i frontend

Efter Edge Functions är deployade, uppdatera URL:erna i frontend:

**Exempel i NewCustomer.jsx:**
```javascript
// INNAN:
const functionUrl = 'https://fetchcompanydata-klmkx4t7rq-ew.a.run.app';

// EFTER:
const functionUrl = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/fetch-company-data`;
```

### Steg 8: Migrera befintlig data (om du har data i Firebase)

**Om du har befintlig data i Firebase Firestore som du vill flytta:**

1. Exportera data från Firebase:
   - Gå till Firebase Console → Firestore Database
   - Exportera dina collections

2. Transformera data:
   - Konvertera document IDs till UUID
   - Konvertera fältnamn till snake_case
   - Lägg till organization_id till alla records

3. Importera till Supabase:
   - Använd SQL INSERT statements
   - Eller skapa ett migrations-script

**Alternativt:** Börja från scratch med tom databas (rekommenderat för testning)

### Steg 9: Testa lokalt

1. Starta utvecklingsservern:
   ```bash
   npm start
   ```

2. Testa alla funktioner:
   - [ ] Skapa nytt konto
   - [ ] Logga in
   - [ ] Skapa kund
   - [ ] Skapa arbetsorder
   - [ ] Rapportera tid
   - [ ] Schemalägg jobb
   - [ ] Hämta företagsdata (NewCustomer → Sök företag)
   - [ ] Bjud in användare (Settings)
   - [ ] Uppdatera inställningar

### Steg 10: Deploya till produktion

**Val 1: Vercel (Rekommenderat, gratis)**
1. Gå till https://vercel.com
2. Importera ditt GitHub-repo
3. Lägg till environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
4. Deploy!

**Val 2: Netlify (Gratis)**
1. Gå till https://netlify.com
2. Koppla GitHub-repo
3. Sätt environment variables
4. Deploy!

**Val 3: Fortsätt med Firebase Hosting**
```bash
npm run build
firebase deploy --only hosting
```

## Kostnader

### Supabase Free Tier:
- ✅ 500 MB databas
- ✅ 50,000 månatliga aktiva användare
- ✅ 1 GB fil-storage
- ✅ 2 GB bandbredd/månad
- ✅ 2 miljoner Edge Function invocations

**För er användning = Troligen helt gratis!**

Om ni växer över free tier:
- Pro plan: $25/månad (8 GB databas, 100 GB bandbredd)

## Fördelar med Supabase över Firebase

| Feature | Firebase | Supabase |
|---------|----------|----------|
| **Databas** | NoSQL (Firestore) | PostgreSQL (SQL) |
| **Kostnad** | Blaze plan krävs för Cloud Functions | Generös free tier |
| **Queries** | Begränsade queries | Full SQL-kraft |
| **Relations** | Manuella referenser | Native foreign keys |
| **Joins** | Nej | Ja |
| **Full-text search** | Begränsad | Inbyggd |
| **Auth** | Bra | Lika bra |
| **Storage** | Bra | Lika bra |
| **Functions** | Cloud Functions | Edge Functions (snabbare) |
| **Real-time** | Ja | Ja |
| **Open source** | Nej | Ja |

## Hjälp och support

**Dokumentation:**
- Supabase Docs: https://supabase.com/docs
- JavaScript Client: https://supabase.com/docs/reference/javascript
- Edge Functions: https://supabase.com/docs/guides/functions

**Community:**
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase

**Lokala filer:**
- `SUPABASE_MIGRATION.md` - Steg-för-steg migration
- `FIRESTORE_TO_SUPABASE_CONVERSION.md` - Kod-konvertering
- `src/utils/supabaseHelpers.js` - Helper-funktioner

## Checklista

- [ ] Supabase-projekt skapat
- [ ] Databas-schema kört
- [ ] API credentials hämtade
- [ ] .env fil konfigurerad
- [ ] Frontend-filer konverterade
- [ ] Edge Functions deployade
- [ ] Lokal testning klar
- [ ] Produktion-deploy klar

## Nästa steg

**BÖRJA HÄR:**
1. Skapa Supabase-projekt (länk ovan)
2. Kör `supabase-schema.sql`
3. Uppdatera `.env` med dina credentials
4. Börja konvertera frontend-filerna en i taget

**Behöver du hjälp?**
- Öppna de medföljade guiderna
- Använd helper-funktionerna
- Testa ofta under utvecklingen

Lycka till med migreringen! 🚀
