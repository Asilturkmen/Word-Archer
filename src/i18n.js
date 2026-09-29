// ── i18n ── t('key', { var }) -> "{var}" yer tutucuları doldurulur.
export const STR = {
  en: {
    titleSuffix: 'Typing Arena',
    tagline: 'Master of words. Ruler of the arena.',
    play: 'PLAY', playAgain: 'PLAY AGAIN', mainMenu: 'Main menu', back: 'Back', done: 'Done', cancel: 'Cancel', close: 'Close',
    leaderboard: 'Leaderboard', stats: 'Stats', howTo: 'How to play', settings: 'Settings',
    language: 'Language', mute: 'Mute', unmute: 'Unmute', editName: 'Change nickname',
    mode: 'Mode', duration: 'Duration', difficulty: 'Difficulty',
    mode_classic: 'Classic', mode_classic_desc: 'Beat the clock',
    mode_survival: 'Survival', mode_survival_desc: '3 hearts, endless waves',
    mode_daily: 'Daily', mode_daily_desc: 'Same words for all',
    mode_zen: 'Practice', mode_zen_desc: 'No timer, no pressure',
    diff_easy: 'Easy', diff_normal: 'Normal', diff_hard: 'Hard',
    dailyNote: "Today's challenge ({date}) · 60s · everyone gets the same words",
    yourBest: 'Your best',
    touchNote: 'Best with a physical keyboard. Tap the arena to open your keyboard.',
    rotateNote: 'Turn your device sideways for a bigger arena.',

    // oyun
    score: 'SCORE', kills: 'Kills', level: 'Level', lv: 'Lv', hearts: '{n} hearts left',
    comboHint: 'Combo: chain correct words to raise the multiplier (x2 at 5, x3 at 15, x4 at 30)',
    comboUp: 'COMBO x{n}!', comboBroken: 'Combo broken',
    pause: 'Pause', restart: 'Restart', finish: 'Finish', finishRound: 'Finish round', resume: 'Resume',
    paused: 'PAUSED', pausedHint: 'Click anywhere or press Enter to continue.',
    startTyping: 'Start typing — the clock starts with your first letter',
    spaceToSubmit: 'Space submits a word · Esc pauses',
    typeHere: 'Type the words here',
    timeUp: "TIME'S UP!", defeated: 'DEFEATED', finished: 'FINISHED',
    enemy_goblin: 'Goblin', enemy_skeleton: 'Skeleton', enemy_elite: 'Skeleton Captain',

    // sonuç
    newRecord: 'NEW RECORD!', roundComplete: 'ROUND COMPLETE', unranked: 'not ranked',
    prevBest: 'Previous best', firstRecord: 'First record on this board!',
    accuracy: 'Accuracy', accuracyShort: 'Acc.', rawWpm: 'Raw WPM', raw: 'raw', bestCombo: 'Best combo', words: 'Words',
    errors: 'errors', wpmOverTime: 'Speed over time', notEnoughData: 'Not enough data for a chart',
    missedWords: 'Missed words', noMisses: 'Flawless — no missed words!',
    share: 'Share', copied: 'Result copied to clipboard', copyFailed: 'Could not copy',
    shareText: 'Word Archer 🏹 {mode} — {score} points · {wpm} WPM · {acc}% accuracy.',
    online_sending: 'Sending to the global leaderboard…', online_sent: 'Posted to the global leaderboard', online_error: 'Could not reach the global leaderboard',
    achUnlocked: 'Achievement unlocked',

    // sıralama
    source: 'Source', global: 'Global', myRecords: 'My records', period: 'Period', allTime: 'All time', thisWeek: 'This week',
    player: 'Player', date: 'Date', loading: 'Loading…', loadFailed: 'Could not load the leaderboard. Check your connection.',
    noLocalRecords: 'No records yet — play a round!', noGlobalRecords: 'No scores yet. Be the first!',
    boardLangNote: '{lang} word boards · separate board per difficulty',
    localOnlyNote: 'Records are stored on this device.',

    // istatistik
    gamesPlayed: 'Games', timePlayed: 'Time', wordsTyped: 'Words', bestWpm: 'Best WPM', avgWpm: 'Avg WPM',
    avgAcc: 'Avg acc.', totalKills: 'Kills', wpmTrend: 'WPM — last 30 games', playMore: 'Play a few rounds to see your trend',
    achievements: 'Achievements', hShort: 'h', mShort: 'm',

    // başarımlar
    ach_first_blood: 'First Blood', ach_first_blood_desc: 'Defeat your first enemy',
    ach_combo_10: 'On a Roll', ach_combo_10_desc: 'Reach a 10-word combo',
    ach_combo_25: 'Unstoppable', ach_combo_25_desc: 'Reach a 25-word combo',
    ach_combo_50: 'Legendary Streak', ach_combo_50_desc: 'Reach a 50-word combo',
    ach_wpm_40: 'Swift Hands', ach_wpm_40_desc: 'Finish a round at 40+ WPM',
    ach_wpm_60: 'Quick Draw', ach_wpm_60_desc: 'Finish a round at 60+ WPM',
    ach_wpm_80: 'Eagle Eye', ach_wpm_80_desc: 'Finish a round at 80+ WPM',
    ach_wpm_100: 'Master Archer', ach_wpm_100_desc: 'Finish a round at 100+ WPM',
    ach_perfect: 'Bullseye', ach_perfect_desc: '100% accuracy with 20+ words',
    ach_survivor: 'Survivor', ach_survivor_desc: 'Reach level 10 in Survival',
    ach_daily: 'Daily Duty', ach_daily_desc: 'Complete a Daily Challenge',
    ach_veteran: 'Veteran', ach_veteran_desc: 'Play 25 rounds',
    ach_slayer: 'Slayer', ach_slayer_desc: 'Defeat 100 enemies in total',

    // ayarlar
    nickname: 'Nickname', nicknameHint: 'Shown on your records.', nicknameHintOnline: 'Shown on the global leaderboard.',
    nameInvalid: '2–16 characters: letters, numbers, space, _ . -',
    volume: 'Sound', liveWpm: 'Show live WPM', screenShake: 'Screen shake', reduceMotion: 'Reduce motion', followsSystem: 'Following your system setting',
    resetData: 'Reset all data', resetConfirm: 'Delete all records, stats and achievements?', resetYes: 'Yes, delete', resetDone: 'All data was reset',

    // yardım
    helpLead: 'Type the words as fast and as accurately as you can. Every correct word fires an arrow at the enemy.',
    help1: 'Type a word, then press Space. A correct word fires an arrow; a wrong one is a miss.',
    help2: 'Chain correct words for a combo: x2 at 5, x3 at 15, x4 at 30. Higher combos hit harder and score more. A miss resets it.',
    help3: 'Empty an enemy’s health bar to defeat it and earn a bonus. Every 5th enemy is a tougher captain.',
    help4: 'Survival: enemies march toward you. If one reaches you, you lose a heart. Hits push them back.',
    help5: 'Daily Challenge: everyone gets the same words today. Come back tomorrow for a new set.',
    shortcuts: 'Shortcuts', gotIt: 'Got it!',
    keySubmit: 'submit word', keyDelWord: 'delete word', keyPause: 'pause / resume', keyRestart: 'quick restart', keyPlay: 'play (menu & results)',
    credits: 'Art',
  },
  tr: {
    titleSuffix: 'Yazma Arenası',
    tagline: 'Kelimelerin ustası ol. Arenanın hâkimi.',
    play: 'OYNA', playAgain: 'TEKRAR OYNA', mainMenu: 'Ana menü', back: 'Geri', done: 'Tamam', cancel: 'Vazgeç', close: 'Kapat',
    leaderboard: 'Sıralama', stats: 'İstatistikler', howTo: 'Nasıl oynanır', settings: 'Ayarlar',
    language: 'Dil', mute: 'Sesi kapat', unmute: 'Sesi aç', editName: 'Takma adı değiştir',
    mode: 'Mod', duration: 'Süre', difficulty: 'Zorluk',
    mode_classic: 'Klasik', mode_classic_desc: 'Zamana karşı yarış',
    mode_survival: 'Hayatta Kal', mode_survival_desc: '3 can, bitmeyen dalgalar',
    mode_daily: 'Günlük', mode_daily_desc: 'Herkese aynı kelimeler',
    mode_zen: 'Pratik', mode_zen_desc: 'Süre yok, baskı yok',
    diff_easy: 'Kolay', diff_normal: 'Normal', diff_hard: 'Zor',
    dailyNote: 'Günün meydan okuması ({date}) · 60 sn · herkese aynı kelimeler',
    yourBest: 'Rekorun',
    touchNote: 'En iyisi fiziksel klavyeyle oynamak. Klavyeyi açmak için arenaya dokun.',
    rotateNote: 'Daha büyük bir arena için cihazını yan çevir.',

    score: 'SKOR', kills: 'Öldürme', level: 'Seviye', lv: 'Sv', hearts: '{n} can kaldı',
    comboHint: 'Kombo: art arda doğru kelimeler çarpanı artırır (5’te x2, 15’te x3, 30’da x4)',
    comboUp: 'KOMBO x{n}!', comboBroken: 'Kombo bozuldu',
    pause: 'Duraklat', restart: 'Yeniden başlat', finish: 'Bitir', finishRound: 'Turu bitir', resume: 'Devam et',
    paused: 'DURAKLATILDI', pausedHint: 'Devam etmek için herhangi bir yere tıkla ya da Enter’a bas.',
    startTyping: 'Yazmaya başla — süre ilk harfle başlar',
    spaceToSubmit: 'Boşluk kelimeyi gönderir · Esc duraklatır',
    typeHere: 'Kelimeleri buraya yaz',
    timeUp: 'SÜRE DOLDU!', defeated: 'YENİLDİN', finished: 'BİTTİ',
    enemy_goblin: 'Goblin', enemy_skeleton: 'İskelet', enemy_elite: 'İskelet Kaptan',

    newRecord: 'YENİ REKOR!', roundComplete: 'TUR TAMAMLANDI', unranked: 'sıralamaya sayılmaz',
    prevBest: 'Önceki rekor', firstRecord: 'Bu tablodaki ilk rekorun!',
    accuracy: 'Doğruluk', accuracyShort: 'Doğr.', rawWpm: 'Ham WPM', raw: 'ham', bestCombo: 'En iyi kombo', words: 'Kelime',
    errors: 'hata', wpmOverTime: 'Zamana göre hız', notEnoughData: 'Grafik için yeterli veri yok',
    missedWords: 'Kaçırılan kelimeler', noMisses: 'Kusursuz — hiç kelime kaçırmadın!',
    share: 'Paylaş', copied: 'Sonuç panoya kopyalandı', copyFailed: 'Kopyalanamadı',
    shareText: 'Word Archer 🏹 {mode} — {score} puan · {wpm} WPM · %{acc} doğruluk.',
    online_sending: 'Global sıralamaya gönderiliyor…', online_sent: 'Global sıralamaya eklendi', online_error: 'Global sıralamaya ulaşılamadı',
    achUnlocked: 'Başarım açıldı',

    source: 'Kaynak', global: 'Global', myRecords: 'Rekorlarım', period: 'Dönem', allTime: 'Tüm zamanlar', thisWeek: 'Bu hafta',
    player: 'Oyuncu', date: 'Tarih', loading: 'Yükleniyor…', loadFailed: 'Sıralama yüklenemedi. Bağlantını kontrol et.',
    noLocalRecords: 'Henüz rekor yok — bir tur oyna!', noGlobalRecords: 'Henüz skor yok. İlk sen ol!',
    boardLangNote: '{lang} kelime tabloları · her zorluk ayrı tablo',
    localOnlyNote: 'Rekorlar bu cihazda saklanır.',

    gamesPlayed: 'Oyun', timePlayed: 'Süre', wordsTyped: 'Kelime', bestWpm: 'En iyi WPM', avgWpm: 'Ort. WPM',
    avgAcc: 'Ort. doğr.', totalKills: 'Öldürme', wpmTrend: 'WPM — son 30 oyun', playMore: 'Gelişimini görmek için birkaç tur oyna',
    achievements: 'Başarımlar', hShort: 'sa', mShort: 'dk',

    ach_first_blood: 'İlk Kan', ach_first_blood_desc: 'İlk düşmanını yen',
    ach_combo_10: 'Seri Başladı', ach_combo_10_desc: '10 kelimelik komboya ulaş',
    ach_combo_25: 'Durdurulamaz', ach_combo_25_desc: '25 kelimelik komboya ulaş',
    ach_combo_50: 'Efsanevi Seri', ach_combo_50_desc: '50 kelimelik komboya ulaş',
    ach_wpm_40: 'Çevik Eller', ach_wpm_40_desc: 'Bir turu 40+ WPM ile bitir',
    ach_wpm_60: 'Hızlı Nişancı', ach_wpm_60_desc: 'Bir turu 60+ WPM ile bitir',
    ach_wpm_80: 'Kartal Gözü', ach_wpm_80_desc: 'Bir turu 80+ WPM ile bitir',
    ach_wpm_100: 'Usta Okçu', ach_wpm_100_desc: 'Bir turu 100+ WPM ile bitir',
    ach_perfect: 'Tam İsabet', ach_perfect_desc: '20+ kelimede %100 doğruluk',
    ach_survivor: 'Hayatta Kalan', ach_survivor_desc: 'Hayatta Kal’da 10. seviyeye ulaş',
    ach_daily: 'Günlük Görev', ach_daily_desc: 'Bir Günlük Meydan Okuma tamamla',
    ach_veteran: 'Kıdemli', ach_veteran_desc: '25 tur oyna',
    ach_slayer: 'Avcı', ach_slayer_desc: 'Toplam 100 düşman yen',

    nickname: 'Takma ad', nicknameHint: 'Rekorlarında görünür.', nicknameHintOnline: 'Global sıralamada görünür.',
    nameInvalid: '2–16 karakter: harf, rakam, boşluk, _ . -',
    volume: 'Ses', liveWpm: 'Anlık WPM göster', screenShake: 'Ekran sarsıntısı', reduceMotion: 'Hareketleri azalt', followsSystem: 'Sistem ayarını izliyor',
    resetData: 'Tüm verileri sıfırla', resetConfirm: 'Tüm rekorlar, istatistikler ve başarımlar silinsin mi?', resetYes: 'Evet, sil', resetDone: 'Tüm veriler sıfırlandı',

    helpLead: 'Kelimeleri olabildiğince hızlı ve doğru yaz. Her doğru kelime düşmana bir ok fırlatır.',
    help1: 'Kelimeyi yaz, sonra Boşluk’a bas. Doğru kelime ok fırlatır; yanlışı ıskalama sayılır.',
    help2: 'Art arda doğru kelimelerle kombo yap: 5’te x2, 15’te x3, 30’da x4. Yüksek kombo daha çok hasar ve puan demek. Bir hata komboyu sıfırlar.',
    help3: 'Düşmanın can barını bitir, yen ve bonus kazan. Her 5. düşman daha güçlü bir kaptandır.',
    help4: 'Hayatta Kal: düşmanlar sana doğru yürür. Biri sana ulaşırsa bir can kaybedersin. Vuruşlar onları geri iter.',
    help5: 'Günlük Meydan Okuma: bugün herkese aynı kelimeler gelir. Yarın yeni bir set için geri gel.',
    shortcuts: 'Kısayollar', gotIt: 'Anladım!',
    keySubmit: 'kelimeyi gönder', keyDelWord: 'kelimeyi sil', keyPause: 'duraklat / devam', keyRestart: 'hızlı yeniden başlat', keyPlay: 'oyna (menü ve sonuç)',
    credits: 'Görseller',
  },
}

export function makeT(lang) {
  const dict = STR[lang] || STR.en
  return (key, vars) => {
    let s = dict[key] ?? STR.en[key] ?? key
    if (vars) for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]))
    return s
  }
}
