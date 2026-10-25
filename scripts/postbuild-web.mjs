// Runs after `expo export -p web`. Turns the export into an installable
// "Add to Home Screen" web app and makes it work on GitHub Pages.
//
// usage: EXPO_BASE_URL=/nibble node scripts/postbuild-web.mjs [dist]
import fs from 'node:fs';
import path from 'node:path';

const dist = process.argv[2] ?? 'dist';
const base = (process.env.EXPO_BASE_URL ?? '').replace(/\/$/, '');
const BG = '#FFF8EE';

const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const head = `
    <meta name="theme-color" content="${BG}" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Nibble" />
    <meta name="description" content="Track calories, macros and water with a little red panda." />
    <link rel="apple-touch-icon" href="${base}/apple-touch-icon.png" />
    <link rel="manifest" href="${base}/manifest.webmanifest" />
    <style>
      html, body { background: ${BG}; overscroll-behavior: none; -webkit-tap-highlight-color: transparent; }
      body { -webkit-user-select: none; user-select: none; }
      input, textarea { -webkit-user-select: text; user-select: text; }
    </style>
  `;

html = html
  // viewport-fit=cover gives us iPhone safe-area insets; maximum-scale stops iOS zooming into inputs
  .replace(
    /<meta name="viewport"[^>]*>/,
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />',
  )
  .replace('</head>', `${head}</head>`);

if (!html.includes('rel="manifest"')) throw new Error('Could not inject head tags into index.html');
fs.writeFileSync(indexPath, html);

// GitHub Pages serves 404.html for unknown paths → lets the app handle deep links on reload
fs.writeFileSync(path.join(dist, '404.html'), html);
// Stop Jekyll from hiding the "_expo" folder
fs.writeFileSync(path.join(dist, '.nojekyll'), '');

const manifest = {
  name: 'Nibble',
  short_name: 'Nibble',
  description: 'Track calories, macros and water with a little red panda.',
  start_url: `${base}/`,
  scope: `${base}/`,
  display: 'standalone',
  orientation: 'portrait',
  background_color: BG,
  theme_color: BG,
  icons: [
    { src: `${base}/icon-192.png`, sizes: '192x192', type: 'image/png' },
    { src: `${base}/icon-512.png`, sizes: '512x512', type: 'image/png' },
    { src: `${base}/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
fs.writeFileSync(path.join(dist, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

console.log(`Web app ready in ${dist}/ (base path: "${base || '/'}")`);
