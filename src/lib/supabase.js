import { createClient } from '@supabase/supabase-js';

// Supabase Konfiguration - gleiche Datenbank wie app.quixx24.com
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://yotevdjjomfwbsncwpwc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ SUPABASE_ANON_KEY fehlt! Bitte Umgebungsvariablen in Vercel setzen.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Artikel nach ID laden
export async function getArtikelById(id) {
  const { data, error } = await supabase
    .from('lagerverwaltung')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Fehler beim Laden des Artikels:', error);
    return null;
  }
  return data;
}

// Artikel nach SKU laden
export async function getArtikelBySKU(sku) {
  const { data, error } = await supabase
    .from('lagerverwaltung')
    .select('*')
    .eq('sku', sku)
    .single();
  
  if (error) {
    console.error('Fehler beim Laden des Artikels:', error);
    return null;
  }
  return data;
}

// Bestand aktualisieren
export async function updateBestand(id, neuerBestand) {
  const { data, error } = await supabase
    .from('lagerverwaltung')
    .update({ 
      bestand: neuerBestand,
      letzte_aenderung: new Date().toISOString()
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

// Lagerbewegung protokollieren (optional für zukünftige Erweiterungen)
export async function logBewegung(artikelId, menge, typ, notiz = '') {
  const { error } = await supabase
    .from('lagerbewegungen')
    .insert({
      artikel_id: artikelId,
      menge: menge,
      typ: typ, // 'entnahme' oder 'zugang'
      notiz: notiz,
      zeitpunkt: new Date().toISOString()
    });
  
  if (error) {
    console.error('Fehler beim Protokollieren:', error);
  }
}
