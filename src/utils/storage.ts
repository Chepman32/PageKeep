import type { MMKV } from 'react-native-mmkv';
import { createMMKV } from 'react-native-mmkv';

type StorageAdapter = Pick<
  MMKV,
  'set' | 'getString' | 'getNumber' | 'getBoolean' | 'remove' | 'clearAll'
>;

class MemoryStorage implements StorageAdapter {
  private store = new Map<string, string | number | boolean>();

  set(key: string, value: string | number | boolean): void {
    this.store.set(key, value);
  }

  getString(key: string): string | undefined {
    const value = this.store.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  getNumber(key: string): number | undefined {
    const value = this.store.get(key);
    return typeof value === 'number' ? value : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.store.get(key);
    return typeof value === 'boolean' ? value : undefined;
  }

  remove(key: string): boolean {
    this.store.delete(key);
    return true;
  }

  clearAll(): void {
    this.store.clear();
  }
}

const createStorage = (): StorageAdapter => {
  try {
    const instance = createMMKV({
      id: 'pagenest-storage',
      encryptionKey: 'pagenest-encryption-key-2024',
    });

    if (!instance) {
      throw new Error('createMMKV returned undefined');
    }

    return instance;
  } catch (error) {
    console.warn(
      '[storage] Falling back to in-memory storage because MMKV is unavailable.',
      error,
    );
    return new MemoryStorage();
  }
};

export const storage: StorageAdapter = createStorage();

export const StorageKeys = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
  SEARCH_HISTORY: 'search_history',
  LAST_SELECTED_TAB: 'last_selected_tab',
  READER_THEME: 'reader_theme',
  READER_FONT_SIZE: 'reader_font_size',
  READER_LINE_HEIGHT: 'reader_line_height',
  READER_MARGINS: 'reader_margins',
  READER_FONT_FAMILY: 'reader_font_family',
  DOWNLOAD_MAX_CONCURRENT: 'download_max_concurrent',
  DOWNLOAD_MAX_SIZE: 'download_max_size',
  DOWNLOAD_WIFI_ONLY: 'download_wifi_only',
  DOWNLOAD_IMAGES: 'download_images',
  DOWNLOAD_STYLES: 'download_styles',
  DOWNLOAD_FONTS: 'download_fonts',
  IAP_PRO_STATUS: 'iap_pro_status',
  LANGUAGE: 'language',
  SOUND_ENABLED: 'sound_enabled',
  HAPTICS_ENABLED: 'haptics_enabled',
} as const;

