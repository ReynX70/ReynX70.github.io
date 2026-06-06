// ============================================
//  VIDEOS DATA — Cypher.Delisi.70
//  Tüm videolar API'den otomatik çekilecek
//  İlk yüklemede placeholder olarak buradalar
// ============================================

const VIDEOS = [
  // AUTO-POPULATED FROM YOUTUBE DATA API
  { id: 'Sz6MOOT6OqE', title: 'Valorant Aim Geliştirme Taktiği', views: 12, likes: 1, date: '2026-06-03', duration: '0:35' },
  { id: 'vlUvlX9AkIA', title: 'Valorant Viper Taktik',          views: 12, likes: 2, date: '2026-06-03', duration: '0:29' },
  { id: 'Ye1w7cQb-Fs', title: 'Valorant En Güçlü Ajan',         views: 10, likes: 2, date: '2026-06-02', duration: '0:42' },
  { id: 'DlWCll9XUYE', title: 'Valorant Taktik',                views: 17, likes: 1, date: '2026-06-02', duration: '0:14' },
  { id: 'HX-dblrudMs', title: 'Valorant Edit',                  views: 14, likes: 1, date: '2026-06-02', duration: '0:28' },
  { id: '5XNuZ8L9rzQ', title: 'Valorant Bir Çift Göz Edit',     views: 15, likes: 1, date: '2026-06-02', duration: '0:48' },
  { id: '7iOgU3VB2RI', title: 'Valorant Sage Taktik',           views:  6, likes: 1, date: '2026-06-01', duration: '0:23' },
  { id: 'NLznTrAKVHo', title: 'Valorant Aim Geliştirme Taktik', views: 10, likes: 1, date: '2026-06-01', duration: '0:56' },
  { id: 'kOrUI1sdl1I', title: 'Her oyuncunun bilmesi gereken valorant taktikleri', views: 147, likes: 1, date: '2026-06-01', duration: '0:38' },
  { id: 'CpFC1WMMdiw', title: 'Valorant Phoenix Bela Taktiği',  views: 14, likes: 1, date: '2026-05-31', duration: '0:13' },
  { id: 'JINmf1OJ33U', title: 'Valorant Deadlock Taktik',       views: 439, likes: 2, date: '2026-05-31', duration: '0:13' },
  { id: 'cjpj666w1oU', title: 'Valorant Haven Taktik',          views: 1228, likes: 15, date: '2026-05-31', duration: '0:12' },
  { id: 'xkEUGfB4c0k', title: 'Valorant Sage Taktik',           views: 868, likes: 10, date: '2026-05-31', duration: '0:16' },
  { id: 'PYH7zYB7OsA', title: 'Valorant Nasıl İndirilir 2026',  views: 36, likes: 8, date: '2026-05-31', duration: '6:37' },
  { id: 'JQw-qBDJAMg', title: 'Valorant Split Haritası Raze Taktik', views: 117, likes: 4, date: '2026-05-30', duration: '0:12' },
];

// Kanal bilgileri
const CHANNEL = {
  handle: '@cypher.delisi.70',
  channelId: 'UCnMngge08vtea22mh38D7lg',
  name: 'Cypher.Delisi.70',
  owner: 'Utku',
  avatar: 'https://yt3.ggpht.com/J-c2vaEN0zu5AwJ8V9B-NIxYCGoC3RRe2AT4JIMb31P-upYo8NcgBpeFu8GkssiccBlXBBKWPw=s240-c-k-c0x00ffffff-no-rj',
  email: 'Utkununhesabi8@gmail.com',
  description: 'Adım: Utku. Valorant ve Minecraft oynuyorum. Abone olup 👍 Like atmayı unutma! Hafta içi her gün 1 Short, hafta sonu 2 Short.',
  schedule: 'Hafta içi her gün 1 Short · Hafta sonu 2 Short',
};
