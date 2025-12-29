-- Uppdatera default-värdet för godkand kolumnen till true
ALTER TABLE tidsrapporteringar
  ALTER COLUMN godkand SET DEFAULT true;

-- Valfritt: Uppdatera befintliga tidsrapporter som inte är godkända till godkända
-- Kommentera bort denna rad om du INTE vill auto-godkänna befintliga rapporter
UPDATE tidsrapporteringar
  SET godkand = true
  WHERE godkand = false;
