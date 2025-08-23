import { promises as fs } from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'bodhiimages'); // must be lowercase + exact
const OUT_FILE = path.join(PUBLIC_DIR, 'images.json');

// Add more formats
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
      const ext = path.extname(d.name).toLowerCase();
      if (VALID_EXT.has(ext)) out.push(full);
    }
  }
  return out;
}

async function main() {
  try {
    // Sanity checks
    try {
      const stat = await fs.stat(IMAGES_DIR);
      if (!stat.isDirectory()) {
        console.error(`[ERROR] ${IMAGES_DIR} exists but is not a directory.`);
        process.exit(1);
      }
    } catch {
      console.error(`[ERROR] Missing folder: ${IMAGES_DIR}`);
      console.error(`Create it and add images before deploying.`);
      process.exit(1);
    }

    const filesAbs = await walk(IMAGES_DIR);

    // Convert to paths relative to /public for the static site
    const filesRel = filesAbs
      .map(abs => path.relative(PUBLIC_DIR, abs).replace(/\\/g, '/'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    // Build manifest entries
    const manifest = filesRel.map(rel => ({
      src: rel, // e.g., "bodhiimages/sub/f1.jpg"
      alt: path.parse(rel.split('/').pop()).name.replace(/[-_]+/g, ' ')
    }));

    await fs.writeFile(OUT_FILE, JSON.stringify(manifest, null, 2));

    // Log results for Netlify build logs
    console.log(`[images] Scanned: ${IMAGES_DIR}`);
    console.log(`[images] Found ${manifest.length} file(s).`);
    if (manifest.length === 0) {
      console.warn(`[WARN] No images matched. Check:`);
      console.warn(` - Are files committed to the repo (not only uploaded in Netlify UI)?`);
      console.warn(` - Folder name is EXACTLY "public/bodhiimages" (lowercase)?`);
      console.warn(` - File extensions in: ${[...VALID_EXT].join(', ')}`);
      console.warn(` - If using subfolders, this script now supports them.`);
    }
    console.log(`[images] Wrote manifest: ${path.relative(process.cwd(), OUT_FILE)}`);
  } catch (err) {
    console.error('Error generating images.json', err);
    process.exit(1);
  }
}

main();