export const Storage = {
  // Generic methods
  set(key: string, value: string | number | boolean): void {
    if (typeof value === 'string') {
      storage.set(key, value);
    } else if (typeof value === 'number') {
      storage.set(key, value);
    } else if (typeof value === 'boolean') {
      storage.set(key, value);
    }
  },

  getString(key: string): string | undefined {
    return storage.getString(key);
  },

  getNumber(key: string): number | undefined {
    return storage.getNumber(key);
  },

  getBoolean(key: string): boolean | undefined {
    return storage.getBoolean(key);
  },

  delete(key: string): void {
    storage.remove(key);
  },

  // JSON methods
  setJSON(key: string, value: any): void {
    storage.set(key, JSON.stringify(value));
  },

  getJSON<T>(key: string): T | null {
    const value = storage.getString(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  // Search history
  addToSearchHistory(query: string): void {
    const history = this.getJSON<string[]>(StorageKeys.SEARCH_HISTORY) || [];

    // Remove if already exists
    const filtered = history.filter(q => q !== query);

    // Add to beginning
    filtered.unshift(query);

    // Keep only last 20
    const trimmed = filtered.slice(0, 20);

    this.setJSON(StorageKeys.SEARCH_HISTORY, trimmed);
  },

  getSearchHistory(): string[] {
    return this.getJSON<string[]>(StorageKeys.SEARCH_HISTORY) || [];
  },

  clearSearchHistory(): void {
    this.delete(StorageKeys.SEARCH_HISTORY);
  },

  // Onboarding
  setOnboardingCompleted(completed: boolean): void {
    this.set(StorageKeys.ONBOARDING_COMPLETED, completed);
  },

  isOnboardingCompleted(): boolean {
    return this.getBoolean(StorageKeys.ONBOARDING_COMPLETED) ?? false;
  },

  // Reader settings
  getReaderTheme(): string {
    return this.getString(StorageKeys.READER_THEME) || 'light';
  },

  setReaderTheme(theme: string): void {
    this.set(StorageKeys.READER_THEME, theme);
  },

  getReaderFontSize(): number {
    return this.getNumber(StorageKeys.READER_FONT_SIZE) || 17;
  },

  setReaderFontSize(size: number): void {
    this.set(StorageKeys.READER_FONT_SIZE, size);
  },

  getReaderLineHeight(): number {
    return this.getNumber(StorageKeys.READER_LINE_HEIGHT) || 1.5;
  },

  setReaderLineHeight(height: number): void {
    this.set(StorageKeys.READER_LINE_HEIGHT, height);
  },

  getReaderMargins(): number {
    return this.getNumber(StorageKeys.READER_MARGINS) || 16;
  },

  setReaderMargins(margins: number): void {
    this.set(StorageKeys.READER_MARGINS, margins);
  },

  getReaderFontFamily(): string {
    return this.getString(StorageKeys.READER_FONT_FAMILY) || 'system';
  },

  setReaderFontFamily(family: string): void {
    this.set(StorageKeys.READER_FONT_FAMILY, family);
  },

  // Download settings
  getDownloadMaxConcurrent(): number {
    return this.getNumber(StorageKeys.DOWNLOAD_MAX_CONCURRENT) || 3;
  },

  setDownloadMaxConcurrent(max: number): void {
    this.set(StorageKeys.DOWNLOAD_MAX_CONCURRENT, max);
  },

  getDownloadMaxSize(): number {
    return this.getNumber(StorageKeys.DOWNLOAD_MAX_SIZE) || 10 * 1024 * 1024; // 10MB
  },

  setDownloadMaxSize(size: number): void {
    this.set(StorageKeys.DOWNLOAD_MAX_SIZE, size);
  },

  getDownloadWifiOnly(): boolean {
    return this.getBoolean(StorageKeys.DOWNLOAD_WIFI_ONLY) ?? false;
  },

  setDownloadWifiOnly(wifiOnly: boolean): void {
    this.set(StorageKeys.DOWNLOAD_WIFI_ONLY, wifiOnly);
  },

  getDownloadImages(): boolean {
    return this.getBoolean(StorageKeys.DOWNLOAD_IMAGES) ?? true;
  },

  setDownloadImages(download: boolean): void {
    this.set(StorageKeys.DOWNLOAD_IMAGES, download);
  },

  getDownloadStyles(): boolean {
    return this.getBoolean(StorageKeys.DOWNLOAD_STYLES) ?? true;
  },

  setDownloadStyles(download: boolean): void {
    this.set(StorageKeys.DOWNLOAD_STYLES, download);
  },

  getDownloadFonts(): boolean {
    return this.getBoolean(StorageKeys.DOWNLOAD_FONTS) ?? true;
  },

  setDownloadFonts(download: boolean): void {
    this.set(StorageKeys.DOWNLOAD_FONTS, download);
  },

  // IAP
  getProStatus(): boolean {
    return this.getBoolean(StorageKeys.IAP_PRO_STATUS) ?? false;
  },

  setProStatus(isPro: boolean): void {
    this.set(StorageKeys.IAP_PRO_STATUS, isPro);
  },

  // Feedback preferences
  getSoundEnabled(): boolean {
    const value = this.getBoolean(StorageKeys.SOUND_ENABLED);
    return value ?? true;
  },

  setSoundEnabled(enabled: boolean): void {
    this.set(StorageKeys.SOUND_ENABLED, enabled);
  },

  getHapticsEnabled(): boolean {
    const value = this.getBoolean(StorageKeys.HAPTICS_ENABLED);
    return value ?? true;
  },

  setHapticsEnabled(enabled: boolean): void {
    this.set(StorageKeys.HAPTICS_ENABLED, enabled);
  },

  // Language
  getLanguage(): string {
    const value = this.getString(StorageKeys.LANGUAGE) || 'en';
    switch (value) {
      case 'es':
        return 'sp';
      case 'pt':
        return 'por';
      case 'ja':
        return 'jp';
      case 'uk':
        return 'ua';
      default:
        return value;
    }
  },

  setLanguage(lang: string): void {
    this.set(StorageKeys.LANGUAGE, lang);
  },

  // Clear all
  clearAll(): void {
    storage.clearAll();
  },
};
