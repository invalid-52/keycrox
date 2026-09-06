import { getSecureRandomInt, secureShuffleArray, pickRandomChar } from './crypto';
import { WORDLIST } from './words';

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

const SIMILAR_CHARS = '0O1lI|`';
const AMBIGUOUS_CHARS = '{}[]()/\\\'"`~,;:.<>';

// Helper to calc entropy
function calcEntropy(poolSize, length) {
  if (poolSize <= 0 || length === 0) return 0;
  return Math.round(length * Math.log2(poolSize));
}

// Evaluate strength based on bits
function evaluateEntropyScore(entropy) {
  if (entropy >= 100) return { score: 4, label: 'Very Strong' };
  if (entropy >= 75) return { score: 3, label: 'Strong' };
  if (entropy >= 50) return { score: 2, label: 'Good' };
  if (entropy >= 35) return { score: 1, label: 'Fair' };
  return { score: 1, label: 'Weak' };
}

export function calculateStrength(password, options, mode = 'random') {
  if (!password && mode !== 'analyze') return { score: 0, label: 'None', entropy: 0, poolSize: 0, details: [] };

  let entropy = 0;
  let poolSize = 0;
  let details = [];

  if (mode === 'passphrase') {
    const wordCount = password.split(options.separator || '-').length;
    entropy = Math.round(wordCount * Math.log2(WORDLIST.length));
    poolSize = WORDLIST.length;
  } else if (mode === 'pin') {
    poolSize = 10;
    entropy = calcEntropy(poolSize, password.length);
  } else if (mode === 'token') {
    if (options.type === 'hex') poolSize = 16;
    else if (options.type === 'base64url') poolSize = 64;
    else poolSize = 62; // alphanumeric
    entropy = calcEntropy(poolSize, password.length);
  } else if (mode === 'memorable') {
    // Memorable is words + numbers/symbols
    const words = password.replace(/[0-9!@#$%^&*()_+\-=[\]{}|;:,.<>?]/g, ' ').trim().split(' ').filter(Boolean);
    const nonWords = password.replace(/[a-zA-Z]/g, '');
    let e1 = words.length * Math.log2(WORDLIST.length);
    let e2 = nonWords.length * Math.log2(20); // rough estimate for symbols+numbers
    entropy = Math.round(e1 + e2);
    poolSize = WORDLIST.length;
  } else if (mode === 'analyze') {
    // Local analyzer
    if (!password) return { score: 0, label: 'None', entropy: 0, poolSize: 0, details: [] };
    
    let hasUpper = /[A-Z]/.test(password);
    let hasLower = /[a-z]/.test(password);
    let hasNum = /[0-9]/.test(password);
    let hasSym = /[^A-Za-z0-9]/.test(password);
    
    if (hasUpper) poolSize += 26;
    if (hasLower) poolSize += 26;
    if (hasNum) poolSize += 10;
    if (hasSym) poolSize += 32;
    
    if (poolSize === 0) poolSize = 1;
    entropy = calcEntropy(poolSize, password.length);
    
    details.push({ label: 'Length', value: password.length });
    details.push({ label: 'Uppercase', value: hasUpper ? 'Yes' : 'No', pass: hasUpper });
    details.push({ label: 'Lowercase', value: hasLower ? 'Yes' : 'No', pass: hasLower });
    details.push({ label: 'Numbers', value: hasNum ? 'Yes' : 'No', pass: hasNum });
    details.push({ label: 'Symbols', value: hasSym ? 'Yes' : 'No', pass: hasSym });
    
    if (/^[0-9]+$/.test(password)) {
      details.push({ label: 'Warning', value: 'Numeric only (PIN)', warning: true });
    }
    if (/(.)\1{2,}/.test(password)) {
      details.push({ label: 'Warning', value: 'Repeated characters detected', warning: true });
    }
    
  } else {
    // Random Password
    if (options.uppercase) poolSize += CHAR_SETS.uppercase.length;
    if (options.lowercase) poolSize += CHAR_SETS.lowercase.length;
    if (options.numbers) poolSize += CHAR_SETS.numbers.length;
    if (options.symbols) poolSize += CHAR_SETS.symbols.length;

    if (options.excludeSimilar) poolSize = Math.max(1, poolSize - SIMILAR_CHARS.length);
    if (options.excludeAmbiguous) poolSize = Math.max(1, poolSize - AMBIGUOUS_CHARS.length);
    
    if (poolSize <= 0) poolSize = 1;
    entropy = calcEntropy(poolSize, password.length);
  }

  const { score, label } = evaluateEntropyScore(entropy);
  
  return { score, label, entropy, poolSize, details };
}

export function generatePassword(length, options) {
  const { uppercase, lowercase, numbers, symbols, excludeSimilar, excludeAmbiguous } = options;

  let upperSet = CHAR_SETS.uppercase;
  let lowerSet = CHAR_SETS.lowercase;
  let numberSet = CHAR_SETS.numbers;
  let symbolSet = CHAR_SETS.symbols;

  if (excludeSimilar) {
    const similarRegex = new RegExp(`[${SIMILAR_CHARS.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')}]`, 'g');
    upperSet = upperSet.replace(similarRegex, '');
    lowerSet = lowerSet.replace(similarRegex, '');
    numberSet = numberSet.replace(similarRegex, '');
    symbolSet = symbolSet.replace(similarRegex, '');
  }
  
  if (excludeAmbiguous) {
    const ambiguousRegex = new RegExp(`[${AMBIGUOUS_CHARS.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')}]`, 'g');
    upperSet = upperSet.replace(ambiguousRegex, '');
    lowerSet = lowerSet.replace(ambiguousRegex, '');
    numberSet = numberSet.replace(ambiguousRegex, '');
    symbolSet = symbolSet.replace(ambiguousRegex, '');
  }

  let pool = '';
  const requiredChars = [];

  if (uppercase && upperSet.length > 0) { pool += upperSet; requiredChars.push(pickRandomChar(upperSet)); }
  if (lowercase && lowerSet.length > 0) { pool += lowerSet; requiredChars.push(pickRandomChar(lowerSet)); }
  if (numbers && numberSet.length > 0) { pool += numberSet; requiredChars.push(pickRandomChar(numberSet)); }
  if (symbols && symbolSet.length > 0) { pool += symbolSet; requiredChars.push(pickRandomChar(symbolSet)); }

  if (!pool) return '';
  
  let passwordChars = [];
  
  if (length >= requiredChars.length) {
    passwordChars = [...requiredChars];
    for (let i = requiredChars.length; i < length; i++) {
      passwordChars.push(pickRandomChar(pool));
    }
    passwordChars = secureShuffleArray(passwordChars);
  } else {
    for (let i = 0; i < length; i++) {
      passwordChars.push(pickRandomChar(pool));
    }
  }

  return passwordChars.join('');
}

export function generatePassphrase(wordCount = 4, separator = '-', capitalize = false, includeNumber = false) {
  if (!WORDLIST || WORDLIST.length === 0) return '';
  const words = [];
  for (let i = 0; i < wordCount; i++) {
    let word = WORDLIST[getSecureRandomInt(WORDLIST.length)];
    if (capitalize) word = word.charAt(0).toUpperCase() + word.slice(1);
    words.push(word);
  }
  if (includeNumber) {
    words[words.length - 1] = words[words.length - 1] + getSecureRandomInt(100).toString();
  }
  return words.join(separator);
}

export function generatePin(length = 6, excludeRepeated = false, excludeSequential = false) {
  let pin = '';
  let attempts = 0;
  
  while (pin.length < length && attempts < 1000) {
    attempts++;
    let currentPin = '';
    for(let i=0; i<length; i++) {
      currentPin += getSecureRandomInt(10).toString();
    }
    
    if (excludeRepeated && /(.)\1{2,}/.test(currentPin)) continue;
    if (excludeSequential && /(012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)/.test(currentPin)) continue;
    
    pin = currentPin;
    break;
  }
  
  return pin || '000000'.slice(0, length);
}

export function generateToken(length = 32, type = 'alphanumeric') {
  let pool = '';
  if (type === 'hex') {
    pool = '0123456789abcdef';
  } else if (type === 'base64url') {
    pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  } else {
    pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  }
  
  let token = '';
  for(let i=0; i<length; i++) {
    token += pickRandomChar(pool);
  }
  return token;
}

export function generateMemorable(wordCount = 2, includeNumber = true, includeSymbol = true) {
  let pwd = '';
  const symbols = '!@#$%^&*';
  for (let i = 0; i < wordCount; i++) {
    let word = WORDLIST[getSecureRandomInt(WORDLIST.length)];
    word = word.charAt(0).toUpperCase() + word.slice(1);
    pwd += word;
    if (i < wordCount - 1) {
      if (includeNumber) pwd += getSecureRandomInt(100).toString();
      if (includeSymbol) pwd += pickRandomChar(symbols);
    }
  }
  return pwd;
}
