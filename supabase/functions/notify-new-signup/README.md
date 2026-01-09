# Email Notifikation för Nya Konton

Denna Edge Function skickar ett email till administratören när ett nytt konto skapas i systemet.

## Setup

### 1. Lägg till wants_to_pay kolumn i databasen

Kör SQL-filen i Supabase SQL Editor:
```bash
# Filen finns i: add-wants-to-pay-and-notification.sql
```

### 2. Skapa Resend API-nyckel

1. Gå till [Resend.com](https://resend.com) och skapa ett konto
2. Verifiera din domän (allinonesweden.se) eller använd deras sandbox-domän för test
3. Skapa en API-nyckel i Resend dashboard

### 3. Sätt environment variables i Supabase

Gå till Supabase Dashboard → Project Settings → Edge Functions → Secrets

Lägg till:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
ADMIN_EMAIL=din@email.se
```

### 4. Deploy Edge Function

```bash
# Logga in (om du inte redan gjort det)
npx supabase login

# Deploy funktionen
npx supabase functions deploy notify-new-signup

# Eller med miljövariabler direkt:
npx supabase functions deploy notify-new-signup \
  --no-verify-jwt \
  --project-ref hncwatpqwvxzdlxhhgjm
```

### 5. Aktivera pg_net extension

Kör i Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 6. Konfigurera Supabase URL i app settings

```sql
-- Sätt Supabase URL
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://hncwatpqwvxzdlxhhgjm.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'din_anon_key_här';
```

## Email-innehåll

Emailet innehåller:

- **Företagsinformation**: Företagsnamn, kontaktperson, email, telefon
- **Betalningsstatus**: Om kunden vill börja betala direkt eller startar med provperiod
- **Organisation detaljer**: Adress, org.nr, skapelsedatum
- **Nästa steg**: Actionable items baserat på om kunden vill betala eller inte

## Test

För att testa:

1. Skapa ett nytt konto via `/create-account`
2. Markera "Jag vill börja betala direkt" för att se den prioriterade versionen
3. Kontrollera din email (ADMIN_EMAIL)

## Troubleshooting

### Får inga emails

1. Kontrollera att Edge Function är deployd:
   ```bash
   npx supabase functions list
   ```

2. Kontrollera Edge Function logs:
   ```bash
   npx supabase functions logs notify-new-signup
   ```

3. Verifiera att environment variables är satta:
   - Gå till Supabase Dashboard → Edge Functions → Secrets

4. Kontrollera att triggern är aktiv:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_new_organization_created';
   ```

### Email går till spam

- Verifiera din domän i Resend
- Lägg till SPF och DKIM records
- Använd en professionell från-adress

## Alternativ: Webhook istället för Database Trigger

Om du föredrar att använda webhooks istället för database triggers:

1. Ta bort triggern från SQL
2. Anropa Edge Function direkt från AuthContext efter organization skapats:

```javascript
// I signup-funktionen efter organization skapats:
await fetch(`${SUPABASE_URL}/functions/v1/notify-new-signup`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({ record: orgData })
});
```
