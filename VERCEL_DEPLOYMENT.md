# Deploying AIO Arbetsorder till Vercel

## Förutsättningar
- GitHub-konto (redan klart ✅)
- Vercel-konto (gratis) - [vercel.com](https://vercel.com)

## Steg 1: Skapa Vercel-konto

1. Gå till [vercel.com](https://vercel.com)
2. Klicka "Sign Up"
3. Logga in med GitHub (rekommenderat för enkel integration)

## Steg 2: Importera projektet

1. När du är inloggad i Vercel, klicka "Add New..." → "Project"
2. Välj ditt GitHub-repo: `AiO-sweden/Workorder`
3. Vercel kommer automatiskt detektera att det är en Create React App
4. Bekräfta följande inställningar:
   - **Framework Preset:** Create React App
   - **Build Command:** `npm run build` (auto-detekterat)
   - **Output Directory:** `build` (auto-detekterat)
   - **Install Command:** `npm install` (auto-detekterat)

## Steg 3: Environment Variables

Innan du deployer, lägg till dina miljövariabler:

1. I Vercel-projektet, gå till **Settings** → **Environment Variables**
2. Lägg till följande variabler (hämta från din Supabase Dashboard):

```
REACT_APP_SUPABASE_URL=din-supabase-url
REACT_APP_SUPABASE_ANON_KEY=din-supabase-anon-key
```

**Hitta dina Supabase-credentials:**
- Gå till [supabase.com/dashboard](https://supabase.com/dashboard)
- Välj ditt projekt
- Gå till **Settings** → **API**
- Kopiera "Project URL" och "anon public" key

## Steg 4: Deploy!

1. Klicka "Deploy"
2. Vänta ~2-3 minuter medan Vercel bygger projektet
3. När det är klart får du en URL: `https://your-project.vercel.app`

## Steg 5: Konfigurera Custom Domain (aioworkorder.se eller liknande)

### Om du äger domänen:

1. I Vercel-projektet, gå till **Settings** → **Domains**
2. Klicka "Add Domain"
3. Skriv in din domän: `aioworkorder.se` (eller `workorder.aioswedenab.se`)
4. Vercel ger dig DNS-inställningar att lägga till hos din domänleverantör

### DNS-inställningar (hos din domänleverantör):

**För apex domain (aioworkorder.se):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**För www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Alternativt, för subdomain (workorder.aioswedenab.se):**
```
Type: CNAME
Name: workorder
Value: cname.vercel-dns.com
```

### Om du inte har domän än:

Du kan köpa en domän via:
- Namecheap (~$12/år för .se)
- Loopia (populär i Sverige)
- GoDaddy
- Eller registrera gratis via Vercel Domains

## Steg 6: SSL Certificate

Vercel hanterar automatiskt SSL-certifikat (HTTPS) gratis via Let's Encrypt! 🎉

## Steg 7: Uppdatera Supabase Redirect URLs

När domänen är aktiv, uppdatera Supabase redirect URLs:

1. Gå till Supabase Dashboard → **Authentication** → **URL Configuration**
2. Lägg till:
   - `https://aioworkorder.se` (eller din domän)
   - `https://www.aioworkorder.se`
3. Lägg även till dessa i **Redirect URLs**:
   - `https://aioworkorder.se/**`
   - `https://www.aioworkorder.se/**`

## Automatiska deploys

Varje gång du pushar till GitHub kommer Vercel automatiskt att:
1. Detektera ändringar
2. Bygga projektet
3. Deploya den nya versionen
4. Uppdatera live-siten (~30 sekunder)

## Gratis plan inkluderar:

✅ Unlimited deploys
✅ Automatic HTTPS/SSL
✅ Global CDN
✅ Automatic Git integration
✅ Preview deployments för varje PR
✅ Web Analytics
✅ 100GB bandwidth/månad

## Troubleshooting

**Problem:** Build misslyckas
**Lösning:** Kontrollera att alla environment variables är satta

**Problem:** "Page not found" när du refreshar
**Lösning:** `vercel.json` fixar detta (redan klar ✅)

**Problem:** CORS-fel
**Lösning:** Lägg till din Vercel-domän i Supabase CORS-inställningar

## Nästa steg

Efter deployment:
1. ✅ Testa alla funktioner
2. ✅ Kör alla SQL-scripts från REQUIRED_SQL_SETUP.md
3. ✅ Skapa Storage bucket `order-documents`
4. ✅ Bjud in användare

---

**Support:**
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Vercel Discord: Community support
