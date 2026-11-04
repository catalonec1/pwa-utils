# Small Offline Tools (PWA)

Three small offline web apps for the Microsoft Store, in English, Romanian and Russian:

| Folder | App | Free | Pro (Store add-on `pro`) |
|---|---|---|---|
| `convertor/` | Quick Unit Converter | 8 categories | pressure, energy, power, angle, fuel + history |
| `focus/` | Focus Timer – Pomodoro | 25/5/15 timer, sound, daily count | custom durations, 7-day chart, CSV |
| `text/` | Text Toolbox | counts, case, sort, dedupe, slug… | regex replace, Base64, URL, JSON |

- `npm test` — unit tests (node:test) + browser tests (Playwright, incl. offline and Pro stub).
- `npm run build` — regenerates manifests, service workers and icons from `tools/apps.js`.
- `npm run shots` — regenerates manifest and Store screenshots.
- `store/` — Store listing texts and screenshots. `privacy.html` — privacy policy URL for the Store.

Pro uses the Digital Goods API with the Microsoft Store billing service; on the plain web, Pro stays locked.
