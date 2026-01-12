# Nödvändiga SQL-uppdateringar

Kör dessa SQL-scripts i Supabase SQL Editor för att få alla funktioner att fungera:

## 1. Event Types i Settings (KRITISK)
**Fil:** `add-event-types-to-settings.sql`

Lägger till `event_types`-kolumn i settings-tabellen så att anpassningsbara händelsetyper fungerar i schemat.

```sql
-- Kopiera hela innehållet från add-event-types-to-settings.sql
```

## 2. Description i Scheduled Jobs (KRITISK)
**Fil:** `add-description-to-scheduled-jobs.sql`

Lägger till `description`-kolumn så att noteringar kan sparas på schemahändelser.

```sql
-- Kopiera hela innehållet från add-description-to-scheduled-jobs.sql
```

## 3. Notes i Orders (VIKTIG)
**Fil:** `add-notes-to-orders.sql`

Lägger till `notes`-kolumn i orders-tabellen så att noteringar kan sparas på arbetsordrar.

```sql
-- Kopiera hela innehållet från add-notes-to-orders.sql
```

## 4. Order Documents Tabell
**Fil:** `create-order-documents-table.sql`

Skapar tabellen för dokumenthantering på arbetsordrar.

```sql
-- Kopiera hela innehållet från create-order-documents-table.sql
```

## 5. Storage Policies för Dokument
**Fil:** `setup-document-storage-policies.sql`

Skapar RLS-policies för storage bucket (kör EFTER att du skapat bucket:en).

```sql
-- Kopiera hela innehållet från setup-document-storage-policies.sql
```

---

## Snabb-checklista

- [ ] Kör add-event-types-to-settings.sql
- [ ] Kör add-description-to-scheduled-jobs.sql
- [ ] Kör add-notes-to-orders.sql
- [ ] Skapa Storage bucket: `order-documents` (Public)
- [ ] Kör create-order-documents-table.sql
- [ ] Kör setup-document-storage-policies.sql

Efter detta bör alla funktioner fungera!
