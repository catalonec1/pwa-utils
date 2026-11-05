/* Single source of truth for each app's manifest, icon and service-worker asset list. */
module.exports = {
  version: '1.0.2',
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
      description: 'Fast offline unit converter in English, Romanian and Russian: length, mass, temperature, volume, area, speed, time and data. Pro adds pressure, energy, power, angle, fuel economy, frequency, torque and history.',
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
      description: 'Simple offline Pomodoro focus timer with work and break cycles, sounds and daily focus count. In English, Romanian and Russian. Pro adds custom durations, 7-day statistics and CSV export.',
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
      description: 'Offline text tools: word and character count, change case, sort and deduplicate lines, trim spaces, remove diacritics, slugs. In English, Romanian and Russian. Pro adds regex find and replace, Base64, URL encoding and JSON formatting.',
      categories: ['productivity', 'utilities', 'developer tools'],
      color: '#0b7a75',
      glyph: 'Aa',
      assets: ['./', 'index.html', 'app.js', 'logic.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', '../shared/core.js', '../shared/base.css']
    }
  ]
};
