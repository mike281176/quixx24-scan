import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  ScanLine, Package, Plus, Minus, Check, X, RefreshCw, 
  MapPin, Tag, Warehouse, AlertTriangle, Info
} from 'lucide-react';
import { getArtikelById, getArtikelByArtikelnummer, updateBestand } from './lib/supabase';

function App() {
  const [scanning, setScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [artikel, setArtikel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [menge, setMenge] = useState(1);
  const [scanParams, setScanParams] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // URL-Parameter beim Start prÃ¼fen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const cat = params.get('cat');
    const loc = params.get('loc');
    
    if (id) {
      setScanParams({ id, cat, loc });
      loadArtikel(id);
    }
  }, []);

  // Scanner starten wenn DOM bereit ist
  useEffect(() => {
    if (scannerReady && scanning) {
      initScanner();
    }
  }, [scannerReady, scanning]);

  // Scanner initialisieren (nachdem DOM gerendert wurde)
  const initScanner = async () => {
    try {
      // Kurz warten damit DOM sicher gerendert ist
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const qrReaderElement = document.getElementById('qr-reader');
      if (!qrReaderElement) {
        setError('Scanner-Element nicht gefunden');
        setScanning(false);
        setScannerReady(false);
        return;
      }

      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1
        },
        onScanSuccess,
        onScanError
      );
    } catch (err) {
      let errorMsg = 'Kamera konnte nicht gestartet werden';
      const errMessage = err?.message || '';
      if (errMessage.includes('Permission') || errMessage.includes('permission')) {
        errorMsg = 'Kamera-Zugriff verweigert. Bitte in Browser-Einstellungen erlauben.';
      } else if (errMessage.includes('NotFound') || errMessage.includes('not found')) {
        errorMsg = 'Keine Kamera gefunden';
      } else if (errMessage) {
        errorMsg += ': ' + errMessage;
      }
      setError(errorMsg);
      setScanning(false);
      setScannerReady(false);
    }
  };

  // Artikel laden
  const loadArtikel = async (id) => {
    setLoading(true);
    setError(null);
    
    console.log('ðŸ” Suche Artikel mit ID/Artikelnummer:', id);
    
    try {
      // Erst nach ID suchen
      let data = await getArtikelById(id);
      
      // Falls nicht gefunden, nach Artikelnummer suchen
      if (!data) {
        console.log('ðŸ“¦ Nicht per ID gefunden, suche nach Artikelnummer...');
        data = await getArtikelByArtikelnummer(id);
      }
      
      if (data) {
        console.log('âœ… Artikel geladen:', data);
        setArtikel(data);
      } else {
        console.log('âŒ Artikel nicht gefunden fÃ¼r:', id);
        setError(`Artikel nicht gefunden (ID/Art.-Nr.: ${id})`);
      }
    } catch (err) {
      console.error('ðŸ’¥ Fehler beim Laden:', err);
      setError('Fehler beim Laden: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Kamera-Berechtigung prÃ¼fen
  const checkCameraPermission = async () => {
    // PrÃ¼fe ob HTTPS (Kamera benÃ¶tigt secure context)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      return { granted: false, error: 'Kamera benÃ¶tigt HTTPS-Verbindung' };
    }
    
    // PrÃ¼fe ob Kamera-API verfÃ¼gbar
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { granted: false, error: 'Kamera wird von diesem Browser nicht unterstÃ¼tzt' };
    }
    
    try {
      // Berechtigung anfragen
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      // Stream sofort stoppen (wir wollten nur die Berechtigung)
      stream.getTracks().forEach(track => track.stop());
      return { granted: true };
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        return { granted: false, error: 'Kamera-Zugriff wurde verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.' };
      } else if (err.name === 'NotFoundError') {
        return { granted: false, error: 'Keine Kamera gefunden' };
      }
      return { granted: false, error: 'Kamera-Fehler: ' + err.message };
    }
  };

  // QR Scanner starten
  const startScanner = async () => {
    setError(null);
    setArtikel(null);
    setScanParams(null);
    
    // Erst Kamera-Berechtigung prÃ¼fen
    const permission = await checkCameraPermission();
    if (!permission.granted) {
      setError(permission.error);
      return;
    }
    
    // Erst scanning aktivieren (rendert das DOM-Element)
    setScanning(true);
    // Dann scannerReady setzen (triggert useEffect der Scanner startet)
    setScannerReady(true);
    
    // URL zurÃ¼cksetzen
    window.history.replaceState({}, '', '/');
  };

  // Scanner stoppen
  const stopScanner = async () => {
    setScannerReady(false);
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error('Fehler beim Stoppen:', err);
      }
    }
    setScanning(false);
  };

  // QR-Code erfolgreich gescannt
  const onScanSuccess = async (decodedText) => {
    await stopScanner();
    
    // URL parsen
    try {
      const url = new URL(decodedText);
      const id = url.searchParams.get('id');
      const cat = url.searchParams.get('cat');
      const loc = url.searchParams.get('loc');
      
      if (id) {
        setScanParams({ id, cat, loc });
        window.history.replaceState({}, '', `?id=${id}&cat=${cat || ''}&loc=${loc || ''}`);
        await loadArtikel(id);
      } else {
        setError('UngÃ¼ltiger QR-Code: Keine Artikel-ID gefunden');
      }
    } catch {
      // Vielleicht ist es nur eine ID
      if (/^\d+$/.test(decodedText)) {
        setScanParams({ id: decodedText, cat: null, loc: null });
        await loadArtikel(decodedText);
      } else {
        setError('UngÃ¼ltiger QR-Code Format');
      }
    }
  };

  // Scan Fehler (wird bei jedem Frame ohne QR-Code aufgerufen)
  const onScanError = (err) => {
    // Ignorieren - normal wenn kein QR-Code im Bild
  };

  // Bestand Ã¤ndern
  const handleBestandAendern = async (typ) => {
    if (!artikel) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const neuerBestand = typ === 'entnahme' 
      ? Math.max(0, artikel.ist_bestand - menge)
      : artikel.ist_bestand + menge;
    
    try {
      const updated = await updateBestand(artikel.id, neuerBestand);
      if (updated) {
        setArtikel(updated);
        setSuccess(`Bestand ${typ === 'entnahme' ? 'reduziert' : 'erhÃ¶ht'} auf ${neuerBestand}`);
        setMenge(1);
        
        // Erfolg nach 3 Sekunden ausblenden
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Fehler beim Aktualisieren');
      }
    } catch (err) {
      setError('Fehler: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Neuen Scan starten
  const handleNeuScan = () => {
    setArtikel(null);
    setScanParams(null);
    setError(null);
    setSuccess(null);
    setMenge(1);
    window.history.replaceState({}, '', '/');
  };

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto">
      {/* Header */}
      <header className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center">
            <ScanLine className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">QUIXX24</h1>
            <p className="text-teal-400 text-sm">Lager Scanner</p>
          </div>
        </div>
      </header>

      {/* Scanner Bereich */}
      {!artikel && !loading && (
        <div className="mb-6">
          {!scanning ? (
            <button
              onClick={startScanner}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 
                         text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-teal-900/50
                         flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <ScanLine className="w-6 h-6" />
              QR-Code scannen
            </button>
          ) : (
            <div className="space-y-4">
              <div 
                id="qr-reader" 
                ref={scannerRef}
                className="rounded-xl overflow-hidden border-4 border-teal-600 scan-active"
              />
              <button
                onClick={stopScanner}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl
                           flex items-center justify-center gap-2 transition-all"
              >
                <X className="w-5 h-5" />
                Abbrechen
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-teal-300">Lade Artikel...</p>
        </div>
      )}

      {/* Fehler */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-medium">{error}</p>
            <button 
              onClick={handleNeuScan}
              className="text-red-400 underline text-sm mt-2"
            >
              Erneut scannen
            </button>
          </div>
        </div>
      )}

      {/* Erfolg */}
      {success && (
        <div className="bg-green-900/50 border border-green-500 rounded-xl p-4 mb-4 flex items-center gap-3">
          <Check className="w-6 h-6 text-green-400" />
          <p className="text-green-300 font-medium">{success}</p>
        </div>
      )}

      {/* Artikel Anzeige */}
      {artikel && !loading && (
        <div className="space-y-4">
          {/* Artikel Info Card */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-teal-700/50">
            <div className="flex items-start gap-4">
              {/* Bild oder Placeholder */}
              <div className="w-20 h-20 bg-slate-700 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                {artikel.bild ? (
                  <img src={artikel.bild} alt={artikel.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-10 h-10 text-slate-500" />
                )}
              </div>
              
              {/* Details */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{artikel.name}</h2>
                <p className="text-teal-400 text-sm flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Art.-Nr.: {artikel.artikelnummer}
                </p>
                {scanParams?.loc && (
                  <p className="text-yellow-400 text-sm flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {scanParams.loc}
                  </p>
                )}
              </div>
            </div>

            {/* Bestand Anzeige */}
            <div className="mt-4 bg-slate-900/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Aktueller Bestand:</span>
                <span className={`text-2xl font-bold ${
                  artikel.ist_bestand <= (artikel.soll_bestand || 0) ? 'text-red-400' : 'text-green-400'
                }`}>
                  {artikel.ist_bestand} {artikel.einheit || 'Stk'}
                </span>
              </div>
              {artikel.soll_bestand && artikel.ist_bestand <= artikel.soll_bestand && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Unter Mindestbestand ({artikel.soll_bestand})
                </p>
              )}
            </div>

            {/* Zusatzinfos */}
            {artikel.lagerort && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                <Warehouse className="w-4 h-4" />
                <span>Lagerort: {artikel.lagerort}</span>
              </div>
            )}
          </div>

          {/* Bestand Ã„ndern */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-teal-700/50">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-400" />
              Bestand Ã¤ndern
            </h3>

            {/* Menge Eingabe */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => setMenge(m => Math.max(1, m - 1))}
                className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-white"
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <input
                type="number"
                value={menge}
                onChange={(e) => setMenge(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 h-12 bg-slate-900 border border-teal-600 rounded-lg text-center text-2xl font-bold text-white"
              />
              
              <button
                onClick={() => setMenge(m => m + 1)}
                className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-white"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Schnellauswahl */}
            <div className="flex gap-2 justify-center mb-4">
              {[1, 5, 10, 25].map(n => (
                <button
                  key={n}
                  onClick={() => setMenge(n)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    menge === n 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Aktions-Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleBestandAendern('entnahme')}
                disabled={loading || artikel.ist_bestand < menge}
                className="bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:cursor-not-allowed
                           text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Minus className="w-5 h-5" />
                Entnahme
              </button>
              
              <button
                onClick={() => handleBestandAendern('zugang')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed
                           text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-5 h-5" />
                Zugang
              </button>
            </div>
          </div>

          {/* Neuer Scan Button */}
          <button
            onClick={handleNeuScan}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-xl
                       flex items-center justify-center gap-2 transition-all"
          >
            <ScanLine className="w-5 h-5" />
            Neuen QR-Code scannen
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center mt-8 text-slate-500 text-xs">
        <p>QUIXX24 Scanner v1.0</p>
        <p>Verbunden mit app.quixx24.com</p>
      </footer>
    </div>
  );
}

export default App;

