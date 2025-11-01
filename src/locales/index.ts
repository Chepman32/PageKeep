import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ru from './ru.json';
import es from './es.json';
import de from './de.json';
import fr from './fr.json';
import pt from './pt.json';
import ja from './ja.json';
import it from './it.json';
import pl from './pl.json';
import zh from './zh.json';
import hi from './hi.json';
import uk from './uk.json';
import { Storage } from '../utils/storage';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  es: { translation: es },
  sp: { translation: es },
  de: { translation: de },
  fr: { translation: fr },
  pt: { translation: pt },
  por: { translation: pt },
  ja: { translation: ja },
  jp: { translation: ja },
  it: { translation: it },
  pl: { translation: pl },
  zh: { translation: zh },
  hi: { translation: hi },
  uk: { translation: uk },
  ua: { translation: uk },
};

const savedLanguage = Storage.getLanguage();

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });
}

export default i18n;
