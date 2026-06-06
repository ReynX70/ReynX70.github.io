// ============================================
//  CYPHER.DELISI.70 — SITE CONTROLLER (Clean Theme)
// ============================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const YT_API_KEY = 'AIzaSyAp-uhzfrhh0HzuxpiPbp5GztL2blxI2fM';
const CHANNEL_ID = 'UCnMngge08vtea22mh38D7lg';

const state = {
  sort: 'views',
  query: '',
  liveViews: false,
};

// === HELPERS ===
function formatViews(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}
function thumbUrl(id) { return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`; }
function maxThumbUrl(id) { return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`; }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatTime(d = new Date()) {
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

// === RENDER ===
function getSortedVideos() {
  let v = [...VIDEOS];
  if (state.query) {
    const q = state.query.toLowerCase();
    v = v.filter(x => x.title.toLowerCase().includes(q));
  }
  switch (state.sort) {
    case 'views': v.sort((a, b) => b.views - a.views); break;
    case 'date':  v.sort((a, b) => new Date(b.date) - new Date(a.date)); break;
    case 'alpha': v.sort((a, b) => a.title.localeCompare(b.title, 'tr')); break;
  }
  return v;
}

function render() {
  const grid = $('#videoGrid');
  const empty = $('#emptyState');
  const list = getSortedVideos();

  if (list.length === 0) {
    grid.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  grid.innerHTML = list.map((v, i) => {
    const rank = i + 1;
    let rankBadge = '';
    if (state.sort === 'views' && rank === 1) rankBadge = `<span class="video-rank">★ #1</span>`;
    else if (state.sort === 'views' && rank === 2) rankBadge = `<span class="video-rank silver">#2</span>`;
    else if (state.sort === 'views' && rank === 3) rankBadge = `<span class="video-rank bronze">#3</span>`;

    return `
      <a class="video-card" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">
        <div class="video-thumb">
          ${rankBadge}
          ${state.liveViews ? `<span class="view-badge live">CANLI</span>` : ''}
          <img src="${thumbUrl(v.id)}" alt="${escapeHtml(v.title)}" loading="lazy"
               onerror="this.src='https://i.ytimg.com/vi/${v.id}/default.jpg'" />
          <span class="video-duration">${v.duration}</span>
        </div>
        <div class="video-info">
          <h3 class="video-title">${escapeHtml(v.title)}</h3>
          <div class="video-meta">
            <span class="video-views">👁 ${formatViews(v.views)}</span>
            <span class="video-likes">👍 ${v.likes || 0}</span>
            <span>${formatDate(v.date)}</span>
          </div>
        </div>
      </a>
    `;
  }).join('');
}

function updateMeta() {
  const totalViews = VIDEOS.reduce((s, v) => s + (v.views || 0), 0);
  const subs = state.channelSubs || 9;
  animateNumber($('#heroVideoCount'), VIDEOS.length);
  animateNumber($('#heroViewCount'), totalViews, formatViews);
  animateNumber($('#heroSubCount'), subs);
}

function animateNumber(el, target, formatter) {
  if (!el) return;
  const dur = 1500;
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.floor(target * eased);
    el.textContent = formatter ? formatter(val) : val.toLocaleString('tr-TR');
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = formatter ? formatter(target) : target.toLocaleString('tr-TR');
  }
  requestAnimationFrame(tick);
}

function updateHeroPhotos() {
  // Top 2 videoları hero'da göster
  const top = [...VIDEOS].sort((a, b) => b.views - a.views).slice(0, 2);
  if (top[0]) {
    const img1 = document.querySelector('#heroPhoto1 img');
    const href1 = $('#heroPhoto1');
    const badge1 = $('#photoBadge1');
    if (img1) img1.src = maxThumbUrl(top[0].id);
    if (href1) href1.href = `https://www.youtube.com/watch?v=${top[0].id}`;
    if (badge1) badge1.textContent = `🔥 ${formatViews(top[0].views)}`;
  }
  if (top[1]) {
    const img2 = document.querySelector('#heroPhoto2 img');
    const href2 = $('#heroPhoto2');
    const badge2 = $('#photoBadge2');
    if (img2) img2.src = maxThumbUrl(top[1].id);
    if (href2) href2.href = `https://www.youtube.com/watch?v=${top[1].id}`;
    if (badge2) badge2.textContent = `🔥 ${formatViews(top[1].views)}`;
  }
}

// === API ===
async function fetchLiveViews() {
  const ids = VIDEOS.map(v => v.id);
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.join(',')}&key=${YT_API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API ' + res.status);
    const data = await res.json();
    const map = new Map();
    (data.items || []).forEach(it => {
      map.set(it.id, {
        views: parseInt(it.statistics?.viewCount || '0', 10),
        likes: parseInt(it.statistics?.likeCount || '0', 10),
      });
    });
    VIDEOS.forEach(v => {
      if (map.has(v.id)) {
        v.views = map.get(v.id).views;
        v.likes = map.get(v.id).likes;
      }
    });
    state.liveViews = true;
    flashStatus('Canlı veriler yüklendi ✓', 'ok');
    render();
    updateHeroPhotos();
    updateMeta();
  } catch (err) {
    console.error(err);
    flashStatus('Güncelleme başarısız: ' + err.message, 'err');
  }
}

async function fetchChannelInfo() {
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${YT_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    const ch = data.items?.[0];
    if (!ch) return;
    state.channelSubs = parseInt(ch.statistics?.subscriberCount || '0', 10);
    state.channelTotalViews = parseInt(ch.statistics?.viewCount || '0', 10);
    updateMeta();
  } catch (err) {
    console.error('Channel info:', err);
  }
}

function flashStatus(msg, kind = 'ok') {
  const el = document.createElement('div');
  el.className = 'flash-toast flash-' + kind;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

// === EVENTS ===
$$('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.sort = btn.dataset.sort;
    render();
  });
});

$('#searchInput')?.addEventListener('input', (e) => {
  state.query = e.target.value;
  render();
});

$('#refreshBtn')?.addEventListener('click', async (e) => {
  e.currentTarget.classList.add('spinning');
  await Promise.all([fetchLiveViews(), fetchChannelInfo()]);
  e.currentTarget.classList.remove('spinning');
});

$('#menuToggle')?.addEventListener('click', () => {
  const nav = $('#mobileNav');
  if (!nav) return;
  const open = nav.getAttribute('data-open') === 'true';
  nav.setAttribute('data-open', String(!open));
  nav.hidden = open;
});

// Category card click → filter
$$('.cat-card').forEach(card => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    const cat = card.dataset.cat;
    if (cat === 'taktik') state.query = 'taktik';
    else if (cat === 'edit') state.query = 'edit';
    else if (cat === 'ajan') state.query = 'phoenix|sage|viper|deadlock|raze|cypher|clove';
    else if (cat === 'shorts') state.query = '';
    else if (cat === 'harita') state.query = 'haven|split|ascent|bind';
    else if (cat === 'komboluk') state.query = '';
    if (state.query) {
      const input = $('#searchInput');
      if (input) input.value = state.query;
    } else {
      const input = $('#searchInput');
      if (input) input.value = '';
      state.query = '';
    }
    render();
    document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });
  });
});

// === INIT ===
$('#year').textContent = new Date().getFullYear();
render();
updateHeroPhotos();
updateMeta();

// Auto-fetch on load
setTimeout(() => {
  fetchLiveViews();
  fetchChannelInfo();
}, 1000);

// Then every 5 min
setInterval(() => {
  fetchLiveViews();
  fetchChannelInfo();
}, 5 * 60 * 1000);
