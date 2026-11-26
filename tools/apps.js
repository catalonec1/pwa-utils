/* Single source of truth for each app's manifest, icon and service-worker asset list. */
module.exports = {
  version: '1.1.0',
  publisher: { commonName: 'CN=8129DE1D-E375-4EC4-9809-6CF037A07B8F', displayName: 'catalonec' },
  baseUrl: 'https://catalonec1.github.io/pwa-utils/',
  apps: [
    {
      dir: 'convertor',
      storeId: '9NKDXSGJXFS8',
      packageId: 'catalonec.StelarUnitConverter',
      id: 'quick-unit-converter',
      name: 'Stelar Unit Converter',
      short_name: 'Converter',
      description: 'Fast offline unit converter in English, Romanian and Russian: length, mass, temperature, volume, area, speed, time and data. Pro adds pressure, energy, power, angle, fuel economy, frequency, torque, density, flow rate and history.',
      categories: ['utilities', 'productivity', 'education'],
      color: '#3d5afe',
      glyph: '⇄',
      assets: ['./', 'index.html', 'app.js', 'logic.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', '../shared/core.js', '../shared/base.css']
    },
    {
      dir: 'focus',
      storeId: '9P8JPQ1HQM9M',
      packageId: 'catalonec.StelarFocusTimer',
      id: 'focus-timer-pomodoro',
      name: 'Stelar Focus Timer',
      short_name: 'Focus',
      description: 'Simple offline Pomodoro focus timer with work and break cycles, sounds, daily goal and streak. In English, Romanian and Russian. Pro adds custom durations, 7-day statistics and CSV export.',
      categories: ['productivity', 'utilities', 'education'],
      color: '#e8590c',
      glyph: '◔',
      assets: ['./', 'index.html', 'app.js', 'logic.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', '../shared/core.js', '../shared/base.css']
    },
    {
      dir: 'text',
      storeId: '9PKZ9VZS4TNS',
      packageId: 'catalonec.StelarTextToolbox',
      id: 'text-toolbox',
      name: 'Stelar Text Toolbox',
      short_name: 'Text Tools',
      description: 'Offline text tools: word and character count, change case, sort and deduplicate lines, trim spaces, remove diacritics, slugs. In English, Romanian and Russian. Pro adds regex find and replace, Base64, URL encoding, JSON formatting, CSV ↔ JSON, email and link extraction and word frequency.',
      categories: ['productivity', 'utilities', 'developer tools'],
      color: '#0b7a75',
      glyph: 'Aa',
      assets: ['./', 'index.html', 'app.js', 'logic.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', '../shared/core.js', '../shared/base.css']
    },
    {
      dir: 'pass',
      storeId: '9PL4BH4S7XD8',
      packageId: 'catalonec.StelarPasswordGenerator',
      id: 'password-generator',
      name: 'Stelar Password Generator',
      short_name: 'Passwords',
      description: 'Offline password generator: strong random passwords, strength meter and a private password check. In English, Romanian and Russian. Pro adds passphrases, PINs, easy-to-say passwords, lists of up to 500 and CSV export.',
      categories: ['security', 'utilities', 'productivity'],
      color: '#7048e8',
      glyph: '•••',
      assets: ['./', 'index.html', 'app.js', 'logic.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', '../shared/core.js', '../shared/base.css']
    },
    {
      dir: 'days',
      storeId: '9PNQKZ2WFKBL',
      packageId: 'catalonec.StelarDateCalculator',
      id: 'date-calculator',
      name: 'Stelar Date Calculator',
      short_name: 'Dates',
      description: 'Offline date calculator: days between two dates, add or subtract days, weeks, months and years, weekday, ISO week and day of year. In English, Romanian and Russian. Pro adds working days with your own days off, adding working days, saved countdowns and CSV export.',
      categories: ['productivity', 'utilities', 'business'],
      color: '#1971c2',
      glyph: '31',
      assets: ['./', 'index.html', 'app.js', 'logic.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', '../shared/core.js', '../shared/base.css']
    },
    {
      dir: 'pct',
      storeId: '9NC4DKKGTSD2',
      packageId: 'catalonec.StelarPercentageCalculator',
      id: 'percentage-calculator',
      name: 'Stelar Percentage Calculator',
      short_name: 'Percent',
      description: 'Offline percentage calculator: percent of a number, what percent, percent change, increase or decrease and discounts. In English, Romanian and Russian. Pro adds VAT and sales tax, tip and bill split, margin and markup, compound growth and a history with CSV export.',
      categories: ['utilities', 'productivity', 'business'],
      color: '#2b8a3e',
      glyph: '%',
      assets: ['./', 'index.html', 'app.js', 'logic.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', '../shared/core.js', '../shared/base.css']
    },
    {
      dir: 'ora',
      storeId: '9PPJVN0L6MZL',
      packageId: 'catalonec.ORAErrorHelper',
      id: 'ora-error-helper',
      name: 'ORA Error Helper',
      short_name: 'ORA Errors',
      description: 'Offline Oracle error lookup: search ORA- and PLS- codes or paste an error stack to see every error in it, with plain-language causes and fixes for common errors. In English, Romanian and Russian. Pro adds causes and fixes for all 251 errors, favorites and copy as Markdown.',
      categories: ['developer tools', 'utilities', 'productivity'],
      color: '#c92a2a',
      glyph: 'ORA',
      assets: ['./', 'index.html', 'app.js', 'logic.js', 'data.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', '../shared/core.js', '../shared/base.css']
    },
    {
      dir: 'color',
      storeId: 'TBD',
      packageId: 'TBD',
      id: 'color-converter',
      name: 'Stelar Color Converter',
      short_name: 'Colors',
      description: 'Offline color converter: HEX, RGB, HSL, HWB, CMYK, color picker and WCAG contrast checker. Pro adds palettes, OKLCH and LAB, CSS color names, saved palettes with export and colorblind previews.',
      categories: ['developer tools', 'utilities', 'productivity'],
      color: '#c2255c',
      glyph: 'RGB',
      assets: ['./', 'index.html', 'app.js', 'logic.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', '../shared/core.js', '../shared/base.css']
    }
  ]
};
