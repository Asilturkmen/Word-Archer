# Word Gladiator — Full UI Design Prompt

## Görev

Aşağıdaki tüm detaylara göre "Word Gladiator" adlı tarayıcı tabanlı typing oyununun eksiksiz frontend tasarımını ve kodunu oluştur. Tüm ekranlar tek bir HTML dosyasında, JavaScript ile ekranlar arası geçiş yapılarak çalışmalı. Hiçbir dış kütüphane kullanma — sadece vanilla HTML, CSS ve JavaScript.

---

## Oyun Özeti

Word Gladiator, Roma arenasında geçen tek oyunculu bir typing oyunudur. Ekranda bir düşman belirir, üzerinde bir kelime yazar. Oyuncu o kelimeyi doğru yazdığında gladyatör düşmanı öldürür. Classic Mode: 60 saniye, mümkün olduğunca çok düşman öldür. Yanlış yazım hasar vermez, sadece zaman kaybettirir.

---

## Görsel Kimlik

### Genel Ton
TBH: Task Bar Hero oyunundan ilham alan pixel-art estetik. Koyu, dramatik arka plan üzerinde parlak, sevimli ama savaş odaklı karakterler. Hem çocuksu hem epik bir his. Koyu zemin sayesinde karakterler ve UI elementleri havada asılı gibi durur.

### Renk Paleti (Hardcode — değiştirilmez)
```
--bg-deep:     #0d0a0e   (en koyu arka plan — ana sayfa zemin)
--bg-arena:    #1a1420   (arena arka plan)
--bg-panel:    #221830   (panel/kart arka planı)
--bg-panel-2:  #2d2040   (ikincil panel)
--gold:        #ffb347   (altın — skor, başlık vurguları)
--gold-dark:   #cc7a00   (altın koyu tonu)
--cream:       #f5e6c8   (ana metin rengi)
--cream-muted: #a89880   (ikincil metin)
--red:         #cc2936   (kan kırmızı — düşman, tehlike)
--red-dark:    #8b1a22   (koyu kırmızı)
--sand:        #c8a96e   (kum tonu — arena zemini detayları)
--stone:       #3d2e52   (taş tonu — border ve ayırıcılar)
--correct:     #4caf50   (doğru harf — yeşil)
--wrong:       #cc2936   (yanlış harf — kırmızı)
--white:       #ffffff
```

### Tipografi
- Başlık fontu: `'Press Start 2P'` — Google Fonts'tan yükle. Tüm oyun başlıkları, skor sayıları, timer için kullanılır.
- Body fontu: `'Segoe UI', system-ui, sans-serif` — menü metinleri, açıklamalar, leaderboard isimleri.
- Pixel font küçük boyutlarda (8px, 10px) kullanılabilir; body metin en az 14px.

```html
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
```

### Karakter Tasarımı (CSS/SVG ile çizilecek — harici görsel yok)

