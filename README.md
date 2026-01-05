# QUIXX24 Scanner App

Leichtgewichtige Scanner-App für QUIXX24 Lagerverwaltung.

## Features

- 📱 QR-Code Scanner (Kamera)
- 📦 Artikel-Details anzeigen
- ➕➖ Bestand direkt anpassen (Entnahme/Zugang)
- 🌐 PWA - als App installierbar
- 🔗 Direkt-Links per QR-Code

## URL-Format

```
https://scan.quixx24.com/scan?id={artikel_id}&cat={kategorie}&loc={lagerort}
```

Beispiel:
```
https://scan.quixx24.com/scan?id=5501&cat=verbrauch&loc=Regal-A-04
```

## Setup

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Umgebungsvariablen setzen:**
   
   In Vercel unter Settings → Environment Variables:
   ```
   VITE_SUPABASE_URL=https://yotevdjjomfwbsncwpwc.supabase.co
   VITE_SUPABASE_ANON_KEY=dein_anon_key
   ```

3. **Lokal starten:**
   ```bash
   npm run dev
   ```

4. **Build für Production:**
   ```bash
   npm run build
   ```

## Vercel Deployment

1. GitHub Repository erstellen: `quixx24-scan`
2. Code pushen
3. In Vercel importieren
4. Custom Domain setzen: `scan.quixx24.com`
5. Environment Variables setzen (gleiche wie Haupt-App)

## Verbindung zur Haupt-App

Diese Scanner-App verbindet sich zur gleichen Supabase-Datenbank wie `app.quixx24.com`.
Änderungen am Bestand sind sofort in beiden Apps sichtbar.

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- html5-qrcode (Scanner)
- Supabase (Datenbank)
