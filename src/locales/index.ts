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
import ko from './ko.json';
import ar from './ar.json';
import nl from './nl.json';
import tr from './tr.json';
import th from './th.json';
import vi from './vi.json';
import id from './id.json';
import he from './he.json';
import sv from './sv.json';
import nb from './nb.json';
import da from './da.json';
import fi from './fi.json';
import cs from './cs.json';
import hu from './hu.json';
import ro from './ro.json';
import el from './el.json';
import ms from './ms.json';
import fil from './fil.json';
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
  ko: { translation: ko },
  ar: { translation: ar },
  nl: { translation: nl },
  tr: { translation: tr },
  th: { translation: th },
  vi: { translation: vi },
  id: { translation: id },
  he: { translation: he },
  sv: { translation: sv },
  nb: { translation: nb },
  da: { translation: da },
  fi: { translation: fi },
  cs: { translation: cs },
  hu: { translation: hu },
  ro: { translation: ro },
  el: { translation: el },
  ms: { translation: ms },
  fil: { translation: fil },
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
