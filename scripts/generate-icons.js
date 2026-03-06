/**
 * Generates PWA icons as SVG files.
 * Run: node scripts/generate-icons.js
 *
 * Creates both regular and maskable icons in the public/ directory.
 * SVG icons work directly in modern browsers and the manifest.
 */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Ensure directories exist
fs.mkdirSync(ICONS_DIR, { recursive: true });

const EMERALD_600 = '#059669';
const EMERALD_800 = '#065f46';

// Fork & knife SVG icon (white on emerald)
function createIconSVG(size, maskable = false) {
  const padding = maskable ? size * 0.2 : size * 0.15;
  const iconSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const scale = iconSize / 100;

  // Rounded rect corners
  const radius = maskable ? 0 : size * 0.18;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${EMERALD_600}"/>
  <g transform="translate(${cx}, ${cy}) scale(${scale})" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
    <!-- Fork -->
    <line x1="-22" y1="-32" x2="-22" y2="-8"/>
    <line x1="-14" y1="-32" x2="-14" y2="-8"/>
    <line x1="-30" y1="-32" x2="-30" y2="-8"/>
    <path d="M-30,-8 C-30,2 -14,2 -14,-8"/>
    <line x1="-22" y1="-2" x2="-22" y2="35"/>
    <!-- Knife -->
    <path d="M14,-32 L14,35" />
    <path d="M14,-32 C30,-32 30,-2 14,-2"/>
    <!-- Plate (circle) -->
    <circle cx="0" cy="4" r="38" stroke-width="2.5" opacity="0.3"/>
  </g>
</svg>`;
}

// Generate icons
const sizes = [192, 512];

for (const size of sizes) {
  // Regular icon
  const svg = createIconSVG(size, false);
  fs.writeFileSync(path.join(ICONS_DIR, `icon-${size}x${size}.svg`), svg);
  console.log(`Created icon-${size}x${size}.svg`);

  // Maskable icon (more padding, no rounded corners)
  const maskableSvg = createIconSVG(size, true);
  fs.writeFileSync(path.join(ICONS_DIR, `icon-maskable-${size}x${size}.svg`), maskableSvg);
  console.log(`Created icon-maskable-${size}x${size}.svg`);
}

// Apple touch icon (180x180)
const appleSvg = createIconSVG(180, false);
fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.svg'), appleSvg);
console.log('Created apple-touch-icon.svg');

// Favicon (32x32)
const faviconSvg = createIconSVG(32, false);
fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), faviconSvg);
console.log('Created favicon.svg');

console.log('\nDone! All icons generated.');
