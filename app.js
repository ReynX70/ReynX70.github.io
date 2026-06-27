// ============================================
//  CYPHER.DELISI.70 — SITE CONTROLLER (Clean Theme)
// ============================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const YT_API_KEY = 'AIzaSyAp-uhzfrhh0HzuxpiPbp5GztL2blxI2fM';
const CHANNEL_ID = 'UCTulhRXIvug-D26PMpiXidw';

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

// === QUIZ ===
const QUIZ_QUESTIONS = [
  {
    q: 'Reyna hangi roldedir?',
    opts: ['Sentinel', 'Controller', 'Duelist', 'Initiator'],
    correct: 2,
    explain: 'Reyna bir Duelist’tir — agresif giriş ve tek başına kill alma uzmanı.',
  },
  {
    q: 'Reyna’nın Dismiss yeteneği ne yapar?',
    opts: ['Can yeniler', 'Görünmez olur', 'Flash atar', 'Smoke atar'],
    correct: 1,
    explain: 'Dismiss, soul orb kullanarak kısa süreliğine görünmez olmayı sağlar.',
  },
  {
    q: 'Reyna’nın ultimate’ı Empress kaç saniye sürer?',
    opts: ['20 sn', '30 sn', '40 sn', '60 sn'],
    correct: 1,
    explain: 'Empress 30 saniye sürer. Bu sürede ateş hızı, reload ve ekipman bonusu alır.',
  },
  {
    q: 'Reyna soul orb’larını nereden toplar?',
    opts: ['Spike patlatınca', 'Ölen düşmanlardan', 'Site tutunca', 'Kutu alınca'],
    correct: 1,
    explain: 'Soul orb’lar ölen düşmanlardan çıkar, 3 saniye içinde toplanmalıdır.',
  },
  {
    q: 'Reyna hangi ülkedendir?',
    opts: ['Brezilya', 'Meksika', 'İspanya', 'Rusya'],
    correct: 1,
    explain: 'Reyna Meksika’dandır. Karakter tasarımı ve seslendirme Meksika kökenlidir.',
  },
  {
    q: 'Leer (Reyna C) hangi amaçla kullanılır?',
    opts: ['Hasar vermek', 'Göz engellemek', 'Can yenilemek', 'Hızlanmak'],
    correct: 1,
    explain: 'Leer, bakan oyuncuyu “yakın görür” gibi yapar — kör etkisi verir.',
  },
  {
    q: 'Devour kaç HP’ye kadar iyileştirir?',
    opts: ['50', '75', '100', '150'],
    correct: 2,
    explain: 'Devour, soul orb başına anlık iyileştirir, 100 HP üst sınırı vardır.',
  },
  {
    q: 'Reyna hangi ajan türüne karşı güçlüdür?',
    opts: ['Tank', 'Yavaş nişancı', 'Yakın dövüş', 'Ağır silah'],
    correct: 2,
    explain: 'Reyna yakın-orta mesafe duel’de en güçlüdür. Uzak mesafe silahlarına karşı zayıftır.',
  },
  {
    q: 'Bir round kaç saniye sürer?',
    opts: ['60', '90', '100', '120'],
    correct: 2,
    explain: 'Standart round süresi 100 saniyedir.',
  },
  {
    q: 'Valorant’ın en yüksek rankı hangisidir?',
    opts: ['Immortal', 'Radiant', 'Champion', 'Global'],
    correct: 1,
    explain: 'Radiant en yüksek rekabet rankıdır. Üstünde sadece “Top 500” listesi vardır.',
  },
];
  {
    q: 'Bind haritasında kaç tane teleporter vardır?',
    opts: ['1', '2', '3', '4'],
    correct: 1,
    explain: 'Bind, iki taraf arasında hızlı geçiş sağlayan 2 teleporter’a sahiptir.',
  },
  {
    q: 'Sage’in duvarı (Barrier Orb) kaç saniye dayanır?',
    opts: ['20 sn', '30 sn', '40 sn', '60 sn'],
    correct: 2,
    explain: 'Barrier Orb, 40 saniye boyunca haritada kalır. 1:42 yükleyince hazır olur.',
  },
  {
    q: 'Hangisi bir Sentinel (Gözcü) ajanı değildir?',
    opts: ['Cypher', 'Killjoy', 'Jett', 'Chamber'],
    correct: 2,
    explain: 'Jett bir Duelist’tir, hız ve giriş uzmanı.',
  },
  {
    q: 'Jett’in ultimate’ı Blade Storm’un kaç bıçağı vardır?',
    opts: ['3', '5', '7', '10'],
    correct: 1,
    explain: 'Blade Storm 5 bıçak verir. Kill + right-click = tüm bıçaklar harcanır.',
  },
  {
    q: 'Valorant kaç yılında piyasaya çıktı?',
    opts: ['2018', '2019', '2020', '2021'],
    correct: 2,
    explain: 'Valorant, Riot Games tarafından 2 Haziran 2020’de piyasaya sürüldü.',
  },
  {
    q: 'Hangisi bir Controller (Kontrol) ajanıdır?',
    opts: ['Reyna', 'Omen', 'Yoru', 'Neon'],
    correct: 1,
    explain: 'Omen klasik bir Controller’dır. Dumanı haritayı kontrol altına alır.',
  },
  {
    q: 'Ascent haritasının ana bölgesi hangi şehirden esinlenmiştir?',
    opts: ['Roma', 'Venedik', 'İstanbul', 'Lizbon'],
    correct: 1,
    explain: 'Ascent, İtalyan mimarisi ve Venedik’ten esinlenmiştir.',
  },
  {
    q: 'Hangisi Phoenix’in ultimate’ıdır?',
    opts: ['Blaze', 'Curveball', 'Hot Hands', 'Run it Back'],
    correct: 3,
    explain: 'Run it Back, Phoenix’in ölümsüz pozisyon alma ultimate’ıdır.',
  },
  {
    q: 'Cypher’ın Neural Theft ultimate’ı kaç saniyelik bilgi verir?',
    opts: ['3 sn', '6 sn', '10 sn', '12 sn'],
    correct: 1,
    explain: 'Neural Theft, ölen düşmanın son 6 saniyelik harita bilgisini verir.',
  },
  {
    q: 'Klasik (Classic) tabanca hangi ajanın ultimate’ıyla birlikte verilir?',
    opts: ['Jett', 'Reyna', 'Chamber', 'Sovyet (hiçbiri)'],
    correct: 3,
    explain: 'Klasik başlangıç silahıdır, ultimate ile gelmez. Ancak Chamber’ın Headhunter ultimate’ı da tabanca tipidir.',
  },
  {
    q: 'Hangisi Türk yapımı bir Valorant haritası değildir?',
    opts: ['Bind', 'Haven', 'Split', 'Fracture'],
    correct: 3,
    explain: 'Fracture, ABD çölü temalıdır. Türk yapımı harita yoktur ama Türk oyuncu kitlesi çok büyüktür.',
  },
  {
    q: 'Bir round toplam kaç saniye sürer?',
    opts: ['60 sn', '90 sn', '100 sn', '120 sn'],
    correct: 2,
    explain: 'Standart round süresi 100 saniyedir. Spike patlaması 45 saniye içinde olmalıdır.',
  },
  {
    q: 'Reyna’nın ultimate’ı Empress kaç saniye sürer?',
    opts: ['20 sn', '30 sn', '40 sn', '60 sn'],
    correct: 1,
    explain: 'Empress 30 saniye sürer. Bu sürede Reyna daha hızlı ateş eder ve ölümsüz olur.',
  },
  {
    q: 'Valorant’ta en yüksek rekabet rankı hangisidir?',
    opts: ['Immortal', 'Radiant', 'Global Elite', 'Champion'],
    correct: 1,
    explain: 'Radiant en yüksek rekabet rankıdır. Üstünde sadece “Top 500” listesi vardır.',
  },
];

