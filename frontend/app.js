const API_BASE = (window.ALBUM_COPA_API_BASE || 'http://localhost:5000/api').replace(/\/+$/, '');

const state = {
  stickers: [],
  selections: [],
  missing: [],
  duplicates: [],
  importRows: [],
  cameraStream: null,
  scannerItems: [],
  pageItems: [],
  selectedScannerIds: new Set()
};


const flagByPrefix = {
  RSA: '🇿🇦', KOR: '🇰🇷', MEX: '🇲🇽', CZE: '🇨🇿',
  BIH: '🇧🇦', CAN: '🇨🇦', QAT: '🇶🇦', SUI: '🇨🇭',
  BRA: '🇧🇷', SCO: '🏴', HAI: '🇭🇹', MAR: '🇲🇦',
  AUS: '🇦🇺', USA: '🇺🇸', PAR: '🇵🇾', TUR: '🇹🇷',
  GER: '🇩🇪', CIV: '🇨🇮', CUW: '🇨🇼', ECU: '🇪🇨',
  NED: '🇳🇱', JPN: '🇯🇵', SWE: '🇸🇪', TUN: '🇹🇳',
  BEL: '🇧🇪', EGY: '🇪🇬', IRN: '🇮🇷', NZL: '🇳🇿',
  KSA: '🇸🇦', CPV: '🇨🇻', ESP: '🇪🇸', URU: '🇺🇾',
  FRA: '🇫🇷', IRQ: '🇮🇶', NOR: '🇳🇴', SEN: '🇸🇳',
  ALG: '🇩🇿', ARG: '🇦🇷', AUT: '🇦🇹', JOR: '🇯🇴',
  COL: '🇨🇴', POR: '🇵🇹', COD: '🇨🇩', UZB: '🇺🇿',
  CRO: '🇭🇷', GHA: '🇬🇭', ENG: '🏴', PAN: '🇵🇦'
};

function getFlag(prefix) {
  return flagByPrefix[String(prefix || '').toUpperCase()] || '🏳️';
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
  return response.json();
}

async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let details = '';
    try {
      const errorBody = await response.json();
      details = errorBody.message || JSON.stringify(errorBody);
    } catch (_) {
      details = await response.text();
    }
    throw new Error(details || `Erro HTTP ${response.status}`);
  }

  return response.json();
}

async function apiDelete(path) {
  const response = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
  return response.json();
}

async function loadDashboard() {
  const data = await apiGet('/dashboard');

  $('#statTotal').textContent = data.total;
  $('#statOwned').textContent = data.owned;
  $('#statMissing').textContent = data.missing;
  $('#statDuplicates').textContent = data.duplicates;
  $('#statSpecialMissing').textContent = data.specialMissing;
  $('#progressValue').textContent = `${data.progress}%`;
  $('#progressFill').style.width = `${data.progress}%`;
  $('#progressText').textContent = `${data.owned} de ${data.total} figurinhas marcadas como tenho.`;
}

function getFiltersQuery() {
  const params = new URLSearchParams();

  const search = $('#searchInput').value.trim();
  const status = $('#statusFilter').value;
  const special = $('#specialFilter').value;
  const pageNumber = $('#pageFilter').value;

  if (search) params.set('search', search);
  if (status) params.set('status', status);
  if (special) params.set('special', special);
  if (pageNumber) params.set('pageNumber', pageNumber);

  const query = params.toString();
  return query ? `?${query}` : '';
}

async function loadStickers() {
  const query = getFiltersQuery();
  state.stickers = await apiGet(`/stickers${query}`);
  renderStickers();
}

async function loadSelections() {
  state.selections = await apiGet('/selections');
  renderSelections();
}

async function loadMissing() {
  state.missing = await apiGet('/stickers/missing');
  renderMissing();
}

async function loadDuplicates() {
  state.duplicates = await apiGet('/stickers/duplicates');
  renderDuplicates();
}

async function loadPages() {
  state.pageItems = await apiGet('/stickers');
  renderPages();
}

