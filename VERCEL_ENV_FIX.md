# Fixa Environment Variables i Vercel

## Problem
```
Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.
```

Detta betyder att REACT_APP_SUPABASE_URL inte är satt i Vercel.

## Lösning - Steg för steg

### 1. Gå till Vercel Dashboard
- Öppna [vercel.com/dashboard](https://vercel.com/dashboard)
- Välj ditt projekt (workorder-app eller liknande)

### 2. Öppna Settings
- Klicka på "Settings" i menyn
- Välj "Environment Variables" i sidomenyn

### 3. Lägg till Environment Variables

Klicka "Add New" och lägg till dessa **två** variabler:

#### Variabel 1:
```
Name: REACT_APP_SUPABASE_URL
Value: https://hncwatpqwvxzdlxhhgjm.supabase.co
```

#### Variabel 2:
```
Name: REACT_APP_SUPABASE_ANON_KEY
Value: [DIN SUPABASE ANON KEY]
```

**Hitta din Anon Key:**
1. Gå till [supabase.com/dashboard](https://supabase.com/dashboard)
2. Välj projekt: hncwatpqwvxzdlxhhgjm
3. Gå till Settings → API
4. Kopiera "anon public" key (den långa textsträngen)

#### Environment settings:
För båda variablerna, välj:
- ✅ Production
- ✅ Preview
- ✅ Development

### 4. Spara och Redeploy

1. Klicka "Save" för varje variabel
2. Gå till "Deployments" fliken
3. Välj senaste deployment
4. Klicka på ⋮ (tre prickar)
5. Välj "Redeploy"
6. Bekräfta redeployment

### 5. Vänta ~2 minuter

Vercel bygger om projektet med de nya environment variables.

### 6. Testa appen

När redeployment är klar:
1. Öppna din Vercel URL
2. Kontrollera att det inte längre finns console errors
3. Testa att logga in

## Verifiera att det fungerar

Öppna din app och kolla console (F12):
- ❌ Innan: "Invalid supabaseUrl"
- ✅ Efter: Inga Supabase-fel, appen laddas korrekt

## Om du fortfarande får fel

1. **Dubbelkolla variabelnamnen**
   - Måste vara EXAKT: `REACT_APP_SUPABASE_URL` (inte SUPABASE_URL)
   - Måste vara EXAKT: `REACT_APP_SUPABASE_ANON_KEY`

2. **Dubbelkolla att alla environments är markerade**
   - Production ✅
   - Preview ✅
   - Development ✅

3. **Kontrollera att URL är korrekt**
   - Ska vara: `https://hncwatpqwvxzdlxhhgjm.supabase.co`
   - Ingen slash på slutet!

4. **Redeploy igen**
   - Environment variables läses endast vid build-tid
   - Måste redeploya efter ändringar

## Screenshot guide

Så här ska det se ut i Vercel:

```
Environment Variables
┌─────────────────────────────────────────────────────────────┐
│ REACT_APP_SUPABASE_URL                                      │
│ https://hncwatpqwvxzdlxhhgjm.supabase.co                   │
│ Production ✓ Preview ✓ Development ✓                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ REACT_APP_SUPABASE_ANON_KEY                                 │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...                     │
│ Production ✓ Preview ✓ Development ✓                       │
└─────────────────────────────────────────────────────────────┘
```

---

**Tips:** Du kan också lägga till environment variables från Vercel CLI:
```bash
vercel env add REACT_APP_SUPABASE_URL
```