function initQuiz() {
  const box = $('#quizBox');
  if (!box) return;

  let cur = 0;
  let score = 0;
  let answered = false;

  const $qNum = $('#qNum');
  const $qTotal = $('#qTotal');
  const $qText = $('#qText');
  const $qOpts = $('#qOptions');
  const $qFeedback = $('#qFeedback');
  const $qNext = $('#qNext');
  const $qResult = $('#qResult');
  const $qBar = $('#quizBar');

  $qTotal.textContent = QUIZ_QUESTIONS.length;

  function load() {
    const item = QUIZ_QUESTIONS[cur];
    $qNum.textContent = cur + 1;
    $qText.textContent = item.q;
    $qBar.style.width = ((cur) / QUIZ_QUESTIONS.length * 100) + '%';
    $qOpts.innerHTML = item.opts.map((o, i) =>
      `<button class="quiz-opt" data-i="${i}"><span class="opt-letter">${'ABCD'[i]}</span><span>${o}</span></button>`
    ).join('');
    $qFeedback.hidden = true;
    $qNext.hidden = true;
    answered = false;
    $qOpts.querySelectorAll('.quiz-opt').forEach(b => {
      b.addEventListener('click', () => answer(parseInt(b.dataset.i)));
    });
  }

  function answer(i) {
    if (answered) return;
    answered = true;
    const item = QUIZ_QUESTIONS[cur];
    const buttons = $qOpts.querySelectorAll('.quiz-opt');
    buttons.forEach(b => b.disabled = true);
    if (i === item.correct) {
      score++;
      buttons[i].classList.add('correct');
      $qFeedback.className = 'quiz-feedback ok';
      $qFeedback.textContent = '✓ Doğru! ' + item.explain;
    } else {
      buttons[i].classList.add('wrong');
      buttons[item.correct].classList.add('correct');
      $qFeedback.className = 'quiz-feedback no';
      $qFeedback.textContent = '✗ Yanlış. Doğru cevap: ' + item.opts[item.correct] + '. ' + item.explain;
    }
    $qFeedback.hidden = false;
    $qNext.hidden = cur === QUIZ_QUESTIONS.length - 1;
    if (cur === QUIZ_QUESTIONS.length - 1) {
      setTimeout(showResult, 1200);
    }
  }

  function showResult() {
    $qOpts.innerHTML = '';
    $qText.hidden = true;
    $qFeedback.hidden = true;
    $qNext.hidden = true;
    $qBar.style.width = '100%';
    $qResult.hidden = false;
    const pct = score / QUIZ_QUESTIONS.length;
    const emoji = pct === 1 ? '🏆' : pct >= 0.85 ? '⭐' : pct >= 0.7 ? '💎' : pct >= 0.5 ? '👍' : pct >= 0.3 ? '🤔' : '📚';
    const title = pct === 1 ? 'Mükemmel! Tam 15/15, Radiant’sın sen!' :
                  pct >= 0.85 ? 'Muhteşem! Immortal adayısın.' :
                  pct >= 0.7 ? 'Çok iyi! Diamond+ seviyesi.' :
                  pct >= 0.5 ? 'Fena değil, Platinum seviyesi.' :
                  pct >= 0.3 ? 'Başlangıç için güzel, devam et.' :
                                'Daha çok video izlemelisin!';
    $('#qrEmoji').textContent = emoji;
    $('#qrTitle').textContent = title;
    $('#qrText').textContent = `${QUIZ_QUESTIONS.length} soruda ${score} doğru cevap verdin (%${Math.round(pct * 100)})`;
  }

  $qNext.addEventListener('click', () => {
    cur++;
    load();
  });

  $('#qrRestart').addEventListener('click', () => {
    cur = 0; score = 0;
    $qText.hidden = false;
    $qResult.hidden = true;
    load();
  });

  load();
}

// === INIT ===
$('#year').textContent = new Date().getFullYear();
render();
updateHeroPhotos();
updateMeta();
initQuiz();

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
