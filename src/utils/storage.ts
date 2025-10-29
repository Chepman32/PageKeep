import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'pagenest-storage',
  encryptionKey: 'pagenest-encryption-key-2024',
});

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
    storage.delete(key);
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

  // Language
  getLanguage(): string {
    return this.getString(StorageKeys.LANGUAGE) || 'en';
  },

  setLanguage(lang: string): void {
    this.set(StorageKeys.LANGUAGE, lang);
  },

  // Clear all
  clearAll(): void {
    storage.clearAll();
  },
};
