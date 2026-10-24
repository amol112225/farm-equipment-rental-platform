/**
 * AgroRent - Translation Completeness Validation Script
 *
 * Compares en.json, mr.json, and hi.json translation dictionaries.
 * Enforces:
 * 1. Valid JSON format
 * 2. Exact match of keys across all three languages
 * 3. Detection of missing keys in Marathi and Hindi
 * 4. Detection of extraneous / inconsistent keys
 * 5. Detection of empty strings, null, or undefined values
 * 6. Verification of dynamic interpolation parameters (e.g. {count}, {name})
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.resolve(__dirname, '../src/locales');
const FILES = {
  en: path.join(LOCALES_DIR, 'en.json'),
  mr: path.join(LOCALES_DIR, 'mr.json'),
  hi: path.join(LOCALES_DIR, 'hi.json'),
};

function readJsonFile(filePath, lang) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Translation file for language "${lang}" does not exist at: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`Invalid JSON syntax in ${lang}.json: ${err.message}`);
  }
}

function flattenKeys(obj, prefix = '') {
  let result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenKeys(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

function extractPlaceholders(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{([a-zA-Z0-9_]+)\}/g);
  return matches ? matches.map(m => m.slice(1, -1)).sort() : [];
}

function runValidation() {
  console.log('====================================================');
  console.log('🌾 AgroRent Translation Validation (en, mr, hi) 🌾');
  console.log('====================================================\n');

  let hasErrors = false;
  const errors = [];
  const parsed = {};
  const flattened = {};

  // 1. Check file existence and JSON validity
  for (const [lang, filePath] of Object.entries(FILES)) {
    try {
      parsed[lang] = readJsonFile(filePath, lang);
      flattened[lang] = flattenKeys(parsed[lang]);
      const keyCount = Object.keys(flattened[lang]).length;
      console.log(`✓ [${lang.toUpperCase()}] Valid JSON loaded (${keyCount} keys).`);
    } catch (err) {
      errors.push(`[${lang.toUpperCase()}] ${err.message}`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error('\n❌ Translation validation failed during JSON parsing:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  const enKeys = new Set(Object.keys(flattened.en));
  const mrKeys = new Set(Object.keys(flattened.mr));
  const hiKeys = new Set(Object.keys(flattened.hi));

  console.log(`\nInspecting ${enKeys.size} translation keys across all language files...`);

  // 2. Check for missing keys in mr and hi
  const missingMr = [...enKeys].filter(k => !mrKeys.has(k));
  const missingHi = [...enKeys].filter(k => !hiKeys.has(k));

  if (missingMr.length > 0) {
    hasErrors = true;
    errors.push(`Missing Marathi (mr) keys (${missingMr.length}):\n    ${missingMr.slice(0, 10).join('\n    ')}${missingMr.length > 10 ? `\n    ...and ${missingMr.length - 10} more` : ''}`);
  }

  if (missingHi.length > 0) {
    hasErrors = true;
    errors.push(`Missing Hindi (hi) keys (${missingHi.length}):\n    ${missingHi.slice(0, 10).join('\n    ')}${missingHi.length > 10 ? `\n    ...and ${missingHi.length - 10} more` : ''}`);
  }

  // 3. Check for extra keys in mr and hi
  const extraMr = [...mrKeys].filter(k => !enKeys.has(k));
  const extraHi = [...hiKeys].filter(k => !enKeys.has(k));

  if (extraMr.length > 0) {
    hasErrors = true;
    errors.push(`Extra Marathi (mr) keys not found in en.json (${extraMr.length}):\n    ${extraMr.join('\n    ')}`);
  }

  if (extraHi.length > 0) {
    hasErrors = true;
    errors.push(`Extra Hindi (hi) keys not found in en.json (${extraHi.length}):\n    ${extraHi.join('\n    ')}`);
  }

  // 4. Check for empty translation values
  for (const lang of ['en', 'mr', 'hi']) {
    const emptyKeys = [];
    for (const [key, value] of Object.entries(flattened[lang])) {
      if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
        emptyKeys.push(key);
      }
    }
    if (emptyKeys.length > 0) {
      hasErrors = true;
      errors.push(`Empty or null values in ${lang}.json (${emptyKeys.length}):\n    ${emptyKeys.join('\n    ')}`);
    }
  }

  // 5. Check placeholder consistency
  for (const key of enKeys) {
    const enParams = extractPlaceholders(flattened.en[key]);
    if (enParams.length > 0) {
      if (flattened.mr[key]) {
        const mrParams = extractPlaceholders(flattened.mr[key]);
        const missingInMr = enParams.filter(p => !mrParams.includes(p));
        if (missingInMr.length > 0) {
          hasErrors = true;
          errors.push(`Placeholder mismatch in Marathi key "${key}": missing {${missingInMr.join(', ')}}`);
        }
      }
      if (flattened.hi[key]) {
        const hiParams = extractPlaceholders(flattened.hi[key]);
        const missingInHi = enParams.filter(p => !hiParams.includes(p));
        if (missingInHi.length > 0) {
          hasErrors = true;
          errors.push(`Placeholder mismatch in Hindi key "${key}": missing {${missingInHi.join(', ')}}`);
        }
      }
    }
  }

  console.log('----------------------------------------------------');
  if (hasErrors) {
    console.error('❌ TRANSLATION VALIDATION FAILED WITH ERRORS:\n');
    errors.forEach((err, idx) => {
      console.error(`${idx + 1}. ${err}\n`);
    });
    process.exit(1);
  } else {
    console.log('🎉 ALL TRANSLATION VALIDATION CHECKS PASSED!');
    console.log(`- Exact key match: ${enKeys.size} keys in English, Marathi, and Hindi.`);
    console.log('- 0 missing keys in Marathi.');
    console.log('- 0 missing keys in Hindi.');
    console.log('- 0 extra or inconsistent keys.');
    console.log('- 0 empty values.');
    console.log('- All dynamic interpolation placeholders match perfectly.');
    console.log('====================================================\n');
    process.exit(0);
  }
}

runValidation();
