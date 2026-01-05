import { createClient } from '@supabase/supabase-js';

// Supabase Konfiguration - gleiche Datenbank wie app.quixx24.com
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://yotevdjjomfwbsncwpwc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdGV2ZGpqb21md2JzbmN3cHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4NjY2MzAsImV4cCI6MjA0OTQ0MjYzMH0.qvLVMgayO0sLlYpSMXNnvBSRXcXG2SbvQqfNdxKqVsE';

console.log('🔗 Supabase URL:', SUPABASE_URL);
console.log('🔑 Supabase Key vorhanden:', !!SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Artikel nach ID laden - verwendet lager_artikel Tabelle (wie app.quixx24.com)
export async function getArtikelById(id) {
  console.log('📦 Lade Artikel mit ID:', id);
  
  const { data, error } = await supabase
    .from('lager_artikel')
    .select('*, lager_lieferanten(name)')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('❌ Fehler beim Laden des Artikels:', error);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Details:', error.details);
    return null;
  }
  
  console.log('✅ Artikel gefunden:', data);
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
    console.error('Fehler beim Laden des Artikels:', error);
    return null;
  }
  return data;
}

// Bestand aktualisieren
export async function updateBestand(id, neuerBestand) {
  const { data, error } = await supabase
    .from('lager_artikel')
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

// Lagertransaktion protokollieren
export async function logBewegung(artikelId, menge, typ, notiz = '', userId = null) {
  const { error } = await supabase
    .from('lager_transaktionen')
    .insert({
      artikel_id: artikelId,
      menge: menge,
      typ: typ, // 'entnahme' oder 'zugang'
      notiz: notiz,
      user_id: userId,
      erstellt_am: new Date().toISOString()
    });
  
  if (error) {
    console.error('Fehler beim Protokollieren:', error);
  }
}
