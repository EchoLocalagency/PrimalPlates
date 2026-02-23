/**
 * Menu Loader -- fetches menu from published Google Sheet and renders cards.
 * Jacob updates the sheet; the site pulls fresh data on each page load.
 */

const SHEET_ID = '1Nv9C0O3GQ5cbnYcecDEXatZsXiMYlw6A8dtRTcUouJQ';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  let row = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        row.push(current.trim());
        current = '';
        if (ch === '\r') i++;
        if (row.some(cell => cell !== '')) rows.push(row);
        row = [];
      } else {
        current += ch;
      }
    }
  }
  row.push(current.trim());
  if (row.some(cell => cell !== '')) rows.push(row);

  return rows;
}

function sheetRowsToItems(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.toLowerCase().trim());
  const items = [];

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (cells[idx] || '').trim(); });

    if (!obj.title) continue;

    items.push({
      title: obj.title,
      description: obj.description || '',
      tags: obj.tags ? obj.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      image: convertDriveLink(obj.image || ''),
      featured: (obj.featured || '').toLowerCase() === 'yes',
    });
  }
  return items;
}

function convertDriveLink(url) {
  if (!url) return '';
  // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
  }
  // Already a direct URL or thumbnail link
  return url;
}

function renderCard(item) {
  const card = document.createElement('div');
  card.className = 'menu-card' + (item.featured ? ' menu-featured' : '');

  const imgSize = item.featured ? 'text-2xl' : 'text-xl';

  card.innerHTML =
    (item.image
      ? `<img src="${item.image}" alt="${item.title}" class="img-dark-treatment" loading="lazy">`
      : `<div class="w-full bg-pp-border/30 flex items-center justify-center" style="aspect-ratio:4/3">
           <span class="font-headline text-pp-muted/50 text-lg">Primal Plates</span>
         </div>`) +
    `<div class="menu-card-body">
      <div class="flex flex-wrap gap-2 mb-3">
        ${item.tags.map(t => `<span class="badge">${t}</span>`).join('')}
      </div>
      <h3 class="font-headline ${imgSize} mb-2">${item.title}</h3>
      <p class="text-pp-muted text-sm">${item.description}</p>
    </div>`;

  // Handle broken images
  const img = card.querySelector('img');
  if (img) {
    img.onerror = function () {
      this.replaceWith(Object.assign(document.createElement('div'), {
        className: 'w-full bg-pp-border/30 flex items-center justify-center',
        style: 'aspect-ratio:4/3',
        innerHTML: '<span class="font-headline text-pp-muted/50 text-lg">Primal Plates</span>',
      }));
    };
  }

  return card;
}

function renderSkeleton(container, count) {
  for (let i = 0; i < count; i++) {
    const skel = document.createElement('div');
    skel.className = 'menu-card animate-pulse';
    skel.innerHTML =
      `<div class="w-full bg-pp-border/30" style="aspect-ratio:4/3"></div>
       <div class="menu-card-body">
         <div class="flex gap-2 mb-3">
           <span class="bg-pp-border/30 rounded-full h-5 w-16"></span>
           <span class="bg-pp-border/30 rounded-full h-5 w-20"></span>
         </div>
         <div class="bg-pp-border/40 h-6 w-3/4 mb-2 rounded"></div>
         <div class="bg-pp-border/30 h-4 w-full rounded mb-1"></div>
         <div class="bg-pp-border/30 h-4 w-2/3 rounded"></div>
       </div>`;
    container.appendChild(skel);
  }
}

function renderFallback(container) {
  container.innerHTML =
    `<div class="md:col-span-2 text-center py-16">
       <p class="font-headline text-2xl mb-3 text-pp-body">Menu coming soon</p>
       <p class="text-pp-muted text-sm">Check our Instagram
         <a href="https://www.instagram.com/primalplates_/" target="_blank" rel="noopener noreferrer"
            class="text-pp-gold hover:text-pp-hover">@primalplates_</a>
       </p>
     </div>`;
}

async function loadMenu() {
  const fullGrid = document.getElementById('menu-grid');
  const homeGrid = document.getElementById('home-menu-grid');

  if (fullGrid) renderSkeleton(fullGrid, 6);
  if (homeGrid) renderSkeleton(homeGrid, 4);

  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error('Sheet fetch failed');
    const text = await res.text();
    const rows = parseCSV(text);
    const items = sheetRowsToItems(rows);

    if (items.length === 0) {
      if (fullGrid) renderFallback(fullGrid);
      if (homeGrid) renderFallback(homeGrid);
      return;
    }

    if (fullGrid) {
      fullGrid.innerHTML = '';
      items.forEach(item => fullGrid.appendChild(renderCard(item)));
    }

    if (homeGrid) {
      homeGrid.innerHTML = '';
      // Show first 4 items (featured first if present)
      const sorted = [...items].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      sorted.slice(0, 4).forEach(item => homeGrid.appendChild(renderCard(item)));
    }
  } catch (err) {
    console.error('Menu load error:', err);
    if (fullGrid) renderFallback(fullGrid);
    if (homeGrid) renderFallback(homeGrid);
  }
}

loadMenu();
