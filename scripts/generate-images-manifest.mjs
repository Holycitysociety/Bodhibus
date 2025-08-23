import { promises as fs } from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'bodhiimages');
const OUT_FILE = path.join(PUBLIC_DIR, 'images.json');

const VALID_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg']);

async function main() {
  try {
    await fs.mkdir(IMAGES_DIR, { recursive: true });

    const entries = await fs.readdir(IMAGES_DIR, { withFileTypes: true });

    const files = entries
      .filter(d => d.isFile())
      .map(d => d.name)
      .filter(name => VALID_EXT.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const manifest = files.map(name => ({
      src: `bodhiimages/${name}`,
      alt: path.parse(name).name.replace(/[-_]+/g, ' ')
    }));

    await fs.writeFile(OUT_FILE, JSON.stringify(manifest, null, 2));
    console.log(`Wrote ${manifest.length} entries to ${path.relative(process.cwd(), OUT_FILE)}`);

  } catch (err) {
    console.error('Error generating images.json', err);
    process.exit(1);
  }
}

main();