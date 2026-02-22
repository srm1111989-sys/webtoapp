// Simple i18n setup - can be expanded with react-i18next later
const translations: Record<string, Record<string, string>> = {
  en: {
    'app.name': 'WebToApp',
    'app.tagline': 'Convert any website into a native Android app',
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.login': 'Login',
    'nav.register': 'Get Started',
    'nav.dashboard': 'Dashboard',
    'hero.title': 'Convert Any Website Into a Native Android App',
    'hero.subtitle': 'Turn your website into a feature-rich Android app in minutes.',
    'hero.cta': 'Get Started Free',
  },
  hi: {
    'app.name': 'WebToApp',
    'app.tagline': 'किसी भी वेबसाइट को Android ऐप में बदलें',
    'nav.features': 'विशेषताएं',
    'nav.pricing': 'मूल्य निर्धारण',
    'nav.login': 'लॉगिन',
    'nav.register': 'शुरू करें',
    'nav.dashboard': 'डैशबोर्ड',
    'hero.title': 'किसी भी वेबसाइट को Android ऐप में बदलें',
    'hero.subtitle': 'अपनी वेबसाइट को मिनटों में एक फीचर-युक्त Android ऐप में बदलें।',
    'hero.cta': 'मुफ्त में शुरू करें',
  },
}

let currentLocale = 'en'

export function setLocale(locale: string) {
  currentLocale = locale
}

export function t(key: string): string {
  return translations[currentLocale]?.[key] || translations.en?.[key] || key
}

export function getLocale(): string {
  return currentLocale
}
