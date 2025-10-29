import { create } from 'zustand';
import { Storage } from '../utils/storage';

export interface ReaderSettings {
  theme: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  margins: number;
}

export interface DownloadSettings {
  maxConcurrent: number;
  maxAssetSize: number;
  wifiOnly: boolean;
  downloadImages: boolean;
  downloadStyles: boolean;
  downloadFonts: boolean;
}

interface SettingsStore {
  readerDefaults: ReaderSettings;
  downloadSettings: DownloadSettings;

  updateReaderDefaults: (settings: Partial<ReaderSettings>) => void;
  updateDownloadSettings: (settings: Partial<DownloadSettings>) => void;
  loadSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  readerDefaults: {
    theme: 'light',
    fontFamily: 'system',
    fontSize: 17,
    lineHeight: 1.5,
    margins: 16,
  },

  downloadSettings: {
    maxConcurrent: 3,
    maxAssetSize: 10 * 1024 * 1024,
    wifiOnly: false,
    downloadImages: true,
    downloadStyles: true,
    downloadFonts: true,
  },

  updateReaderDefaults: (settings: Partial<ReaderSettings>) => {
    set(state => {
      const newSettings = { ...state.readerDefaults, ...settings };

      // Persist to storage
      if (settings.theme) Storage.setReaderTheme(settings.theme);
      if (settings.fontFamily) Storage.setReaderFontFamily(settings.fontFamily);
      if (settings.fontSize) Storage.setReaderFontSize(settings.fontSize);
      if (settings.lineHeight) Storage.setReaderLineHeight(settings.lineHeight);
      if (settings.margins) Storage.setReaderMargins(settings.margins);

      return { readerDefaults: newSettings };
    });
  },

  updateDownloadSettings: (settings: Partial<DownloadSettings>) => {
    set(state => {
      const newSettings = { ...state.downloadSettings, ...settings };

      // Persist to storage
      if (settings.maxConcurrent)
        Storage.setDownloadMaxConcurrent(settings.maxConcurrent);
      if (settings.maxAssetSize)
        Storage.setDownloadMaxSize(settings.maxAssetSize);
      if (settings.wifiOnly !== undefined)
        Storage.setDownloadWifiOnly(settings.wifiOnly);
      if (settings.downloadImages !== undefined)
        Storage.setDownloadImages(settings.downloadImages);
      if (settings.downloadStyles !== undefined)
        Storage.setDownloadStyles(settings.downloadStyles);
      if (settings.downloadFonts !== undefined)
        Storage.setDownloadFonts(settings.downloadFonts);

      return { downloadSettings: newSettings };
    });
  },

  loadSettings: () => {
    set({
      readerDefaults: {
        theme: Storage.getReaderTheme(),
        fontFamily: Storage.getReaderFontFamily(),
        fontSize: Storage.getReaderFontSize(),
        lineHeight: Storage.getReaderLineHeight(),
        margins: Storage.getReaderMargins(),
      },
      downloadSettings: {
        maxConcurrent: Storage.getDownloadMaxConcurrent(),
        maxAssetSize: Storage.getDownloadMaxSize(),
        wifiOnly: Storage.getDownloadWifiOnly(),
        downloadImages: Storage.getDownloadImages(),
        downloadStyles: Storage.getDownloadStyles(),
        downloadFonts: Storage.getDownloadFonts(),
      },
    });
  },
}));
