# 🚀 Snabbstart: Deploy till Vercel

## 5 minuter till live!

### 1. Logga in på Vercel
```
1. Gå till vercel.com
2. Klicka "Sign Up" → "Continue with GitHub"
3. Auktorisera Vercel att komma åt ditt GitHub-konto
```

### 2. Importera projekt
```
1. Klicka "Add New..." → "Project"
2. Välj "AiO-sweden/Workorder"
3. Klicka "Import"
```

### 3. Lägg till Environment Variables ⚠️ VIKTIGT!
```
Settings → Environment Variables → Add New

Variabel 1:
Name: REACT_APP_SUPABASE_URL
Value: https://hncwatpqwvxzdlxhhgjm.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development

Variabel 2:
Name: REACT_APP_SUPABASE_ANON_KEY
Value: [DIN ANON KEY - hämta från Supabase]
Environments: ✅ Production ✅ Preview ✅ Development
```

💡 **Hitta din key:**
1. Gå till supabase.com/dashboard
2. Välj projekt: hncwatpqwvxzdlxhhgjm
3. Settings → API → Kopiera "anon public" key

⚠️ **OBS:** Utan dessa variabler får du fel! Se VERCEL_ENV_FIX.md om problem.

### 4. Deploy
```
Klicka "Deploy" → Vänta 2-3 minuter → Klart! 🎉
```

### 5. (Valfritt) Lägg till custom domain
```
Settings → Domains → Add Domain

Exempel:
- aioworkorder.se
- workorder.aioswedenab.se
- app.aioworkorder.se
```

---

## Vad händer efter deploy?

✅ Din app finns live på: `https://din-app.vercel.app`
✅ Automatiska deploys vid varje push till GitHub
✅ HTTPS/SSL aktiverat automatiskt
✅ Global CDN för snabb laddning

## Nästa steg

1. **Uppdatera Supabase Redirect URLs**
   - Lägg till din Vercel-URL i Supabase Auth settings

2. **Kör SQL-migrations**
   - Se REQUIRED_SQL_SETUP.md

3. **Skapa Storage Bucket**
   - Supabase → Storage → Create bucket: "order-documents"

4. **Testa appen**
   - Logga in, skapa order, testa alla funktioner

---

## Behöver du hjälp?

Läs full guide: **VERCEL_DEPLOYMENT.md**