function labelStatus(status) {
  if (status === 'Got') return 'Tenho';
  if (status === 'Duplicate') return 'Repetida';
  return 'Falta';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderStickers() {
  const grid = $('#stickerGrid');
  $('#checklistCount').textContent = `${state.stickers.length} item(ns)`;

  if (!state.stickers.length) {
    grid.innerHTML = '<p class="empty-state">Nenhuma figurinha encontrada com esses filtros.</p>';
    return;
  }

  grid.innerHTML = state.stickers.map(item => {
    const isNeed = item.status === 'Need';
    const isGot = item.status === 'Got';
    const isDuplicate = item.status === 'Duplicate';

    return `
      <article class="sticker-card ${item.status}">
        <div class="sticker-top">
          <div>
            <div class="code">${escapeHtml(item.code)}</div>
            <div class="meta">
              Nº ${item.number} · Página ${item.pageNumber} · Slot ${item.slotNumber}<br>
              ${escapeHtml(item.country || 'A definir')} · ${escapeHtml(item.groupName || 'Base')}
            </div>
          </div>
          <span class="badge ${item.status}">${labelStatus(item.status)}</span>
        </div>
        <div class="badge-line">
          ${item.isSpecial ? '<span class="badge Special">Especial</span>' : '<span class="badge Base">Base</span>'}
          ${item.quantity > 1 ? `<span class="badge Duplicate">x${item.quantity}</span>` : ''}
        </div>
        <div class="card-actions">
          <button class="btn danger ${isNeed ? 'selected' : ''}" onclick="setStatus(${item.id}, 'Need', 0)">Falta</button>
          <button class="btn secondary ${isGot ? 'selected' : ''}" onclick="setStatus(${item.id}, 'Got', 1)">Tenho</button>
          <button class="btn primary ${isDuplicate ? 'selected' : ''}" onclick="setStatus(${item.id}, 'Duplicate', 2)">Repetida</button>
        </div>
      </article>
    `;
  }).join('');
}


function groupSelectionsByGroup(selections) {
  return selections.reduce((acc, item) => {
    const key = item.groupName || 'Sem grupo';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function renderSelections() {
  const grid = $('#selectionsGrid');
  const counter = $('#selectionsCount');
  if (!grid || !counter) return;

  const search = $('#selectionSearchInput')?.value.trim().toLowerCase() || '';
  const progressFilter = $('#selectionProgressFilter')?.value || '';

  let selections = [...state.selections];

  if (search) {
    selections = selections.filter(item =>
      String(item.country || '').toLowerCase().includes(search) ||
      String(item.groupName || '').toLowerCase().includes(search) ||
      String(item.prefix || '').toLowerCase().includes(search) ||
      String(item.firstCode || '').toLowerCase().includes(search) ||
      String(item.lastCode || '').toLowerCase().includes(search)
    );
  }

  if (progressFilter === 'missing') selections = selections.filter(item => item.missing > 0);
  if (progressFilter === 'complete') selections = selections.filter(item => item.total > 0 && item.missing === 0);
  if (progressFilter === 'duplicates') selections = selections.filter(item => item.duplicates > 0);

  counter.textContent = `${selections.length} seleção(ões)`;

  if (!selections.length) {
    grid.className = 'selection-group-list empty-state';
    grid.innerHTML = 'Nenhuma seleção encontrada para esse filtro.';
    return;
  }

  const grouped = groupSelectionsByGroup(selections);

  grid.className = 'selection-group-list';
  grid.innerHTML = Object.entries(grouped).map(([group, items]) => `
    <section class="selection-group-block">
      <div class="selection-group-title">
        <strong>${escapeHtml(group)}</strong>
        <span>${items.length} seleção(ões)</span>
      </div>
      <div class="selection-grid">
        ${items.map(item => `
          <article class="selection-card ${item.missing === 0 ? 'complete' : ''}">
            <div class="selection-card-main">
              <div class="selection-flag">${getFlag(item.prefix)}</div>
              <div>
                <strong>${escapeHtml(item.country)}</strong>
                <div class="meta">${escapeHtml(item.prefix)} · ${escapeHtml(item.firstCode)} até ${escapeHtml(item.lastCode)}</div>
              </div>
            </div>

            <div class="page-progress"><div style="width:${item.progress}%"></div></div>

            <div class="selection-stats">
              <span class="badge Got">Tenho: ${item.owned}</span>
              <span class="badge Need">Faltam: ${item.missing}</span>
              <span class="badge Duplicate">Rep.: ${item.duplicates}</span>
              <span class="pill">${item.progress}%</span>
            </div>

            <div class="selection-actions">
              <button class="btn primary" onclick="openSelectionChecklist('${escapeHtml(item.prefix)}')">Checklist</button>
              <button class="btn secondary" onclick="openSelectionScanner(${item.pageNumber})">Scanner</button>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `).join('');
}

function openSelectionChecklist(prefix) {
  $('#searchInput').value = prefix;
  $('#pageFilter').value = '';
  $('#statusFilter').value = '';
  $('#specialFilter').value = '';
  activateTab('checklist');
  loadStickers();
}

function openSelectionScanner(pageNumber) {
  $('#scanPageNumber').value = pageNumber;
  activateTab('scanner');
  loadScannerPage();
}

function getGroupKey(item, mode) {
  if (mode === 'country') return item.country || item.groupName || 'A definir';
  if (mode === 'type') return item.isSpecial ? 'Especiais' : 'Base';
  return `Página ${item.pageNumber}`;
}

function groupItems(items, mode) {
  return items.reduce((acc, item) => {
    const key = getGroupKey(item, mode);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function renderMissing() {
  const list = $('#missingList');
  const mode = $('#missingGroupMode').value;

  if (!state.missing.length) {
    list.innerHTML = '<p class="empty-state">Parabéns! Nenhuma faltante encontrada.</p>';
    return;
  }

  const grouped = groupItems(state.missing, mode);

  list.innerHTML = Object.entries(grouped).map(([group, items]) => `
    <section class="group-card">
      <div class="group-title">
        <strong>${escapeHtml(group)}</strong>
        <span class="pill">${items.length}</span>
      </div>
      <div class="list">
        ${items.map(item => `
          <div class="list-item">
            <div>
              <strong>${escapeHtml(item.code)}</strong>
              <div class="meta">
                Nº ${item.number} · ${escapeHtml(item.country || 'A definir')} · ${escapeHtml(item.groupName || 'Base')} · Página ${item.pageNumber} · Slot ${item.slotNumber}
              </div>
            </div>
            ${item.isSpecial ? '<span class="badge Special">Especial</span>' : '<span class="badge Need">Falta</span>'}
          </div>
        `).join('')}
      </div>
    </section>
  `).join('');
}

function renderDuplicates() {
  const list = $('#duplicatesList');
  $('#duplicatesCount').textContent = `${state.duplicates.length} item(ns)`;

  if (!state.duplicates.length) {
    list.innerHTML = '<p class="empty-state">Você ainda não marcou figurinhas repetidas.</p>';
    return;
  }

  const grouped = groupItems(state.duplicates, 'country');

  list.innerHTML = Object.entries(grouped).map(([group, items]) => `
    <section class="group-card">
      <div class="group-title">
        <strong>${escapeHtml(group)}</strong>
        <span class="pill">${items.length}</span>
      </div>
      <div class="list">
        ${items.map(item => `
          <div class="list-item">
            <div>
              <strong>${escapeHtml(item.code)}</strong>
              <div class="meta">
                Nº ${item.number} · ${escapeHtml(item.country || 'A definir')} · Página ${item.pageNumber} · Slot ${item.slotNumber}
              </div>
            </div>
            <span class="badge Duplicate">x${item.quantity}</span>
          </div>
        `).join('')}
      </div>
    </section>
  `).join('');
}


function buildPageSummaries() {
  const pages = state.pageItems.reduce((acc, item) => {
    const pageNumber = item.pageNumber;
    if (!acc[pageNumber]) {
      acc[pageNumber] = {
        pageNumber,
        total: 0,
        owned: 0,
        missing: 0,
        duplicates: 0,
        special: 0,
        codes: [],
        countries: new Set(),
        groups: new Set(),
        items: []
      };
    }

    const page = acc[pageNumber];
    page.total += 1;
    page.items.push(item);
    page.codes.push(item.code);
    if (item.country) page.countries.add(item.country);
    if (item.groupName) page.groups.add(item.groupName);
    if (item.isSpecial) page.special += 1;

    if (item.status === 'Need') page.missing += 1;
    if (item.status === 'Duplicate') page.duplicates += 1;
    if (item.status === 'Got' || item.status === 'Duplicate') page.owned += 1;

    return acc;
  }, {});

  return Object.values(pages)
    .map(page => ({
      ...page,
      progress: page.total ? Math.round((page.owned * 100) / page.total) : 0,
      countryText: Array.from(page.countries).slice(0, 3).join(', ') || 'A definir',
      groupText: Array.from(page.groups).slice(0, 3).join(', ') || 'Base'
    }))
    .sort((a, b) => a.pageNumber - b.pageNumber);
}

function renderPages() {
  const grid = $('#pagesGrid');
  const counter = $('#pagesCount');
  if (!grid || !counter) return;

  const search = $('#pageSearchInput')?.value.trim().toLowerCase() || '';
  const progressFilter = $('#pageProgressFilter')?.value || '';
  let pages = buildPageSummaries();

  if (search) {
    pages = pages.filter(page =>
      String(page.pageNumber).includes(search) ||
      page.countryText.toLowerCase().includes(search) ||
      page.groupText.toLowerCase().includes(search) ||
      page.codes.some(code => String(code).toLowerCase().includes(search))
    );
  }

  if (progressFilter === 'missing') pages = pages.filter(page => page.missing > 0);
  if (progressFilter === 'complete') pages = pages.filter(page => page.total > 0 && page.missing === 0);
  if (progressFilter === 'duplicates') pages = pages.filter(page => page.duplicates > 0);

  counter.textContent = `${pages.length} página(s)`;

  if (!pages.length) {
    grid.className = 'pages-grid empty-state';
    grid.innerHTML = 'Nenhuma página encontrada para esse filtro.';
    return;
  }

  grid.className = 'pages-grid';
  grid.innerHTML = pages.map(page => `
    <article class="page-card ${page.missing === 0 ? 'complete' : ''}">
      <div class="page-card-top">
        <div>
          <span class="page-kicker">Página</span>
          <strong>${page.pageNumber}</strong>
        </div>
        <span class="pill">${page.progress}%</span>
      </div>

      <div class="page-progress"><div style="width:${page.progress}%"></div></div>

      <div class="page-meta">
        <span>${escapeHtml(page.countryText)}</span>
        <span>${escapeHtml(page.groupText)}</span>
      </div>

      <div class="page-stats">
        <span class="badge Got">Tenho: ${page.owned}</span>
        <span class="badge Need">Faltam: ${page.missing}</span>
        <span class="badge Duplicate">Rep.: ${page.duplicates}</span>
        ${page.special ? `<span class="badge Special">Esp.: ${page.special}</span>` : ''}
      </div>

      <div class="page-actions">
        <button class="btn primary" onclick="openScannerPage(${page.pageNumber})">Scanner</button>
        <button class="btn secondary" onclick="openChecklistPage(${page.pageNumber})">Checklist</button>
      </div>
    </article>
  `).join('');
}

function openScannerPage(pageNumber) {
  $('#scanPageNumber').value = pageNumber;
  activateTab('scanner');
  loadScannerPage();
}

function openChecklistPage(pageNumber) {
  $('#pageFilter').value = pageNumber;
  $('#searchInput').value = '';
  $('#statusFilter').value = '';
  $('#specialFilter').value = '';
  activateTab('checklist');
  loadStickers();
}

async function setStatus(id, status, quantity) {
  try {
    await apiPost(`/stickers/${id}/status`, { status, quantity });
    await refreshAll();
    showToast('Figurinha atualizada.');
  } catch (error) {
    showToast('Erro ao atualizar figurinha. Verifique se a API está rodando.');
    console.error(error);
  }
}

function toCsvValue(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function exportMissingCsv() {
  if (!state.missing.length) {
    showToast('Nenhuma faltante para exportar.');
    return;
  }

  const header = ['code', 'number', 'country', 'groupName', 'pageNumber', 'slotNumber', 'isSpecial'];
  const rows = state.missing.map(x => [
    x.code,
    x.number,
    x.country,
    x.groupName,
    x.pageNumber,
    x.slotNumber,
    x.isSpecial
  ]);

  const csv = ['sep=;', header, ...rows]
    .map(row => Array.isArray(row) ? row.map(toCsvValue).join(';') : row)
    .join('\n');

  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `faltantes-copa-2026-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function buildMissingText() {
  const mode = $('#missingGroupMode').value;
  const grouped = groupItems(state.missing, mode);
  const lines = ['Minhas faltantes do álbum Copa 2026:', ''];

  Object.entries(grouped).forEach(([group, items]) => {
    lines.push(`${group}: ${items.map(item => item.code).join(', ')}`);
  });

  return lines.join('\n');
}

async function copyMissingList() {
  if (!state.missing.length) {
    showToast('Nenhuma faltante para copiar.');
    return;
  }

  const text = buildMissingText();

  try {
    await navigator.clipboard.writeText(text);
    showToast('Lista de faltantes copiada.');
  } catch (_) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    showToast('Lista de faltantes copiada.');
  }
}

function shareMissingWhatsApp() {
  if (!state.missing.length) {
    showToast('Nenhuma faltante para compartilhar.');
    return;
  }

  const text = buildMissingText();

  if (text.length > 7000) {
    copyMissingList();
    showToast('A lista é grande. Copiei o texto para você colar no WhatsApp.');
    return;
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

async function resetCollection() {
  const confirmReset = confirm('Tem certeza que deseja resetar sua coleção? Os códigos continuam, mas todos os status voltam para falta.');
  if (!confirmReset) return;

  try {
    await apiDelete('/collection/reset');
    await refreshAll();
    showToast('Coleção resetada.');
  } catch (error) {
    showToast('Erro ao resetar coleção.');
    console.error(error);
  }
}

async function refreshAll() {
  await Promise.all([
    loadDashboard(),
    loadStickers(),
    loadSelections(),
    loadMissing(),
    loadDuplicates(),
    loadPages()
  ]);
}

function activateTab(tab) {
  $$('.tab').forEach(x => x.classList.remove('active'));
  $$('.tab-panel').forEach(x => x.classList.remove('active'));

  const button = $(`.tab[data-tab="${tab}"]`);
  const panel = $(`#tab-${tab}`);

  if (button) button.classList.add('active');
  if (panel) panel.classList.add('active');
}

function setupTabs() {
  $$('.tab').forEach(button => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
  });
}

async function startCamera() {
  try {
    const video = $('#cameraVideo');
    const canvas = $('#cameraCanvas');

    if (state.cameraStream) stopCamera(false);

    state.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    });

    video.srcObject = state.cameraStream;
    video.style.display = 'block';
    canvas.style.display = 'none';
    $('#cameraPlaceholder').style.display = 'none';
    showToast('Câmera aberta. Posicione a página e clique em Capturar foto.');
  } catch (error) {
    showToast('Não foi possível abrir a câmera. Verifique a permissão do navegador.');
    console.error(error);
  }
}

function takePhoto() {
  const video = $('#cameraVideo');
  const canvas = $('#cameraCanvas');

  if (!state.cameraStream) {
    showToast('Abra a câmera primeiro.');
    return;
  }

  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.style.display = 'block';
  video.style.display = 'none';
  $('#cameraPlaceholder').style.display = 'none';
  showToast('Foto capturada. Agora carregue a página e selecione os espaços preenchidos.');
}

function stopCamera(showMessage = true) {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(track => track.stop());
    state.cameraStream = null;
    $('#cameraVideo').srcObject = null;
    $('#cameraVideo').style.display = 'none';
    if (showMessage) showToast('Câmera fechada.');
  }
}

function getScannerPageNumber() {
  const pageNumber = Number($('#scanPageNumber').value);

  if (!pageNumber || pageNumber < 1) {
    showToast('Informe o número da página.');
    return null;
  }

  return pageNumber;
}

async function loadScannerPage() {
  const pageNumber = getScannerPageNumber();
  if (!pageNumber) return;

  try {
    state.scannerItems = await apiGet(`/pages/${pageNumber}`);
    state.selectedScannerIds = new Set();
    renderScannerPage();

    if (!state.scannerItems.length) {
      showToast(`Página ${pageNumber} não encontrada na base.`);
      return;
    }

    showToast(`Página ${pageNumber} carregada com ${state.scannerItems.length} espaço(s).`);
  } catch (error) {
    showToast('Erro ao carregar página para scanner.');
    console.error(error);
  }
}

function updateScannerStats() {
  const totalEl = $('#scanStatTotal');
  const ownedEl = $('#scanStatOwned');
  const missingEl = $('#scanStatMissing');
  const dupEl = $('#scanStatDuplicates');
  if (!totalEl || !ownedEl || !missingEl || !dupEl) return;

  if (!state.scannerItems.length) {
    totalEl.textContent = '-';
    ownedEl.textContent = '-';
    missingEl.textContent = '-';
    dupEl.textContent = '-';
    return;
  }

  const got = state.scannerItems.filter(x => x.status === 'Got').length;
  const dup = state.scannerItems.filter(x => x.status === 'Duplicate').length;
  const need = state.scannerItems.filter(x => x.status === 'Need').length;

  totalEl.textContent = state.scannerItems.length;
  ownedEl.textContent = got + dup;
  missingEl.textContent = need;
  dupEl.textContent = dup;
}

function renderScannerPage() {
  const grid = $('#scanSlotGrid');
  const summary = $('#scanSummary');
  const pageNumber = Number($('#scanPageNumber').value);

  updateScannerStats();

  if (!state.scannerItems.length) {
    summary.textContent = 'Nenhuma página carregada';
    grid.className = 'scan-slot-grid empty';
    grid.innerHTML = 'Informe a página e clique em “Carregar página”.';
    return;
  }

  const selected = state.selectedScannerIds.size;
  const got = state.scannerItems.filter(x => x.status === 'Got').length;
  const dup = state.scannerItems.filter(x => x.status === 'Duplicate').length;
  const need = state.scannerItems.filter(x => x.status === 'Need').length;
  const owned = got + dup;
  const progress = state.scannerItems.length ? Math.round((owned * 100) / state.scannerItems.length) : 0;

  summary.textContent = `Página ${pageNumber} · ${selected} selecionada(s) · ${owned}/${state.scannerItems.length} tenho · ${progress}%`;
  grid.className = 'scan-slot-grid';

  const ordered = [...state.scannerItems].sort((a, b) => a.slotNumber - b.slotNumber);

  grid.innerHTML = ordered.map(item => {
    const selectedClass = state.selectedScannerIds.has(item.id) ? 'selected' : '';
    const ownedClass = item.status === 'Got' || item.status === 'Duplicate' ? 'is-owned' : '';
    return `
      <button type="button" class="scan-slot-card ${item.status} ${selectedClass} ${ownedClass}" onclick="toggleScannerSlot(${item.id})">
        <span class="slot-number">Slot ${item.slotNumber}</span>
        <strong>${escapeHtml(item.code)}</strong>
        <small>Nº ${item.number}</small>
        <span class="badge ${item.status}">${labelStatus(item.status)}</span>
        ${item.isSpecial ? '<span class="badge Special">Especial</span>' : ''}
      </button>
    `;
  }).join('');

  const totalsLine = document.createElement('div');
  totalsLine.className = 'scan-page-totals';
  totalsLine.innerHTML = `
    <span class="badge Got">Tenho: ${got}</span>
    <span class="badge Duplicate">Repetidas: ${dup}</span>
    <span class="badge Need">Faltam: ${need}</span>
    <span class="badge Special">Selecionadas: ${selected}</span>
  `;
  grid.appendChild(totalsLine);
}

function toggleScannerSlot(id) {
  if (state.selectedScannerIds.has(id)) {
    state.selectedScannerIds.delete(id);
  } else {
    state.selectedScannerIds.add(id);
  }

  renderScannerPage();
}

function clearScannerSelection() {
  state.selectedScannerIds = new Set();
  renderScannerPage();
  showToast('Seleção limpa.');
}

function selectScannerSlots(mode) {
  if (!state.scannerItems.length) {
    showToast('Carregue uma página primeiro.');
    return;
  }

  let items = [];

  if (mode === 'all') items = state.scannerItems;
  if (mode === 'missing') items = state.scannerItems.filter(x => x.status === 'Need');
  if (mode === 'owned') items = state.scannerItems.filter(x => x.status === 'Got' || x.status === 'Duplicate');

  state.selectedScannerIds = new Set(items.map(x => x.id));
  renderScannerPage();
  showToast(`${state.selectedScannerIds.size} espaço(s) selecionado(s).`);
}

function invertScannerSelection() {
  if (!state.scannerItems.length) {
    showToast('Carregue uma página primeiro.');
    return;
  }

  const next = new Set();
  state.scannerItems.forEach(item => {
    if (!state.selectedScannerIds.has(item.id)) next.add(item.id);
  });
  state.selectedScannerIds = next;
  renderScannerPage();
  showToast('Seleção invertida.');
}

async function changeScannerPage(delta) {
  const current = Number($('#scanPageNumber').value) || 1;
  const next = Math.max(1, current + delta);
  $('#scanPageNumber').value = next;
  await loadScannerPage();
}

async function markSelectedScannerItems(status) {
  const pageNumber = getScannerPageNumber();
  if (!pageNumber) return;

  const stickerIds = Array.from(state.selectedScannerIds);
  if (!stickerIds.length) {
    showToast('Selecione pelo menos um espaço da página.');
    return;
  }

  const quantity = status === 'Duplicate' ? 2 : status === 'Got' ? 1 : 0;

  try {
    const result = await apiPost(`/pages/${pageNumber}/slots/status`, {
      stickerIds,
      status,
      quantity
    });

    await refreshAll();
    state.scannerItems = await apiGet(`/pages/${pageNumber}`);
    state.selectedScannerIds = new Set();
    renderScannerPage();
    showToast(`${result.updated} espaço(s) atualizado(s).`);
  } catch (error) {
    showToast(error.message || 'Erro ao atualizar espaços selecionados.');
    console.error(error);
  }
}

async function markPageOwned() {
  const pageNumber = getScannerPageNumber();
  if (!pageNumber) return;

  const confirmed = confirm(`Marcar todas as figurinhas da página ${pageNumber} como Tenho?`);
  if (!confirmed) return;

  try {
    const result = await apiPost(`/pages/${pageNumber}/mark-owned`, {});
    await refreshAll();
    state.scannerItems = await apiGet(`/pages/${pageNumber}`);
    state.selectedScannerIds = new Set();
    renderScannerPage();
    showToast(`${result.updated} figurinha(s) da página ${pageNumber} marcadas como Tenho.`);
  } catch (error) {
    showToast(error.message || 'Erro ao marcar página.');
    console.error(error);
  }
}

function openPageChecklist() {
  const pageNumber = getScannerPageNumber();
  if (!pageNumber) return;

  $('#pageFilter').value = pageNumber;
  $('#searchInput').value = '';
  $('#statusFilter').value = '';
  $('#specialFilter').value = '';
  activateTab('checklist');
  loadStickers();
}

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function parseBoolean(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return ['true', '1', 'sim', 's', 'yes', 'y', 'especial'].includes(normalized);
}

function splitCsvLine(line, delimiter) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map(x => x.trim());
}

function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, '').replace(/\r/g, '');
  const lines = clean.split('\n').map(line => line.trim()).filter(Boolean);

  if (!lines.length) return [];

  if (lines[0].toLowerCase().startsWith('sep=')) lines.shift();

  const delimiter = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
  const headers = splitCsvLine(lines.shift(), delimiter).map(normalizeHeader);

  const aliases = {
    code: ['code', 'codigo', 'cod', 'figurinha'],
    number: ['number', 'numero', 'num', 'n'],
    country: ['country', 'pais', 'selecao', 'time'],
    groupName: ['groupname', 'grupo', 'categoria', 'tipo'],
    pageNumber: ['pagenumber', 'pagina', 'page'],
    slotNumber: ['slotnumber', 'slot', 'posicao', 'espaco'],
    isSpecial: ['isspecial', 'especial', 'special']
  };

  const findIndex = (field) => headers.findIndex(header => aliases[field].includes(header));

  const indexes = {
    code: findIndex('code'),
    number: findIndex('number'),
    country: findIndex('country'),
    groupName: findIndex('groupName'),
    pageNumber: findIndex('pageNumber'),
    slotNumber: findIndex('slotNumber'),
    isSpecial: findIndex('isSpecial')
  };

  const required = ['code', 'number', 'pageNumber', 'slotNumber'];
  const missingHeaders = required.filter(field => indexes[field] < 0);
  if (missingHeaders.length) {
    throw new Error(`CSV sem coluna obrigatória: ${missingHeaders.join(', ')}`);
  }

  return lines.map((line, index) => {
    const values = splitCsvLine(line, delimiter);
    return {
      code: values[indexes.code] || '',
      number: Number(values[indexes.number] || index + 1),
      country: indexes.country >= 0 ? values[indexes.country] || 'A definir' : 'A definir',
      groupName: indexes.groupName >= 0 ? values[indexes.groupName] || 'Base' : 'Base',
      pageNumber: Number(values[indexes.pageNumber] || 1),
      slotNumber: Number(values[indexes.slotNumber] || 1),
      isSpecial: indexes.isSpecial >= 0 ? parseBoolean(values[indexes.isSpecial]) : false
    };
  }).filter(row => row.code);
}

