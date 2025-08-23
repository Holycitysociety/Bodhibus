async function fetchManifest() {
  const res = await fetch('images.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load images.json: ${res.status}`);
  return res.json();
}

function renderGallery(manifest) {
  const gal = document.getElementById('gallery');
  const count = document.getElementById('count');
  gal.innerHTML = '';

  count.textContent = `${manifest.length} image${manifest.length === 1 ? '' : 's'}`;

  if (!manifest.length) {
    const msg = document.createElement('p');
    msg.className = 'muted';
    msg.textContent = 'No images found. Put files in /public/bodhiimages (exact lowercase).';
    gal.appendChild(msg);
    return;
  }

  const frag = document.createDocumentFragment();
  manifest.forEach(({ src, alt }) => {
    const card = document.createElement('div');
    card.className = 'card';

    const fig = document.createElement('figure');
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = src;
    img.alt = alt || '';

    fig.appendChild(img);
    card.appendChild(fig);
    card.addEventListener('click', () => openLightbox(src, alt));
    frag.appendChild(card);
  });

  gal.appendChild(frag);
}
function openLightbox(src, alt) {
  const dlg = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-alt');
  img.src = src;
  img.alt = alt || '';
  cap.textContent = alt || '';
  dlg.showModal();
}
function bindLightboxClose() {
  const dlg = document.getElementById('lightbox');
  const btn = dlg.querySelector('.close');
  btn.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => {
    const bounds = dlg.getBoundingClientRect();
    const inDialog = e.clientX >= bounds.left && e.clientX <= bounds.right &&
                     e.clientY >= bounds.top  && e.clientY <= bounds.bottom;
    if (!inDialog) dlg.close();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dlg.open) dlg.close();
  });
}
(async function init() {
  bindLightboxClose();
  try {
    const manifest = await fetchManifest();
    renderGallery(manifest);
  } catch (err) {
    console.error(err);
    document.getElementById('count').textContent = 'Could not load images.';
  }
})();