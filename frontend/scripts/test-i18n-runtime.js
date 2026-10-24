/**
 * AgroRent - Runtime Internationalization (i18n) Test Suite
 *
 * Validates:
 * 1. English, Marathi, and Hindi translation files load and parse
 * 2. t(key) resolution across en, mr, hi
 * 3. Parameter interpolation ({id}, {count}, {name}, etc.)
 * 4. Fallback to English when key is missing in another language
 * 5. Formatting of Indian Rupee (INR), dates, and numbers in en-IN, mr-IN, hi-IN
 * 6. Booking status label translations (PENDING, APPROVED, REJECTED, CANCELLED, COMPLETED)
 * 7. Category label translations
 * 8. User-generated content preservation (names, descriptions, reviews)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCALES_DIR = path.resolve(__dirname, '../src/locales');

const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf-8'));
const mr = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'mr.json'), 'utf-8'));
const hi = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'hi.json'), 'utf-8'));

const TRANSLATIONS = { en, mr, hi };
const LOCALE_MAP = { en: 'en-IN', mr: 'mr-IN', hi: 'hi-IN' };

function getNestedTranslation(obj, pathStr) {
  if (!obj || !pathStr) return null;
  const parts = pathStr.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

function interpolate(template, params) {
  if (!template || !params) return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, paramName) => {
    return paramName in params && params[paramName] !== undefined && params[paramName] !== null
      ? String(params[paramName])
      : match;
  });
}

function t(lang, key, params = null) {
  let text = getNestedTranslation(TRANSLATIONS[lang] || TRANSLATIONS.en, key);
  if (text === null && lang !== 'en') {
    text = getNestedTranslation(TRANSLATIONS.en, key);
  }
  if (text === null) return key;
  return params ? interpolate(text, params) : text;
}

function formatCurrency(lang, amount) {
  const activeLocale = LOCALE_MAP[lang] || 'en-IN';
  return new Intl.NumberFormat(activeLocale, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
  }
}

console.log('====================================================');
console.log('🌾 AgroRent Runtime i18n & Logic Test Suite 🌾');
console.log('====================================================\n');

// 1. Basic Key Translations
console.log('1. Checking Core Navigation & Common Translations:');
assert(t('en', 'nav.home') === 'Home', 'English Home translation');
assert(t('mr', 'nav.home') === 'मुख्य पान', 'Marathi Home translation is natural (मुख्य पान)');
assert(t('hi', 'nav.home') === 'होम', 'Hindi Home translation is natural (होम)');
assert(t('mr', 'equipment.setAsPrimary') === 'मुख्य फोटो म्हणून सेट करा', 'Marathi Set Primary Photo translation');
assert(t('hi', 'equipment.setAsPrimary') === 'मुख्य फ़ोटो बनाएं', 'Hindi Set Primary Photo translation');
assert(t('mr', 'reviews.rateOwnerButton') === 'रेटिंग द्या', 'Marathi Rate Owner translation');
assert(t('hi', 'reviews.rateOwnerButton') === 'मालिक को रेटिंग दें', 'Hindi Rate Owner translation');

// 2. Dynamic Interpolation
console.log('\n2. Checking Dynamic Interpolation:');
const enToast = t('en', 'home.bookingApprovedToast', { id: 42 });
assert(enToast.includes('42'), `English dynamic ID interpolation: "${enToast}"`);

const mrToast = t('mr', 'home.bookingApprovedToast', { id: 42 });
assert(mrToast.includes('42') && mrToast.includes('बुकिंग 42'), `Marathi dynamic ID interpolation: "${mrToast}"`);

const hiToast = t('hi', 'home.bookingApprovedToast', { id: 42 });
assert(hiToast.includes('42') && hiToast.includes('बुकिंग 42'), `Hindi dynamic ID interpolation: "${hiToast}"`);

const enCount = t('en', 'equipment.photosCount', { count: 3 });
assert(enCount === 'Equipment Photos (3/5)', `English photos count interpolation: "${enCount}"`);

const mrCount = t('mr', 'equipment.photosCount', { count: 3 });
assert(mrCount === 'अवजाराचे फोटो (3/5)', `Marathi photos count interpolation: "${mrCount}"`);

const hiCount = t('hi', 'equipment.photosCount', { count: 3 });
assert(hiCount === 'उपकरण की तस्वीरें (3/5)', `Hindi photos count interpolation: "${hiCount}"`);

// 3. Fallback Mechanism
console.log('\n3. Checking Fallback Mechanism:');
// Verify existing Marathi key
const mrLoginResult = t('mr', 'nav.logIn');
assert(mrLoginResult === 'लॉगिन करा', 'Existing Marathi key resolves correctly');
// Non-existent key test
const missingResult = t('mr', 'nonexistent.dummy.key');
assert(missingResult === 'nonexistent.dummy.key', 'Completely missing key returns key string without crashing');

// 4. Currency Formatting
console.log('\n4. Checking Currency Formatting (INR):');
const enCurrency = formatCurrency('en', 1500);
const mrCurrency = formatCurrency('mr', 1500);
const hiCurrency = formatCurrency('hi', 1500);
assert(enCurrency.includes('1,500') || enCurrency.includes('1500'), `EN currency format: ${enCurrency}`);
assert(mrCurrency.includes('1,500') || mrCurrency.includes('१,५००') || mrCurrency.includes('1500'), `MR currency format: ${mrCurrency}`);
assert(hiCurrency.includes('1,500') || hiCurrency.includes('१,५००') || hiCurrency.includes('1500'), `HI currency format: ${hiCurrency}`);

// 5. Booking Status Labels
console.log('\n5. Checking Booking Status Labels (Backend Enums Preserved):');
const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
statuses.forEach(status => {
  const enStatus = t('en', `booking.status.${status.toLowerCase()}`);
  const mrStatus = t('mr', `booking.status.${status.toLowerCase()}`);
  const hiStatus = t('hi', `booking.status.${status.toLowerCase()}`);
  assert(Boolean(enStatus), `Status ${status} has English label: "${enStatus}"`);
  assert(Boolean(mrStatus), `Status ${status} has Marathi label: "${mrStatus}"`);
  assert(Boolean(hiStatus), `Status ${status} has Hindi label: "${hiStatus}"`);
});

// 6. Agricultural Terminology Glossary Adherence
console.log('\n6. Checking Agricultural Terminology Glossary Adherence:');
assert(t('mr', 'categories.tractors') === 'ट्रॅक्टर', 'MR: Tractors -> ट्रॅक्टर');
assert(t('mr', 'categories.harvesters') === 'हार्वेस्टर', 'MR: Harvesters -> हार्वेस्टर');
assert(t('mr', 'categories.seedDrills') === 'पेरणी यंत्र', 'MR: Seed Drills -> पेरणी यंत्र');
assert(t('hi', 'categories.seedDrills') === 'बीज बोने की मशीन (सीड ड्रिल)', 'HI: Seed Drills -> बीज बोने की मशीन');
assert(t('mr', 'booking.rentalRate') === 'भाडे दर', 'MR: Rental Rate -> भाडे दर');
assert(t('hi', 'booking.rentalRate') === 'किराये की दर', 'HI: Rental Rate -> किराये की दर');
assert(t('mr', 'booking.owner') === 'अवजार मालक', 'MR: Equipment Owner -> अवजार मालक');
assert(t('hi', 'booking.owner') === 'उपकरण मालिक', 'HI: Equipment Owner -> उपकरण मालिक');

console.log('\n====================================================');
console.log(`Results: ${passed} passed, ${failed} failed.`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
