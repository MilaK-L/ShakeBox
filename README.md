# ShakeBox
Math game for kids

Shake the box, peek into one side, and figure out how many balls are hiding on the other side. It's a way to practise splitting numbers (8 = 3 + ?). English and German.

Plain HTML/CSS/JS with no build step. It's an installable PWA that works offline.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Service workers need `localhost` or HTTPS, so opening `index.html` directly from disk won't give you offline mode.

## Files

- `index.html`: app shell
- `css/style.css`: all styling and animations
- `js/app.js`: game logic, rendering, i18n, device-shake detection
- `sw.js`: offline cache. Bump `CACHE` when you ship changes.
- `manifest.webmanifest`, `icons/`: PWA install metadata
