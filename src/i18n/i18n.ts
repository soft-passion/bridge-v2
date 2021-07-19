import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import { getVariationOfAOrAn } from "./i18nUtils";
import bundles, { availableLocales } from "./localeBundles";
import defaultBundle from "./locales/en.json";

const DEFAULT_LOCALE = "en";

// load the right bundle depending on the requested locale
// option to include a default locale so it's always bundled and can be used as fallback
function loadLocaleBundle(locale: string) {
  if (locale !== DEFAULT_LOCALE) {
    return bundles[locale]()
      .then((data: { default: any }) => data.default) // ES6 default import
      .catch((err: any) => {
        console.error(err);
      });
  }
  return Promise.resolve(defaultBundle);
}

const backendOptions = {
  loadPath: "{{lng}}|{{ns}}", // used to pass language and namespace to custom XHR function
  request: (
    options: any,
    url: { split: (arg0: string) => [any] },
    payload: any,
    callback: (arg0: null, arg1: { data?: string; status: number }) => void
  ) => {
    // instead of loading from a URL like i18next-http-backend is intended for, we repurpose this plugin to
    // load webpack chunks instead by overriding the default request behavior
    // it's easier to use webpack in our current CRA to dynamically import a JSON with the translations
    // than to update and serve a static folder with JSON files on the CDN with cache invalidation
    try {
      const [lng] = url.split("|");

      // this mocks the HTTP fetch plugin behavior so it works with the backend AJAX pattern in this XHR library
      // https://github.com/i18next/i18next-http-backend/blob/master/lib/request.js#L56
      loadLocaleBundle(lng).then((data: any) => {
        callback(null, {
          data: JSON.stringify(data),
          status: 200, // status code is required by XHR plugin to determine success or failure
        });
      });
    } catch (e) {
      console.error(e);
      callback(null, {
        status: 500,
      });
    }
  },
};
const langDetectorOptions = {
  // order and from where user language should be detected
  order: ["cookie", "localStorage", "navigator"],

  // keys or params to lookup language from
  lookupCookie: "locale",
  lookupLocalStorage: "locale",

  // cache user language on
  caches: ["localStorage", "cookie"],
  excludeCacheFor: ["cimode"], // languages to not persist (cookie, localStorage)

  // only detect languages that are in the whitelist
  checkWhitelist: true,
};

const isDev = process.env.NODE_ENV === "development";

i18n.use(LanguageDetector).use(initReactI18next); // passes i18n down to react-i18next
if (!isDev) {
  i18n.use(HttpApi);
}
console.log("dd", defaultBundle);

const packResources = (bundleContent: any) => ({
  [DEFAULT_LOCALE]: { translation: bundleContent },
});
const defaultResources = packResources(defaultBundle);

i18n.init({
  resources: isDev ? defaultResources : undefined,
  lng: DEFAULT_LOCALE, // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
  whitelist: availableLocales, // available languages for browser dector to pick from
  fallbackLng: false,
  detection: langDetectorOptions,
  // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
  // if you're using a language detector, do not define the lng option
  interpolation: {
    escapeValue: false, // react already safes from xss
    format: function (value, format, lng) {
      if (format === "en-handle-an")
        return !lng || lng === "en" ? getVariationOfAOrAn(value, false) : "";
      if (format === "en-handle-an-capitalized")
        return !lng || lng === "en" ? getVariationOfAOrAn(value, true) : "";
      return value;
    },
  },
  backend: backendOptions as any,
});

console.log(i18n);

export default i18n;

if (isDev && (module as any).hot) {
  (module as any).hot.accept("./locales/en.json", (stuff: any) => {
    const newBundle = require("./locales/en.json");
    console.log("aaa", stuff, newBundle);
    i18n.removeResourceBundle(DEFAULT_LOCALE, "translation");
    i18n.addResourceBundle(DEFAULT_LOCALE, "translation", newBundle);
    i18n.reloadResources(["en"]).finally();
    i18n.changeLanguage(DEFAULT_LOCALE).finally();
  });
}
