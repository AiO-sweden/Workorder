# Dokumenthantering - Supabase Setup

## Steg 1: Skapa Storage Bucket

1. Gå till din Supabase Dashboard: https://supabase.com/dashboard
2. Välj ditt projekt
3. Gå till **Storage** i vänstermenyn
4. Klicka på **New bucket**
5. Fyll i:
   - **Name:** `order-documents`
   - **Public bucket:** ✅ Kryssa i denna (så att bilder kan visas)
   - **File size limit:** 50 MB (eller vad du vill)
   - **Allowed MIME types:** Lämna tom för att tillåta alla
6. Klicka **Create bucket**

## Steg 2: Kör Database SQL

1. Gå till **SQL Editor** i vänstermenyn
2. Klicka **New query**
3. Kopiera innehållet från `create-order-documents-table.sql`
4. Klistra in och klicka **Run**

## Steg 3: Kör Storage Policies SQL

1. I **SQL Editor**, skapa en ny query
2. Kopiera innehållet från `setup-document-storage-policies.sql`
3. Klistra in och klicka **Run**

## Steg 4: Testa

1. Gå till din app på http://localhost:3000
2. Öppna en arbetsorder
3. Klicka på fliken **Dokument**
4. Testa att ladda upp en fil eller ta ett foto

## Vanliga problem

### "new row violates row-level security policy"
- Kör steg 3 igen (Storage Policies)
- Kontrollera att du är inloggad i appen

### "Failed to load resource: 400"
- Kontrollera att bucket:en är skapad och heter exakt `order-documents`
- Kontrollera att bucket:en är satt till Public

### Bilder visas inte
- Bucket:en måste vara Public
- Gå till Storage → order-documents → Settings → Public access: ON
