import { getLocales } from 'react-native-localize';

/**
 * List of all supported language codes in the app
 */
const SUPPORTED_LANGUAGES = [
  'en',
  'ru',
  'es',
  'de',
  'fr',
  'pt',
  'ja',
  'it',
  'pl',
  'zh',
  'hi',
  'uk',
  'ko',
  'ar',
  'nl',
  'tr',
  'th',
  'vi',
  'id',
  'he',
  'sv',
  'nb',
  'da',
  'fi',
  'cs',
  'hu',
  'ro',
  'el',
  'ms',
  'fil',
] as const;

/**
 * Detects the device's language and returns a supported language code.
 * Falls back to 'en' if the device language is not supported.
 *
 * @returns A supported language code (e.g., 'en', 'es', 'fr')
 */
export function detectDeviceLanguage(): string {
  try {
    const locales = getLocales();
    console.log('[deviceLocale] Device locales:', JSON.stringify(locales));

    // Iterate through device locales in order of preference
    for (const locale of locales) {
      const languageCode = locale.languageCode.toLowerCase();
      console.log('[deviceLocale] Checking language code:', languageCode);

      // 1. Check for exact match
      if (SUPPORTED_LANGUAGES.includes(languageCode as any)) {
        console.log('[deviceLocale] Exact match found:', languageCode);
        return languageCode;
      }

      // 2. Try to extract base language from locale tags (e.g., 'en-US' → 'en')
      const baseLanguage = languageCode.split('-')[0];
      if (SUPPORTED_LANGUAGES.includes(baseLanguage as any)) {
        console.log('[deviceLocale] Base language match found:', baseLanguage);
        return baseLanguage;
      }
    }
  } catch (error) {
    console.warn('Failed to detect device language:', error);
  }

  // Fallback to English if no supported language found
  console.log('[deviceLocale] No match found, falling back to en');
  return 'en';
}
