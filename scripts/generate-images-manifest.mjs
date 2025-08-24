import { promises as fs } from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'bodhiimages'); // keep images here
const OUT_FILE = path.join(PUBLIC_DIR, 'images.json');

const VALID_EXT = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg',
  '.heic', '.heif', '.bmp', '.tif', '.tiff'
]);

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const d of entries) {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) {
      out.push(...await walk(full));
    } else if (d.isFile()) {
      if (VALID_EXT.has(path.extname(d.name).toLowerCase())) out.push(full);
    }
  }
  return out;
}

async function main() {
  let stat;
  try { stat = await fs.stat(IMAGES_DIR); }
  catch { console.error(`[ERROR] Missing folder: ${IMAGES_DIR}`); process.exit(1); }
  if (!stat.isDirectory()) { console.error(`[ERROR] ${IMAGES_DIR} is not a directory.`); process.exit(1); }

  const filesAbs = await walk(IMAGES_DIR);
  const filesRel = filesAbs
    .map(abs => path.relative(PUBLIC_DIR, abs).replace(/\\/g, '/'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const manifest = filesRel.map(rel => ({
    src: rel, // e.g. "bodhiimages/2024/pic.jpg"
    alt: path.parse(rel.split('/').pop()).name.replace(/[-_]+/g, ' ')
  }));

  await fs.writeFile(OUT_FILE, JSON.stringify(manifest, null, 2));

  console.log(`[images] Scanned: ${IMAGES_DIR}`);
  console.log(`[images] Found ${manifest.length} file(s).`);
  console.log(`[images] Wrote: ${path.relative(process.cwd(), OUT_FILE)}`);

  // Uncomment to fail build if empty:
  // if (manifest.length === 0) process.exit(1);
}

main().catch(err => { console.error('Error generating images.json', err); process.exit(1); });