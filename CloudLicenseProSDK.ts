// ==========================================
// DATEI 1: src/lib/CloudLicenseProSDK.ts
// ==========================================
// In dein bestehendes Projekt: src/lib/CloudLicenseProSDK.ts

interface SDKConfig {
  apiUrl: string;
  productId: string;
  cacheDuration?: number;
  onLicenseInvalid?: () => void;
  onLicenseExpiring?: (daysRemaining: number) => void;
}

interface ValidationResult {
  valid: boolean;
  status?: string;
  type?: string;
  expires_at?: string;
  error?: string;
  product?: { id: string; name: string };
  customer?: { name: string; email: string };
  activations?: { current: number; max: number | null };
}

interface CachedValidation {
  result: ValidationResult;
  timestamp: number;
}

export class CloudLicenseProSDK {
  private config: Required<Omit<SDKConfig, 'onLicenseInvalid' | 'onLicenseExpiring'>> & 
    Pick<SDKConfig, 'onLicenseInvalid' | 'onLicenseExpiring'>;
  private cache: Map<string, CachedValidation> = new Map();
  private validationInterval?: number;

  constructor(config: SDKConfig) {
    this.config = {
      apiUrl: config.apiUrl,
      productId: config.productId,
      cacheDuration: config.cacheDuration || 300000, // Default 5 Minuten
      onLicenseInvalid: config.onLicenseInvalid,
      onLicenseExpiring: config.onLicenseExpiring,
    };
  }

  /**
   * Validiert einen Lizenzschlüssel
   */
  async validate(
    licenseKey: string,
    machineId?: string
  ): Promise<ValidationResult> {
    const cacheKey = `${licenseKey}-${machineId || 'no-machine'}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.config.cacheDuration) {
      return cached.result;
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/validate-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_key: licenseKey,
          product_id: this.config.productId,
          machine_id: machineId,
        }),
      });

      const result: ValidationResult = await response.json();

      // Cache nur erfolgreiche Validierungen
      if (result.valid) {
        this.cache.set(cacheKey, {
          result,
          timestamp: Date.now(),
        });

        // Prüfe ob Lizenz bald abläuft
        if (result.expires_at) {
          const daysRemaining = this.calculateDaysRemaining(result.expires_at);
          if (daysRemaining !== null && daysRemaining <= 7 && this.config.onLicenseExpiring) {
            this.config.onLicenseExpiring(daysRemaining);
          }
        }
      } else if (this.config.onLicenseInvalid) {
        this.config.onLicenseInvalid();
      }

      return result;
    } catch (error) {
      console.error('License validation error:', error);
      return {
        valid: false,
        error: 'Verbindung zum Lizenzserver fehlgeschlagen',
      };
    }
  }

  /**
   * Prüft ob eine Lizenz gültig ist
   */
  async isValid(licenseKey: string, machineId?: string): Promise<boolean> {
    const result = await this.validate(licenseKey, machineId);
    return result.valid;
  }

  /**
   * Startet automatische Validierung im Interval
   */
  startAutoValidation(
    licenseKey: string,
    intervalMs: number = 3600000, // Default 1 Stunde
    machineId?: string
  ): void {
    this.stopAutoValidation();
    
    this.validationInterval = window.setInterval(async () => {
      await this.validate(licenseKey, machineId);
    }, intervalMs);

    // Erste Validierung sofort
    this.validate(licenseKey, machineId);
  }

  /**
   * Stoppt automatische Validierung
   */
  stopAutoValidation(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = undefined;
    }
  }

  /**
   * Berechnet verbleibende Tage bis Ablauf
   */
  private calculateDaysRemaining(expiresAt: string): number | null {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Gibt Tage bis Ablauf zurück
   */
  async getDaysRemaining(licenseKey: string): Promise<number | null> {
    const result = await this.validate(licenseKey);
    if (!result.valid || !result.expires_at) return null;
    return this.calculateDaysRemaining(result.expires_at);
  }

  /**
   * Prüft ob Lizenz bald abläuft
   */
  async isExpiringSoon(
    licenseKey: string,
    daysThreshold: number = 7
  ): Promise<boolean> {
    const days = await this.getDaysRemaining(licenseKey);
    if (days === null) return false;
    return days <= daysThreshold && days > 0;
  }

  /**
   * Löscht Cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Generiert Hardware-ID (Browser)
   */
  static async generateMachineId(): Promise<string> {
    const components = [
      screen.width,
      screen.height,
      screen.colorDepth,
      navigator.hardwareConcurrency || 0,
      navigator.language,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.platform,
    ];

    const fingerprint = components.join('|');
    
    // Simple Hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return `browser-${Math.abs(hash).toString(36)}`;
  }
}

// ==========================================
// VERWENDUNGSBEISPIELE
// ==========================================

/*
// Beispiel 1: Einfache Nutzung in React
import { CloudLicenseProSDK } from './lib/CloudLicenseProSDK';

function App() {
  const [isLicensed, setIsLicensed] = useState(false);
  
  useEffect(() => {
    const sdk = new CloudLicenseProSDK({
      apiUrl: 'https://dyozlmdxjreomzidzgyo.supabase.co/functions/v1',
      productId: 'YOUR-PRODUCT-UUID',
      onLicenseInvalid: () => {
        alert('Lizenz ungültig!');
        window.location.href = '/buy-license';
      },
      onLicenseExpiring: (days) => {
        alert(`Ihre Lizenz läuft in ${days} Tagen ab!`);
      }
    });

    const checkLicense = async () => {
      const valid = await sdk.isValid('USER-LICENSE-KEY');
      setIsLicensed(valid);
    };

    checkLicense();
  }, []);

  if (!isLicensed) {
    return <div>Keine gültige Lizenz</div>;
  }

  return <div>App läuft...</div>;
}

// Beispiel 2: Mit Auto-Validierung
const sdk = new CloudLicenseProSDK({
  apiUrl: 'https://dyozlmdxjreomzidzgyo.supabase.co/functions/v1',
  productId: 'YOUR-PRODUCT-UUID',
});

// Validiere alle 30 Minuten
sdk.startAutoValidation('USER-LICENSE-KEY', 1800000);

// Beispiel 3: Mit Hardware-ID (Floating License)
const machineId = await CloudLicenseProSDK.generateMachineId();
const result = await sdk.validate('USER-LICENSE-KEY', machineId);

if (!result.valid) {
  console.error('Lizenz Fehler:', result.error);
  if (result.activations) {
    console.log('Aktivierungen:', result.activations.current, '/', result.activations.max);
  }
}

// Beispiel 4: Ablauf-Warnung
const days = await sdk.getDaysRemaining('USER-LICENSE-KEY');
if (days && days < 7) {
  showNotification(`Lizenz läuft in ${days} Tagen ab!`);
}
*/