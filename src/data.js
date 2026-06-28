// ── Dile göre kelime havuzları ──
export const WORDS = {
  en: {
    easy: ['cat','dog','run','hit','war','bow','axe','cut','jab','fire','hero','word','kill','fast','gold','iron','bold','slam','stab','bash','rush','draw','duel','fall','rise'],
    medium: ['sword','arena','battle','knight','shield','strike','warrior','helmet','combat','charge','parry','thrust','valor','spear','armor','legion','caesar','gladius'],
    hard: ['gladiator','champion','conqueror','colosseum','centurion','tournament','victorious','combatant','invincible','domination','legendary','undefeated','unstoppable'],
  },
  tr: {
    easy: ['kan','kor','taş','dağ','kül','buz','yel','hız','güç','kin','zar','sert','vur','kes','can','ok','han','okla','kale'],
    medium: ['kılıç','kalkan','savaş','balta','hançer','arena','öfke','vahşi','cesur','demir','mızrak','güçlü','korkunç','galip','yılmaz','onurlu','dövüş'],
    hard: ['gladyatör','şampiyon','acımasız','efsanevi','yenilmez','imparator','lejyoner','muhteşem','hükümdar','savaşçı','komutan','barbarlık','amansız','dehşetli'],
  },
}

// ── Sahte sıralama tablosu (fetchLeaderboard ile değiştirilecek) ──
export const LB_ALL = [
  { name: 'GladiusMax', score: 210 }, { name: 'ArenaMaster', score: 187 }, { name: 'WordSlayer', score: 164 },
  { name: 'IronType', score: 151 }, { name: 'FuryKeys', score: 138 }, { name: 'RomanRush', score: 122 },
  { name: 'SwiftBlade', score: 109 }, { name: 'KeyCaesar', score: 97 }, { name: 'RapidVandal', score: 85 }, { name: 'TypeTitan', score: 74 },
]
export const LB_WEEK = [
  { name: 'FuryKeys', score: 148 }, { name: 'NovaStrike', score: 133 }, { name: 'GladiusMax', score: 121 },
  { name: 'QuickQuill', score: 112 }, { name: 'WordSlayer', score: 100 }, { name: 'EmberType', score: 89 },
  { name: 'RomanRush', score: 81 }, { name: 'BladeDance', score: 72 }, { name: 'KeyCaesar', score: 65 }, { name: 'SwiftBlade', score: 59 },
]
