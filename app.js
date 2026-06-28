// ============================================
//  REYNX70 — SITE CONTROLLER
// ============================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const YT_API_KEY = 'AIzaSyAp-uhzfrhh0HzuxpiPbp5GztL2blxI2fM';
const CHANNEL_ID = 'UCTulhRXIvug-D26PMpiXidw';

const state = {
  sort: 'date',
  query: '',
  liveViews: false,
  quizExpanded: true, // quiz paneli otomatik açık
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

// === VIDEOS RENDER ===
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
  if (list.length === 0) { grid.innerHTML = ''; empty.hidden = false; return; }
  empty.hidden = true;
  grid.innerHTML = list.map((v, i) => {
    const rank = i + 1;
    let rankBadge = '';
    if (state.sort === 'views' && rank === 1) rankBadge = `<span class="video-rank">★ #1</span>`;
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
  animateNumber($('#heroVideoCount'), VIDEOS.length);
  animateNumber($('#heroViewCount'), totalViews);
  const subs = state.channelSubs || 3;
  animateNumber($('#heroSubCount'), subs);
}

function animateNumber(el, target) {
  if (!el) return;
  const dur = 1500;
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.floor(target * eased);
    el.textContent = val.toLocaleString('tr-TR');
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = target.toLocaleString('tr-TR');
  }
  requestAnimationFrame(tick);
}

function updateHeroPhotos() {
  const top = [...VIDEOS].sort((a, b) => b.views - a.views).slice(0, 2);
  if (top[0]) {
    const img1 = document.querySelector('#heroPhoto1 img');
    if (img1) img1.src = maxThumbUrl(top[0].id);
  }
  if (top[1]) {
    const img2 = document.querySelector('#heroPhoto2 img');
    if (img2) img2.src = maxThumbUrl(top[1].id);
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

// === QUIZ: 15 soru, detaylı, accordion-style ===
const QUIZ_QUESTIONS = [
  {
    q: 'Reyna hangi roldedir?',
    opts: ['Sentinel', 'Controller', 'Duelist', 'Initiator'],
    correct: 2,
    detail: 'Reyna, Meksika kökenli bir Duelist (Düellocu) ajanıdır. Riot Games tarafından 2020 yılında Valorant\'ın ilk ajanlarından biri olarak piyasaya sürülmüştür. Duelist rolü, takım için ön cephede savaşan, kill almaya odaklanan ajanları kapsar. Reyna\'yı diğer Duelist\'lerden (Jett, Phoenix, Yoru) ayıran en büyük özellik, öldürdüğü düşmanlardan soul orb toplayarak kendini iyileştirmesi veya görünmez olabilmesidir.',
  },
  {
    q: 'Reyna\'nın Dismiss yeteneği ne yapar?',
    opts: ['Can yeniler', 'Görünmez olur', 'Flash atar', 'Smoke atar'],
    correct: 1,
    detail: 'Dismiss, Reyna\'nın E (signature) yeteneğidir. Bir düşmanı öldürdüğünde çıkan soul orb\'u kullanarak kısa süreliğine (3 saniye) görünmez olur. Görünmezlik sırasında silah ateşleyemez ama hareket edebilir. Bu yetenek özellikle save round\'larda (kaybedilmek üzereyken) veya takım savaşından kaçarken çok işe yarar.',
  },
  {
    q: 'Reyna\'nın ultimate\'ı Empress kaç saniye sürer?',
    opts: ['20 sn', '30 sn', '40 sn', '60 sn'],
    correct: 1,
    detail: 'Empress 30 saniye boyunca aktif kalır. Bu süre boyunca Reyna: ateş hızı artar, reload hızı artar, ekipman (mermi) düşmez ve minimap\'te düşmanlara görünmez olur. 7 ultimate puan\'ı gerektirir. Genelde pistol round dışındaki kritik roundlarda saklanmalıdır.',
  },
  {
    q: 'Reyna soul orb\'larını nereden toplar?',
    opts: ['Spike patlatınca', 'Ölen düşmanlardan', 'Site tutunca', 'Kutu alınca'],
    correct: 1,
    detail: 'Soul orb\'lar sadece Reyna\'nın bizzat öldürdüğü düşmanlardan çıkar. 3 saniye içinde toplanmazsa kaybolur. Devour (Q) için 100 HP üst sınırı vardır, Dismiss (E) için üst sınır yoktur. Takım arkadaşlarının öldürdüğü düşmanlardan orb çıkmaz.',
  },
  {
    q: 'Reyna hangi ülkedendir?',
    opts: ['Brezilya', 'Meksika', 'İspanya', 'Rusya'],
    correct: 1,
    detail: 'Reyna, Valorant\'ın lore\'unda Meksika\'dan gelen bir ajandır. Karakterin görünüşü, seslendirmesi ve arka plan hikayesi Meksika kültüründen esinlenmiştir. Oyun içi voice line\'larında da İspanyolca kelimeler kullanır ("Kaçış yok", "Bitir onu" gibi).',
  },
  {
    q: 'Leer (Reyna C) hangi amaçla kullanılır?',
    opts: ['Hasar vermek', 'Göz engellemek', 'Can yenilemek', 'Hızlanmak'],
    correct: 1,
    detail: 'Leer, Reyna\'nın C (basic) yeteneğidir. 250 kredi karşılığında bir göz küresi atar. Bu göz küresine bakan oyuncular yakın mesafeden baktıklarını sanır, bu da onları yavaşlatır ve görüş açılarını kısıtlar. 1.6 saniye etki süresi vardır. Site girişlerinde veya köşe peek\'lerinde kullanmak için idealdir.',
  },
  {
    q: 'Devour kaç HP\'ye kadar iyileştirir?',
    opts: ['50', '75', '100', '150'],
    correct: 2,
    detail: 'Devour anlık 100 HP iyileştirir. Ancak 100 HP üzerine çıkamazsın. Bir round\'da birden fazla soul orb toplarsan, her biri +100 HP anlamına gelmez, sadece 100 HP üst sınırına kadar doldurur. Yani 50 HP\'de iken 50 HP iyileştirirsin, 80 HP\'de isen sadece 20 HP.',
  },
  {
    q: 'Reyna hangi tür ajana karşı güçlüdür?',
    opts: ['Tank', 'Yavaş nişancı', 'Yakın dövüş', 'Ağır silah'],
    correct: 2,
    detail: 'Reyna yakın-orta mesafe duel\'lerde son derece güçlüdür. Özellikle Vandal veya Phantom ile yapılan headshot\'larda çok etkilidir. Açık alanlarda ve uzun mesafelerde ise Operator, Marshal gibi silahlar Reyna\'ya karşı avantaj sağlar. Bu yüzden dar koridorlu haritalar (Split, Bind, Ascent) Reyna için idealdir.',
  },
  {
    q: 'Reyna\'nın 4 yeteneği hangisinde yok?',
    opts: ['Leer', 'Devour', 'Dismiss', 'Viper\'s Pit'],
    correct: 3,
    detail: 'Viper\'s Pit Viper\'ın ultimate\'ıdır (büyük alan hasar + görüş engelleme). Reyna\'nın 4 yeteneği şunlardır: Leer (C, göz engelleme), Devour (Q, can yenileme), Dismiss (E, görünmezlik), Empress (X, ultimate). Reyna\'nın hiçbir ability\'si alan hasarı vermez.',
  },
  {
    q: 'Empress ultimate\'ı aktifken hangisi olmaz?',
    opts: ['Ateş hızı artar', 'Reload hızlanır', 'Can yenileme olur', 'Ekipman düşmez'],
    correct: 2,
    detail: 'Empress ateş hızı, reload hızı ve ekipman koruma sağlar ama can yenileme YAPMAZ. Can yenileme Devour\'un işidir. Yani Empress kullanırken öldüğünüzde soul orb toplayıp Devour ile iyileşebilirsiniz, ama Empress\'in kendisi can yenilemez.',
  },
  {
    q: 'Reyna hangi silahla en etkilidir?',
    opts: ['Operator', 'Vandal', 'Shorty', 'Bulldog'],
    correct: 1,
    detail: 'Vandal tek atışta 160 hasar verir (headshot\'ta tek atışta öldürür). Reyna\'nın agresif oyun tarzına en uygun silah budur çünkü tek atış potansiyeli vardır. Phantom da iyi bir alternatiftir ama body shot\'larda daha güvenlidir. Operator ise çok yavaş ve dar açılarda etkilidir, Reyna\'nın mobil oyun tarzına uymaz.',
  },
  {
    q: 'Reyna soul orb kaç saniye sonra kaybolur?',
    opts: ['1 sn', '3 sn', '5 sn', '10 sn'],
    correct: 1,
    detail: 'Soul orb\'lar ölümden sonra 3 saniye boyunca yerde kalır. Bu süre çok kısadır, çünkü takım savaşında 3 saniye içinde ya toplarsın ya da düşman orb\'u kapsa bile işe yaramaz (sadece Reyna kullanabilir). Hızlı refleksler ve pozisyon bilgisi gerektirir.',
  },
  {
    q: 'Reyna en zayıf olduğu harita türü?',
    opts: ['Açık harita', 'Dar koridor', '3 siteli harita', 'Tema harita'],
    correct: 0,
    detail: 'Reyna açık haritalarda (özellikle Breeze, Fracture, Sunset) zayıftır çünkü uzun menzilli silahlar (Operator, Marshal) ve uzun görüş mesafesi onu dezavantajlı kılar. Dar koridorlu haritalarda (Split, Bind) ise çok güçlüdür çünkü peek\'lerde headshot alma şansı yüksektir.',
  },
  {
    q: 'Reyna ne zaman Dismiss kullanmalı?',
    opts: ['Her öldürmede', 'Kaybetmek üzereyken', 'Site tutarken', 'Pistol round\'da'],
    correct: 1,
    detail: 'Dismiss save round\'larda ve kritik anlarda kullanılmalıdır. Her öldürmede kullanmak soul orb israfıdır. Örnek: 1v1\'de düşman daha iyi konumdaysa, düşmanı öldürdüysen hemen Dismiss ile uzaklaş, save round yap. Ya da takım arkadaşların öldüyse ve sen son kaldıysan, son kill\'ini al ve Dismiss ile kaç.',
  },
  {
    q: 'Reyna hangi item satın alabilir?',
    opts: ['Heavy Armor', 'Light Armor', 'Full Shield', 'Tüfek'],
    correct: 1,
    detail: 'Reyna Light Armor (400 kredi) alır, çünkü zaten self-sufficient oynar. Devour ile canını yenileyebildiği için Heavy Armor (1000 kredi) gereksizdir. Bu sayede her round bir silah upgrade\'ine veya daha fazla ability\'ye para kalır. Light Armor\'un +25 HP bonusu yeterlidir çünkü zaten 100 HP üst sınırı var.',
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
  const $qDetail = $('#qDetail');

  $qTotal.textContent = QUIZ_QUESTIONS.length;

  function load() {
    const item = QUIZ_QUESTIONS[cur];
    $qNum.textContent = cur + 1;
    $qText.textContent = item.q;
    $qBar.style.width = ((cur) / QUIZ_QUESTIONS.length * 100) + '%';
    $qDetail.innerHTML = ''; $qDetail.hidden = true;
    $qOpts.innerHTML = item.opts.map((o, i) =>
      `<button class="quiz-opt" data-i="${i}">
        <span class="opt-letter">${'ABCD'[i]}</span>
        <span class="opt-text">${o}</span>
      </button>`
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
      $qFeedback.innerHTML = `<strong>✓ Doğru!</strong> ${item.detail}`;
    } else {
      buttons[i].classList.add('wrong');
      buttons[item.correct].classList.add('correct');
      $qFeedback.className = 'quiz-feedback no';
      $qFeedback.innerHTML = `<strong>✗ Yanlış.</strong> Doğru cevap: <em>${item.opts[item.correct]}</em>. ${item.detail}`;
    }
    $qFeedback.hidden = false;
    $qNext.hidden = cur === QUIZ_QUESTIONS.length - 1;
    if (cur === QUIZ_QUESTIONS.length - 1) {
      setTimeout(showResult, 1500);
    }
  }

  function showResult() {
    $qOpts.innerHTML = '';
    $qText.hidden = true;
    $qFeedback.hidden = true;
    $qDetail.hidden = true;
    $qNext.hidden = true;
    $qBar.style.width = '100%';
    $qResult.hidden = false;
    const pct = score / QUIZ_QUESTIONS.length;
    const emoji = pct === 1 ? '🏆' : pct >= 0.85 ? '⭐' : pct >= 0.7 ? '💎' : pct >= 0.5 ? '👍' : pct >= 0.3 ? '🤔' : '📚';
    const title = pct === 1 ? 'Mükemmel! Tam 15/15, Radiant\'sın sen!' :
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