function renderImportPreview() {
  const preview = $('#importPreview');
  $('#importCount').textContent = `${state.importRows.length} linha(s)`;

  if (!state.importRows.length) {
    preview.className = 'preview-table empty';
    preview.textContent = 'Selecione um CSV para visualizar as primeiras linhas.';
    return;
  }

  preview.className = 'preview-table';
  const rows = state.importRows.slice(0, 8);
  preview.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Nº</th>
          <th>País/Grupo</th>
          <th>Página</th>
          <th>Slot</th>
          <th>Especial</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            <td>${escapeHtml(row.code)}</td>
            <td>${row.number}</td>
            <td>${escapeHtml(row.country)} / ${escapeHtml(row.groupName)}</td>
            <td>${row.pageNumber}</td>
            <td>${row.slotNumber}</td>
            <td>${row.isSpecial ? 'Sim' : 'Não'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${state.importRows.length > rows.length ? `<p class="hint">Mostrando 8 de ${state.importRows.length} linhas.</p>` : ''}
  `;
}

async function handleCsvFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    state.importRows = parseCsv(text);
    renderImportPreview();
    showToast('CSV carregado para prévia.');
  } catch (error) {
    state.importRows = [];
    renderImportPreview();
    showToast(error.message || 'Erro ao ler CSV.');
    console.error(error);
  }
}

function downloadTemplateCsv() {
  const rows = [
    ['code', 'number', 'country', 'groupName', 'pageNumber', 'slotNumber', 'isSpecial'],
    ['BRA-1', 161, 'Brasil', 'Grupo C', 9, 1, 'false'],
    ['BRA-2', 162, 'Brasil', 'Grupo C', 9, 2, 'false'],
    ['ARG-1', 741, 'Argentina', 'Grupo J', 38, 1, 'false']
  ];

  const csv = ['sep=;', ...rows.map(row => row.map(toCsvValue).join(';'))].join('\n');
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'modelo-importacao-album-copa-2026.csv';
  link.click();
  URL.revokeObjectURL(url);
}


async function downloadBaseCsv() {
  try {
    const items = await apiGet('/stickers');
    if (!items.length) {
      showToast('Nenhuma figurinha encontrada para exportar.');
      return;
    }

    const header = ['code', 'number', 'country', 'groupName', 'pageNumber', 'slotNumber', 'isSpecial'];
    const rows = items.map(x => [
      x.code,
      x.number,
      x.country,
      x.groupName,
      x.pageNumber,
      x.slotNumber,
      x.isSpecial
    ]);

    const csv = ['sep=;', header, ...rows]
      .map(row => Array.isArray(row) ? row.map(toCsvValue).join(';') : row)
      .join('\n');

    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `base-selecoes-copa-2026-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Base atual exportada.');
  } catch (error) {
    showToast('Erro ao exportar base atual. Verifique se a API está rodando.');
    console.error(error);
  }
}

