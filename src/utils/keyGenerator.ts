// utils/keyGenerator.ts - PROFESSIONAL LICENSE KEY GENERATOR

/**
 * Generates a professional license key in format: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
 * Example: MS7J-HLB3-X9PZ-640X-14YS-KLKD-0CAK-79WT
 */
export function generateProfessionalKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'; // Ohne I, O für bessere Lesbarkeit
  const segments = 8; // 8 Segmente
  const segmentLength = 4; // Je 4 Zeichen

  let key = '';

  for (let i = 0; i < segments; i++) {
    let segment = '';
    for (let j = 0; j < segmentLength; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    key += segment;
    if (i < segments - 1) {
      key += '-';
    }
  }

  return key;
}

/**
 * Validates a license key format
 * Accepts multiple formats:
 * - XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX (32 chars, 8 segments)
 * - KEY-XXXXXXXX-TIMESTAMP (legacy format)
 * - Any format with minimum 16 characters
 */
export function validateKeyFormat(key: string): boolean {
  if (!key || key.length < 16) {
    return false;
  }

  // Professional format: 8 segments of 4 chars
  const professionalFormat = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
  if (professionalFormat.test(key)) {
    return true;
  }

  // Legacy format: KEY-XXXXXXXX-TIMESTAMP
  const legacyFormat = /^KEY-[A-Z0-9]+-\d+$/i;
  if (legacyFormat.test(key)) {
    return true;
  }

  // Generic format: Any alphanumeric with dashes, min 16 chars
  const genericFormat = /^[A-Z0-9-]{16,}$/i;
  return genericFormat.test(key);
}

/**
 * Generates a short activation code (for hardware activations)
 * Format: XXXX-XXXX
 */
export function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 4; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 1) {
      code += '-';
    }
  }

  return code;
}

/**
 * Generates a machine ID from hardware info
 * This should be called from the client app
 */
export function generateMachineId(hardwareInfo?: string): string {
  const base = hardwareInfo || `${navigator.userAgent}-${Date.now()}`;

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}