**Gladyatör (oyuncu karakteri):**
- Sol tarafta durur, sağa bakar
- Pixel-art tarzında CSS `div` + `::before` / `::after` ile çizilir
- Renk: Metalik gri zırh (#8899aa), mor pelerin (#6644aa), ten rengi yüz (#c8a070)
- Kask: Tepelik detaylı, koyu gri
- Kalkan: Sol elinde mavi/mor (#4455bb)
- Kılıç: Sağ elinde, metalik gümüş
- Durum animasyonları (CSS keyframe):
  - `idle`: hafif yukarı-aşağı sallanma (bob), 2s loop
  - `attack`: kılıcı sağa swing, 0.3s hızlı
  - `victory`: kolları yukarı kaldır, 0.5s

**Düşman (her seferinde rastgele tip):**
- Sağ tarafta durur, sola bakar
- 3 farklı düşman tipi (JS ile rastgele seçilir):
  1. `skeleton`: Beyaz kemik rengi (#e8e0d0), kırmızı gözler, basit kılıç
  2. `orc`: Yeşil ten (#557744), mor zırh, büyük balta
  3. `barbarian`: Esmer ten (#8b6050), kahverengi post, mızrak
- Durum animasyonları:
  - `idle`: hafif sallanma + nefes alır gibi genişleme, 2.5s loop
  - `approach`: sola doğru hafif ilerleme animasyonu (arka planda)
  - `death`: aşağı düşme + opacity 0'a gitme, 0.5s

---

## Ekranlar (5 Ekran)

Tüm ekranlar `id="app"` container içinde render edilir. Aktif olmayan ekranlar `display: none`. Ekranlar arası geçiş `showScreen(id)` fonksiyonu ile yapılır, 0.3s fade transition ile.

---

### Ekran 1: Ana Menü (`screen-menu`)

**Layout:**
```
┌─────────────────────────────────────────────┐
│  [arka plan: koyu arena silüeti + yıldızlar] │
│                                             │
│         ⚔  WORD GLADIATOR  ⚔              │
│       [başlık: Press Start 2P, #ffb347]     │
│     [subtitle: "Type. Kill. Survive."]      │
│                                             │
│    [gladyatör sprite — idle animasyonu]     │
│    [iskelet sprite — idle animasyonu]       │
│         (karşılıklı dururlar)               │
│                                             │
│         [ ▶  PLAY  ]   büyük buton         │
│         [  LEADERBOARD  ]   küçük buton    │
│         [  HOW TO PLAY  ]   küçük buton    │
│                                             │
│    [sağ üst köşe: LOGIN / kullanıcı adı]   │
└─────────────────────────────────────────────┘
```

**Detaylar:**
- Arka plan: `--bg-deep` üzerinde SVG ile çizilmiş arena kemerleri silüeti (basit geometrik şekiller, koyu mor #1a1020)
- Yıldız efekti: 50 adet rastgele konumlandırılmış küçük beyaz nokta (CSS ile), bazıları `opacity` animasyonu ile titreşir (twinkle)
- Başlık "WORD GLADIATOR": Press Start 2P, 28px, `--gold` rengi, alt satırda 2px kalınlığında `--gold-dark` text-shadow (pixel shadow efekti: `2px 2px 0 #cc7a00, 4px 4px 0 #8b5500`)
- Subtitle "Type. Kill. Survive.": 12px, Press Start 2P, `--cream-muted`
- İki karakter aralarında 120px boşlukla karşılıklı durur, ikisi de idle animasyonunda
- PLAY butonu: `--gold` background, `--bg-deep` text, 18px Press Start 2P, padding 16px 48px, border yok, 4px solid pixel köşe efekti (box-shadow: `4px 4px 0 #8b5500`), hover'da yukarı 2px kayar ve shadow azalır
- Diğer butonlar: transparan background, `--stone` border (2px solid), `--cream` text, 12px Press Start 2P, hover'da `--bg-panel` background
- Sağ üst: kullanıcı giriş yapmamışsa "LOGIN" butonu (küçük, outline); giriş yaptıysa kullanıcı adı + çıkış ikonu

---

### Ekran 2: Oyun Ekranı (`screen-game`)

**Layout:**
```
┌─────────────────────────────────────────────┐
│  SCORE: 0        [■■■■■■■■■■] 60s  KILLS: 0│
│  ─────────────────────────────────────────  │
│                                             │
│  [ARENA SAHNESI — ana oyun alanı]           │
│                                             │
│  [gladyatör]          [   KELIME   ]        │
│      ⚔                [  düşman   ]        │
│  (sol, sola bakar)    (sağ, sola bakar)     │
│                                             │
│  ════════════════════════════════════       │
│  [kum zemin çizgisi]                        │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  > _                                 │   │
│  │  [typing input]                      │   │
│  └──────────────────────────────────────┘   │
│  [■□□□□□□□□□ progress bar — kelime]         │
└─────────────────────────────────────────────┘
```

**HUD (üst bar) detayları:**
- Background: `--bg-panel` üzerinde 1px `--stone` alt border
- "SCORE:" etiketi: 10px Press Start 2P, `--cream-muted`; skor değeri: 16px Press Start 2P, `--gold`
- Timer: merkeze hizalı, 14px Press Start 2P; sür 10sn altına düşünce kırmızıya döner ve hafif pulse animasyonu
- Timer bar: tüm genişlikte ince (6px yükseklik) progress bar; doluluk oranı saniyeye göre; renk geçişi: yeşil > sarı > kırmızı (JS ile class değiştir, CSS transition)
- "KILLS:" sağda, aynı stilde

**Arena sahnesi detayları:**
- Arka plan: `--bg-arena`
- Zeminde basit perspektif çizgisi: 2px `--sand` rengi yatay çizgi, zemin dokusunu simgele
- Sol kenarda ve sağda basit kemer/sütun silüetleri (CSS ::before ::after veya inline SVG)
- Derinlik hissi için arka planda hafif daha koyu dikdörtgen şeritler

**Kelime kutusu (düşmanın üzerinde):**
- `--bg-panel-2` background, `--stone` border 2px, 8px border-radius
- Kelime: 16px Press Start 2P, `--cream`
- Doğru yazılan harfler: `--correct` renge döner (harf harf, gerçek zamanlı)
- Yanlış harf girilince tüm kutu `shake` animasyonu (0.3s, yatay 3px titreme)

**Typing input:**
- Tam genişlik, `--bg-panel` background, `--gold` 2px border, `--cream` text
- 18px font, 16px padding, border-radius yok (sert pixel his)
- Placeholder: "Type the word..." — `--cream-muted` rengi
- Odak state: border `--gold` → `--white` geçiş
- Input'un altında: kelime progress bar (doğru yazılan harf sayısı / toplam harf) — yatay, 4px yükseklik, `--correct` renk dolumu

**Kill animasyonu (kelime doğru tamamlandığında, 0.5s):**
1. Gladyatör `attack` animasyonunu oynatır
2. Düşmanın üzerinde altın rengi "+1" floater belirir, yukarı kayarak solar (CSS keyframe)
3. Düşman `death` animasyonunu oynatır (aşağı düşer, opacity 0)
4. 0.3s sonra yeni düşman sağdan girer (slide-in animasyonu)
5. Skor +1 artar, rakam kısa süre `--gold` büyür sonra normale döner (bounce efekti)

**Yanlış yazım:**
- Input anında temizlenir
- Arena'nın kenarından kısa kırmızı flash (overlay, 0.1s opacity)
- Kelime kutusu shake animasyonu

---

### Ekran 3: Oyun Sonu (`screen-gameover`)

**Layout:**
```
┌─────────────────────────────────────────────┐
│                                             │
│         [ GAME OVER ]                       │
│      Press Start 2P, 24px, --red            │
│                                             │
│    ┌─────────────────────────────────┐      │
│    │   YOUR SCORE                    │      │
│    │      42                         │      │
│    │   KILLS: 42  |  BEST: 58        │      │
│    │   TIME: 60s  |  WPM: ~34        │      │
│    └─────────────────────────────────┘      │
│                                             │
│    [gladyatör victory pose animasyonu]      │
│                                             │
│    [  PLAY AGAIN  ]   büyük altın buton     │
│    [  LEADERBOARD ]   orta buton            │
│    [  MAIN MENU   ]   küçük buton           │
│                                             │
│  [Kayıtlı değilse: "Save your score!        │
│   Create a free account." → LOGIN butonu]   │
└─────────────────────────────────────────────┘
```

**Detaylar:**
- Ekran geçişi: oyun bitince 1s bekle, ardından `screen-gameover` görünür
- Skor kartı: `--bg-panel` background, `--stone` 2px border, 12px border-radius, iç padding 24px
- Büyük skor sayısı: 40px Press Start 2P, `--gold`, "count-up" animasyonu ile 0'dan asıl değere çıkar (1s)
- WPM hesaplama: `(toplam karakter / 5) / (60 / 60)` = kelime başına dakika tahmini
- Guest kullanıcıysa uyarı banner: `--bg-panel-2` background, `--gold` sol border (4px), "Your score won't be saved. Create a free account." metni
- PLAY AGAIN butonu aynı stilde PLAY butonu gibi

---

### Ekran 4: Leaderboard (`screen-leaderboard`)

**Layout:**
```
┌─────────────────────────────────────────────┐
│  [← BACK]           LEADERBOARD             │
│  ─────────────────────────────────────────  │
│                                             │
│  [TAB: ALL TIME]  [TAB: THIS WEEK]          │
│                                             │
│  ┌───┬────────────────┬───────┬────────┐    │
│  │ # │ PLAYER         │ SCORE │  KILLS │    │
│  ├───┼────────────────┼───────┼────────┤    │
│  │ 1 │ 👑 GladiusMax  │  187  │  187   │    │
│  │ 2 │    ArenaMaster │  164  │  164   │    │
│  │ 3 │    WordSlayer  │  151  │  151   │    │
│  │...│ ...            │  ...  │  ...   │    │
│  │ — │ [senin sıran]  │   42  │   42   │    │
│  └───┴────────────────┴───────┴────────┘    │
│                                             │
│  [Giriş yapmadıysa: LOGIN TO APPEAR HERE]   │
└─────────────────────────────────────────────┘
```

**Detaylar:**
- Header: `--bg-panel` background, "LEADERBOARD" başlığı 14px Press Start 2P, `--gold`; sol üstte ← geri butonu
- Tab bar: "ALL TIME" ve "THIS WEEK" sekmeleri; aktif tab: `--gold` alt border (3px), `--gold` text; pasif: `--cream-muted`
- Tablo: tam genişlik, header row `--bg-panel-2` background, `--stone` bottom border
- Sıra satırları: alternatif `--bg-arena` / transparan arka plan (zebra pattern)
- 1. sıra: `--gold` rengi, kupa ikonu (CSS ile altın renkli üçgen/yıldız)
- 2. sıra: gümüş (#c0c0c0)
- 3. sıra: bronz (#cd7f32)
- Geri kalan: `--cream`
- Aktif kullanıcının satırı (varsa): `--bg-panel-2` background + `--gold` sol border
- Dummy data ile başlar (Supabase entegrasyonuna kadar), en az 10 satır
- Giriş yapmamış kullanıcılar listede görünmez; altta "Login to save your score and appear on the leaderboard." banner

---

### Ekran 5: Login / Register Modal (`modal-auth`)

**Yapı:**
Modal olarak değil, tam ekran overlay olarak çalışır (z-index: 100). Arka planı `rgba(0,0,0,0.85)` koyu overlay. Merkeze hizalı bir kart içinde form.

**Layout:**
```
┌─────────────────────────────────────────────┐
│  [koyu overlay]                             │
│                                             │
│       ┌──────────────────────────┐          │
│       │  ⚔  WORD GLADIATOR      │          │
│       │                          │          │
│       │  [LOGIN]  [REGISTER]     │          │
│       │  (tab geçişi)            │          │
│       │                          │          │
│       │  Username                │          │
│       │  [________________]      │          │
│       │                          │          │
│       │  Password                │          │
│       │  [________________]      │          │
│       │                          │          │
│       │  [ ENTER THE ARENA ]     │          │
│       │                          │          │
│       │  ── or continue as ──    │          │
│       │  [ PLAY AS GUEST ]       │          │
│       │                          │          │
│       │  [X kapat]               │          │
│       └──────────────────────────┘          │
└─────────────────────────────────────────────┘
```

**Detaylar:**
- Kart: `--bg-panel` background, `--stone` 2px border, 16px border-radius, max-width: 400px, padding 32px
- Mini logo tekrar: 14px Press Start 2P, `--gold`, ⚔ sembolü
- Tab bar (LOGIN / REGISTER): seçili tab `--gold` alt border + renk
- Input alanları: `--bg-arena` background, `--stone` 1px border, `--cream` text, 14px, 12px padding, border-radius 4px; focus: `--gold` border
- Label: 10px Press Start 2P, `--cream-muted`, margin-bottom 6px
- "ENTER THE ARENA" butonu: `--gold` background, `--bg-deep` text, 12px Press Start 2P, tam genişlik, 14px padding, `4px 4px 0 #8b5500` box-shadow
- "PLAY AS GUEST" butonu: transparan, `--stone` border, `--cream-muted` text, tam genişlik
- Ayırıcı "or continue as": küçük yatay çizgi + metin, `--cream-muted`, 11px
- Hata mesajı alanı (boş başlar): `--red` rengi, 12px, input'un üstüne çıkar
- X (kapat) butonu: sağ üst köşe, `--cream-muted`, hover `--cream`
- Kapanırken overlay tıklanınca da kapanır

---

## CSS Animasyonları (Zorunlu)

```css
@keyframes bob {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-4px); }
}

@keyframes attack {
  0%   { transform: translateX(0) rotate(0deg); }
  30%  { transform: translateX(12px) rotate(-15deg); }
  60%  { transform: translateX(20px) rotate(10deg); }
  100% { transform: translateX(0) rotate(0deg); }
}

@keyframes death {
  0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
  50%  { transform: translateY(20px) rotate(30deg); opacity: 0.6; }
  100% { transform: translateY(60px) rotate(90deg); opacity: 0; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-4px); }
  40%       { transform: translateX(4px); }
  60%       { transform: translateX(-3px); }
  80%       { transform: translateX(3px); }
}

@keyframes floatUp {
  0%   { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-40px); opacity: 0; }
}

@keyframes scorePopIn {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.4); color: #ffb347; }
  100% { transform: scale(1); }
}

@keyframes countUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.2; }
  50%       { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.05); }
}

@keyframes slideInRight {
  from { transform: translateX(80px); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}

@keyframes screenFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes timerFlash {
  0%, 100% { color: #cc2936; }
  50%       { color: #ff6666; }
}
```

---

## JavaScript Oyun Mantığı

### Kelime Havuzu
En az 100 İngilizce kelime, 3 zorluk seviyesine göre ayrılmış:
- `easy` (3-4 harf): cat, dog, run, jump, fire, word, kill, fast, hero, gold...
- `medium` (5-7 harf): sword, arena, battle, knight, shield, strike, warrior...
- `hard` (8+ harf): gladiator, champion, conquer, dominate, legendary...

İlk 10 saniye `easy`, 10-30s arası `medium`, 30s+ `hard` kelimeler ağırlıklı gelir. `Math.random()` ile seçilir.

### Oyun Döngüsü
```javascript
const GAME_DURATION = 60;
let score = 0;
let kills = 0;
let timeLeft = GAME_DURATION;
let currentWord = '';
let currentEnemy = null;
let gameTimer = null;
let isGameActive = false;

function startGame() { ... }
function spawnEnemy() { ... }   // rastgele tip + rastgele kelime
function handleInput(e) { ... } // harf harf kontrol, doğruysa yeşile boya
function killEnemy() { ... }    // animasyon + skor + yeni düşman
function wrongInput() { ... }   // temizle + shake + red flash
function endGame() { ... }      // timer bitti, skor ekranına geç
function tick() { ... }         // her saniye çağrılır
```

### Input Kontrolü (Gerçek Zamanlı)
- `input` event dinle (keypress değil)
- Her tuş basışında: `currentWord`'ün o pozisyondaki harfle karşılaştır
- Doğruysa: o harfi yeşile boya, devam et
- Yanlışsa: `wrongInput()` çağır, input'u temizle, sıfırdan başla
- Tüm kelime tamamlandıysa: `killEnemy()` çağır

### Skor Sistemi
- Her kill: +1 skor, +1 kills sayacı
- WPM hesabı: oyun sonunda `(toplam karakter sayısı / 5) / 1` (1 dakika oyun)
- Best skor: `localStorage`'da saklanır (Supabase entegrasyonuna kadar)

---

## Dosya Yapısı

Tek bir `index.html` dosyası:
```
index.html
├── <head>: Press Start 2P font, inline <style>
└── <body>
    ├── <div id="app">
    │   ├── <div id="screen-menu">
    │   ├── <div id="screen-game">
    │   ├── <div id="screen-gameover">
    │   ├── <div id="screen-leaderboard">
    │   └── <div id="modal-auth">
    └── <script> (tüm oyun mantığı)
```

---

## Teknik Gereksinimler

1. Harici kütüphane yok — sadece vanilla HTML/CSS/JS
2. Google Fonts (Press Start 2P) tek dış kaynak
3. Tüm renkler yukarıdaki palette'den — başka hex kullanma
4. Her ekran geçişinde 0.3s `screenFade` animasyonu
5. Oyun başladığında input'a otomatik focus
6. Klavye: `Escape` ile menüye dön, modal kapatır
7. `localStorage` ile best score sakla
8. Responsive değil — masaüstü odaklı (min-width: 800px varsay, merkeze al)
9. Leaderboard için şimdilik mock data (10 kayıt), Supabase entegrasyonuna hazır yapı
10. Auth için şimdilik mock login (localStorage'da kullanıcı adı sakla), Supabase'e geçişe hazır

---

## Çıktı Beklentisi

Tek, çalışan `index.html` dosyası. Tarayıcıda açıldığında:
- Ana menü görünür, karakterler idle animasyonunda
- PLAY'e tıklanınca oyun başlar, input otomatik focus alır
- Kelime yazılınca gerçek zamanlı renk değişir
- Kelime tamamlanınca kill animasyonu oynar, yeni düşman gelir
- 60 saniye sonra game over ekranı gelir
- Leaderboard mock data gösterir
- Login modal açılıp kapanır

Kod temiz, yorumlu ve Claude Code ile Supabase entegrasyonuna hazır olacak şekilde yazılmalıdır.
