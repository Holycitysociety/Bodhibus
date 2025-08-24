let manifest = [];
let currentIndex = -1;
let touchStartX = null;

async function fetchManifest() {
  const res = await fetch('images.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load images.json: ${res.status}`);
  return res.json();
}

function renderGallery(data) {
  manifest = data;
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
  manifest.forEach(({ src, alt }, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = src;
    img.alt = alt || '';
    card.appendChild(img);
    card.addEventListener('click', () => openLightbox(idx));
    frag.appendChild(card);
  });
  gal.appendChild(frag);
}

function openLightbox(index) {
  currentIndex = index;
  updateLightbox();
  document.getElementById('lightbox').showModal();
}

function updateLightbox() {
  const { src, alt } = manifest[currentIndex];
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-alt');
  img.src = src;
  img.alt = alt || '';
  cap.textContent = alt || '';
}

function nextImage() {
  if (!manifest.length) return;
  currentIndex = (currentIndex + 1) % manifest.length;
  updateLightbox();
}
function prevImage() {
  if (!manifest.length) return;
  currentIndex = (currentIndex - 1 + manifest.length) % manifest.length;
  updateLightbox();
}

function bindLightboxControls() {
  const dlg = document.getElementById('lightbox');
  const btnClose = dlg.querySelector('.close');
  const btnNext = dlg.querySelector('.next');
  const btnPrev = dlg.querySelector('.prev');

  btnClose.addEventListener('click', () => dlg.close());
  btnNext.addEventListener('click', nextImage);
  btnPrev.addEventListener('click', prevImage);

  // close on backdrop click
  dlg.addEventListener('click', (e) => {
    const bounds = dlg.getBoundingClientRect();
    const inDialog = e.clientX >= bounds.left && e.clientX <= bounds.right &&
                     e.clientY >= bounds.top  && e.clientY <= bounds.bottom;
    if (!inDialog) dlg.close();
  });

  // keyboard controls
  window.addEventListener('keydown', (e) => {
    if (!dlg.open) return;
    if (e.key === 'Escape') dlg.close();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  });

  // touch swipe (simple, no dependencies)
  dlg.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  dlg.addEventListener('touchend', (e) => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const threshold = 40; // px
    if (dx > threshold) prevImage();
    if (dx < -threshold) nextImage();
    touchStartX = null;
  }, { passive: true });
}

(async function init() {
  bindLightboxControls();
  try {
    const data = await fetchManifest();
    renderGallery(data);
  } catch (err) {
    console.error(err);
    document.getElementById('count').textContent = 'Could not load images.';
  }
})();