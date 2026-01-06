import { createClient } from '@supabase/supabase-js';

// Supabase Konfiguration - DIREKTE WERTE
const SUPABASE_URL = 'https://yotevdjjomfwbsncwpwc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdGV2ZGpqb21md2JzbmN3cHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNjQ1OTYsImV4cCI6MjA3OTY0MDU5Nn0.lGy5wHPJfnpgmKnE6YU6PqjqIdKfzLIrvmWTUoY1J8U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Artikel nach ID laden
export async function getArtikelById(id) {
  const { data, error } = await supabase
    .from('lager_artikel')
    .select('*, lager_lieferanten(name)')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Fehler beim Laden:', error);
    return null;
  }
  return data;
}

// Artikel nach Artikelnummer laden
export async function getArtikelByArtikelnummer(artikelnummer) {
  const { data, error } = await supabase
    .from('lager_artikel')
    .select('*, lager_lieferanten(name)')
    .eq('artikelnummer', artikelnummer)
    .single();
  
  if (error) {
    console.error('Fehler bei Artikelnummer-Suche:', error);
    return null;
  }
  return data;
}

// Bestand aktualisieren - verwendet ist_bestand (korrekter Feldname)
export async function updateBestand(id, neuerBestand) {
  const { data, error } = await supabase
    .from('lager_artikel')
    .update({ 
      ist_bestand: neuerBestand,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Fehler beim Aktualisieren:', error);
    return null;
  }
  return data;
}
