# Migrering från Firebase till Supabase

## Steg 1: Skapa Supabase-projekt ✓

1. Gå till https://supabase.com och skapa ett konto
2. Klicka på "New Project"
3. Välj organisation och namnge projektet (t.ex. "aio-arbetsorder")
4. **Viktigt:** Välj region **North EU (Stockholm)** för bästa prestanda
5. Skapa ett starkt lösenord för databasen (spara det säkert!)
6. Vänta ~2 minuter medan projektet skapas

## Steg 2: Hämta credentials ✓

1. Gå till ditt projekt i Supabase
2. Klicka på Settings (kugghjul) → API
3. Kopiera följande värden:
   - **Project URL** (under "Project URL")
   - **anon public key** (under "Project API keys")

4. Skapa en `.env`-fil i projektets rot-mapp:
```bash
cp .env.example .env
```

5. Öppna `.env` och fyll i dina credentials:
```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Steg 3: Kör databas-schema ✓

1. Gå till ditt Supabase-projekt
2. Klicka på "SQL Editor" i sidomenyn
3. Klicka på "+ New query"
4. Öppna filen `supabase-schema.sql` i projektet
5. Kopiera hela innehållet och klistra in i SQL Editor
6. Klicka på "Run" (eller Ctrl/Cmd + Enter)
7. Vänta tills alla tabeller, index och policies är skapade

Du bör se ett meddelande: "Success. No rows returned"

## Steg 4: Verifiera tabeller

1. Klicka på "Table Editor" i sidomenyn
2. Du ska nu se alla tabeller:
   - organizations
   - schedulable_users
   - customers
   - orders
   - time_reports
   - scheduled_jobs
   - articles
   - settings

## Steg 5: Aktivera autentisering

1. Gå till Authentication → Providers
2. Aktivera "Email" provider (borde vara på som standard)
3. Under "Email Templates" kan du anpassa välkomstmails

## Steg 6: Migrera befintlig data

**OBS:** Du behöver migrera din befintliga Firebase-data till Supabase.

### Alternativ A: Manuell export/import (för små datasets)
1. Exportera data från Firebase Firestore (via Firebase Console)
2. Formatera om till PostgreSQL INSERT statements
3. Kör i Supabase SQL Editor

### Alternativ B: Migrationsskript (rekommenderat)
Ett migrerings-script kommer att skapas som:
1. Läser data från Firebase
2. Transformerar den till PostgreSQL-format
3. Skriver in i Supabase

## Steg 7: Uppdatera koden

Koden har redan uppdaterats för att använda Supabase istället för Firebase.

Huvudsakliga ändringar:
- `src/supabase.js` - Ny Supabase-konfiguration
- Authentication använder `supabase.auth` istället för Firebase Auth
- Databasfrågor använder `supabase.from()` istället för Firestore
- Edge Functions ersätter Cloud Functions

## Steg 8: Testa lokalt

1. Starta dev-servern:
```bash
npm start
```

2. Testa följande funktioner:
   - [ ] Skapa konto
   - [ ] Logga in
   - [ ] Skapa arbetsorder
   - [ ] Skapa kund
   - [ ] Rapportera tid
   - [ ] Schemaläggning
   - [ ] Inställningar

## Steg 9: Deploya Edge Functions

För att ersätta Firebase Cloud Functions (fetchCompanyData, inviteUser):

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
supabase link --project-ref your-project-ref
```

4. Deploya funktioner:
```bash
supabase functions deploy fetch-company-data
supabase functions deploy invite-user
```

## Steg 10: Deploya frontend

Supabase har inte inbyggd static hosting, så använd ett av följande:

### Alternativ A: Vercel (rekommenderat, gratis)
1. Gå till https://vercel.com
2. Importera ditt GitHub-repo
3. Sätt environment variables (REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY)
4. Deploy!

### Alternativ B: Netlify (gratis)
1. Gå till https://netlify.com
2. Dra och släpp din `build/` mapp
3. Eller koppla GitHub-repo för automatisk deploy

### Alternativ C: Fortsätt med Firebase Hosting
Du kan fortsätta använda Firebase Hosting för frontend:
```bash
npm run build
firebase deploy --only hosting
```

## Kostnader

### Supabase Free Tier inkluderar:
- 500 MB databas-storage
- 50,000 månatliga aktiva användare
- 1 GB fil-storage
- 2 GB bandbredd
- 2 miljoner Edge Function-anrop
- Realtime subscriptions

För er användning kommer det troligen vara **helt gratis**.

### Om ni växer över free tier:
- Pro plan: $25/månad
- Inkluderar 8 GB databas, 100 GB bandbredd, 50 GB fil-storage

## Fördelar med Supabase

✅ **Gratis** - Generös free tier
✅ **PostgreSQL** - Kraftfullare än Firestore
✅ **Row Level Security** - Inbyggd säkerhet på radnivå
✅ **Realtime** - WebSocket-subscriptions inkluderat
✅ **Edge Functions** - Samma funktion som Cloud Functions
✅ **Inbyggd Auth** - Email, OAuth, Magic links
✅ **Storage** - Fil-upload liknande Firebase Storage
✅ **Auto-generated API** - RESTful API från schema
✅ **Open source** - Kan self-hosta om ni vill

## Support

Om problem uppstår:
- Supabase Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase

## Nästa steg

Efter att du har skapat Supabase-projektet och fyllt i `.env`-filen, kör:

```bash
# Starta om utvecklingsservern för att läsa in .env
npm start
```

Då kommer applikationen att använda Supabase istället för Firebase!