async function importCsv() {
  if (!state.importRows.length) {
    showToast('Selecione um CSV válido primeiro.');
    return;
  }

  const confirmed = confirm(`Importar ${state.importRows.length} figurinhas? A base atual será substituída e os status serão resetados.`);
  if (!confirmed) return;

  try {
    const result = await apiPost('/stickers/import', state.importRows);
    state.importRows = [];
    $('#csvInput').value = '';
    renderImportPreview();
    await refreshAll();
    activateTab('checklist');
    showToast(`${result.total} figurinhas importadas com sucesso.`);
  } catch (error) {
    showToast(error.message || 'Erro ao importar CSV.');
    console.error(error);
  }
}

function setupEvents() {
  $('#btnRefresh').addEventListener('click', refreshAll);
  $('#btnReset').addEventListener('click', resetCollection);
  $('#btnClearFilters').addEventListener('click', () => {
    $('#searchInput').value = '';
    $('#statusFilter').value = '';
    $('#specialFilter').value = '';
    $('#pageFilter').value = '';
    loadStickers();
  });

  $('#searchInput').addEventListener('input', debounce(loadStickers, 350));
  $('#statusFilter').addEventListener('change', loadStickers);
  $('#specialFilter').addEventListener('change', loadStickers);
  $('#pageFilter').addEventListener('input', debounce(loadStickers, 350));
  $('#missingGroupMode').addEventListener('change', renderMissing);

  $('#selectionSearchInput').addEventListener('input', debounce(renderSelections, 250));
  $('#selectionProgressFilter').addEventListener('change', renderSelections);
  $('#btnReloadSelections').addEventListener('click', loadSelections);

  $('#pageSearchInput').addEventListener('input', debounce(renderPages, 250));
  $('#pageProgressFilter').addEventListener('change', renderPages);
  $('#btnReloadPages').addEventListener('click', loadPages);

  $('#btnExportMissing').addEventListener('click', exportMissingCsv);
  $('#btnCopyMissing').addEventListener('click', copyMissingList);
  $('#btnWhatsApp').addEventListener('click', shareMissingWhatsApp);

  $('#btnStartCamera').addEventListener('click', startCamera);
  $('#btnTakePhoto').addEventListener('click', takePhoto);
  $('#btnStopCamera').addEventListener('click', () => stopCamera(true));
  $('#btnLoadScanPage').addEventListener('click', loadScannerPage);
  $('#scanPageNumber').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') loadScannerPage();
  });
  $('#btnMarkPageOwned').addEventListener('click', markPageOwned);
  $('#btnOpenPageChecklist').addEventListener('click', openPageChecklist);
  $('#btnPrevScanPage').addEventListener('click', () => changeScannerPage(-1));
  $('#btnNextScanPage').addEventListener('click', () => changeScannerPage(1));
  $('#btnSelectAllScanSlots').addEventListener('click', () => selectScannerSlots('all'));
  $('#btnSelectMissingScanSlots').addEventListener('click', () => selectScannerSlots('missing'));
  $('#btnSelectOwnedScanSlots').addEventListener('click', () => selectScannerSlots('owned'));
  $('#btnInvertScanSelection').addEventListener('click', invertScannerSelection);
  $('#btnClearScanSelection').addEventListener('click', clearScannerSelection);
  $('#btnMarkSelectedOwned').addEventListener('click', () => markSelectedScannerItems('Got'));
  $('#btnMarkSelectedDuplicate').addEventListener('click', () => markSelectedScannerItems('Duplicate'));
  $('#btnMarkSelectedMissing').addEventListener('click', () => markSelectedScannerItems('Need'));

  $('#csvInput').addEventListener('change', handleCsvFile);
  $('#btnDownloadTemplate').addEventListener('click', downloadTemplateCsv);
  $('#btnDownloadBase').addEventListener('click', downloadBaseCsv);
  $('#btnImportCsv').addEventListener('click', importCsv);
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

window.setStatus = setStatus;
window.toggleScannerSlot = toggleScannerSlot;
window.openScannerPage = openScannerPage;
window.openChecklistPage = openChecklistPage;
window.openSelectionChecklist = openSelectionChecklist;
window.openSelectionScanner = openSelectionScanner;

setupTabs();
setupEvents();
renderImportPreview();
renderScannerPage();
refreshAll().catch(error => {
  showToast('Não consegui conectar na API. Rode o backend primeiro.');
  console.error(error);
});
