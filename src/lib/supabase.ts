import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Récupération tolérante et robuste des variables d'environnement
const getEnvVar = (keys: string[]): string => {
  for (const key of keys) {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return String(import.meta.env[key]).trim();
    }
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return String(process.env[key]).trim();
    }
  }
  return '';
};

/**
 * Nettoie et valide une URL Supabase (gère les cas où l'utilisateur copie VAR_NAME=https://...)
 */
const cleanUrl = (raw: string): string => {
  if (!raw) return '';
  let s = String(raw).trim();
  // Extraire l'URL http ou https si préfixée par un nom de variable
  const match = s.match(/https?:\/\/[^\s"';\n]+/);
  if (match) {
    s = match[0];
  }
  // Nettoyer les guillemets ou points-virgules résiduels
  s = s.replace(/["';]+$/, '').trim();
  try {
    const parsed = new URL(s);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.origin;
    }
  } catch {
    // URL invalide
  }
  return '';
};

/**
 * Nettoie et valide une clé anonyme/publishable Supabase
 */
const cleanKey = (raw: string): string => {
  if (!raw) return '';
  let s = String(raw).trim();
  if (s.includes('=')) {
    s = s.split('=').pop()?.trim() || '';
  }
  return s.replace(/["';]+$/, '').trim();
};

const rawUrl = getEnvVar([
  'VITE_SUPABASE_URL',
  'URL_SUPABASE_VITE',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_URL',
]);

const rawAnonKey = getEnvVar([
  'VITE_SUPABASE_ANON_KEY',
  'ANON_KEY_SUPABASE_VITE',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
]);

const supabaseUrl = cleanUrl(rawUrl);
const supabaseAnonKey = cleanKey(rawAnonKey);

/**
 * Vérifie de façon rigoureuse si Supabase est configuré avec une URL et une clé anon valides.
 */
export const isSupabaseConfigured = (): boolean => {
  const isValidUrl = Boolean(
    supabaseUrl &&
    (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://localhost')) &&
    !supabaseUrl.includes('votre-projet') &&
    !supabaseUrl.includes('placeholder')
  );

  const isValidKey = Boolean(
    supabaseAnonKey &&
    supabaseAnonKey.length >= 20 &&
    !supabaseAnonKey.includes('placeholder') &&
    !supabaseAnonKey.includes('votre-cle')
  );

  return isValidUrl && isValidKey;
};

// Client singleton Supabase
let clientInstance: SupabaseClient<Database> | null = null;

if (isSupabaseConfigured()) {
  try {
    clientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  } catch (err) {
    console.warn('[Supabase] Initialisation différée :', err);
  }
}

// Toujours fournir une instance valide qui ne fait pas planter l'application
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase: SupabaseClient<Database> =
  clientInstance ||
  createClient<Database>(fallbackUrl, fallbackKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
