/**
 * Secure cryptographic utilities for password generation.
 */

/**
 * Returns a secure random unsigned 32-bit integer.
 */
function getSecureRandomUint32() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0];
}

/**
 * Returns a secure random integer between 0 (inclusive) and max (exclusive).
 * Uses rejection sampling to completely avoid modulo bias.
 * 
 * @param {number} max - The exclusive upper bound.
 * @returns {number} A random integer in [0, max).
 */
export function getSecureRandomInt(max) {
  if (max <= 0) return 0;
  if (max === 1) return 0;
  
  // 32-bit unsigned int maximum value
  const maxUint32 = 4294967295; 
  // Calculate the maximum unbiased value
  const maxUnbiased = maxUint32 - (maxUint32 % max);
  
  let randomValue;
  do {
    randomValue = getSecureRandomUint32();
  } while (randomValue >= maxUnbiased);
  
  return randomValue % max;
}

/**
 * Securely shuffles an array in place using the Fisher-Yates algorithm.
 * 
 * @param {Array} array - The array to shuffle.
 * @returns {Array} The shuffled array.
 */
export function secureShuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Picks a random character from a string securely.
 * 
 * @param {string} str - The string to pick from.
 * @returns {string} A randomly selected character.
 */
export function pickRandomChar(str) {
  if (!str) return '';
  return str[getSecureRandomInt(str.length)];
}
