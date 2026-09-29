// Başarımlar. check(run, totals) -> true ise açılır. Metinler i18n'de (ach.<id>).
const valid = (r) => r.elapsed >= 15000 // çok kısa turlar WPM başarımı açmasın

export const ACHIEVEMENTS = [
  { id: 'first_blood', icon: 'sword', check: (r) => r.kills >= 1 },
  { id: 'combo_10', icon: 'flame', check: (r) => r.bestStreak >= 10 },
  { id: 'combo_25', icon: 'flame', check: (r) => r.bestStreak >= 25 },
  { id: 'combo_50', icon: 'flame', check: (r) => r.bestStreak >= 50 },
  { id: 'wpm_40', icon: 'bolt', check: (r) => valid(r) && r.wpm >= 40 },
  { id: 'wpm_60', icon: 'bolt', check: (r) => valid(r) && r.wpm >= 60 },
  { id: 'wpm_80', icon: 'bolt', check: (r) => valid(r) && r.wpm >= 80 },
  { id: 'wpm_100', icon: 'bolt', check: (r) => valid(r) && r.wpm >= 100 },
  { id: 'perfect', icon: 'target', check: (r) => r.acc === 100 && r.correctWords >= 20 },
  { id: 'survivor', icon: 'heart', check: (r) => r.mode === 'survival' && r.level >= 10 },
  { id: 'daily', icon: 'calendar', check: (r) => r.mode === 'daily' && r.endReason === 'time' },
  { id: 'veteran', icon: 'shield', check: (r, t) => t.games >= 25 },
  { id: 'slayer', icon: 'skull', check: (r, t) => t.kills >= 100 },
]

export function newlyUnlocked(run, totals, unlocked) {
  return ACHIEVEMENTS.filter((a) => !unlocked[a.id] && a.check(run, totals)).map((a) => a.id)
}
