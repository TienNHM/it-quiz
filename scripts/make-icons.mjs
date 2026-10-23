// Sinh icon PWA từ public/icon.svg: node scripts/make-icons.mjs
import sharp from 'sharp';
import {readFileSync} from 'node:fs';

const svg = readFileSync('public/icon.svg');
const render = (size, out) => sharp(svg, {density: 384}).resize(size, size).png().toFile(`public/${out}`);

await render(192, 'pwa-192.png');
await render(512, 'pwa-512.png');
await render(180, 'apple-touch-icon.png');

// Maskable: nền kín + biểu tượng thu nhỏ ~70% vào vùng an toàn.
const inner = await sharp(svg, {density: 384}).resize(360, 360).png().toBuffer();
await sharp({create: {width: 512, height: 512, channels: 4, background: '#0e1122'}})
  .composite([{input: inner, gravity: 'center'}])
  .png()
  .toFile('public/pwa-maskable-512.png');
console.log('Đã sinh icon PWA trong public/');
