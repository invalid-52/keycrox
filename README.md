# KEYCROX
### Secure Password Generator

> KEYCROX is a privacy-first password generation tool designed to create strong passwords locally in the browser using cryptographically secure randomness.

## Overview

KEYCROX is designed to be a completely self-contained, client-side tool. It relies solely on your device's cryptographically secure random number generator (`crypto.getRandomValues`) to produce strong passwords or passphrases.

## Features

- **Random Password Generation**: Generate passwords from 8 to 128 characters.
- **Passphrase Mode**: Generate memorable passphrases using a secure wordlist.
- **Strict Character Constraints**: Guaranteed inclusion of selected character categories.
- **Advanced Exclusions**: Exclude visually similar characters (`0`, `O`, `1`, `l`, `I`) or ambiguous symbols.
- **Strength & Entropy Indicators**: Real-time evaluation of password entropy (in bits).
- **Privacy-First**: No data collection, no telemetry, no network requests.
- **Responsive & Accessible**: Works perfectly on mobile and desktop, with full keyboard navigation support.
- **Light/Dark Mode**: Automatic theme switching based on system preferences.

## Security Model

KEYCROX is built with security as its primary goal:

- **100% Client-Side**: No backend infrastructure. Passwords never leave your device.
- **Cryptographic Randomness**: We never use `Math.random()`. All randomness is derived from the Web Crypto API (`window.crypto.getRandomValues`).
- **Unbiased Selection**: The application uses mathematical rejection sampling to completely eliminate modulo bias, ensuring every character has an exactly equal probability of selection.
- **No Persistence**: Passwords are not stored in `localStorage`, cookies, or history.

## How Passwords Are Generated

1. The character pool is dynamically constructed based on user preferences.
2. If specific character categories (e.g., uppercase, symbols) are required, the generator securely picks one character from each category first to guarantee compliance.
3. The remaining characters are selected from the entire permitted pool.
4. The final array of characters is securely shuffled using the Fisher-Yates algorithm and a cryptographically secure random number generator.

## Entropy Calculation

Entropy is honestly calculated based on the generated password length and the true size of the character pool:
`Entropy = Length * log2(Pool Size)`

For passphrases, entropy is calculated based on the number of words selected and the size of the wordlist:
`Entropy = Word Count * log2(Wordlist Size)`

## Tech Stack

- **React 18**
- **Vite**
- **Plain CSS**

## Getting Started

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the local development server:
```bash
npm run dev
```

### Production Build

Create a production-ready build:
```bash
npm run build
```
The output will be placed in the `dist` directory. You can host this directory on any static web host.

## Disclaimer

This software is provided "as is", without warranty of any kind. While designed to produce cryptographically strong passwords, no application can guarantee absolute security. Always store your generated passwords in a reputable password manager.

---

**Crafted by RHLISVERSE**
