// Per dex ID: list of (level, move) pairs. On levelUp matching level, learn it.
export interface LearnEntry { level: number; move: string }

export const LEARNSET: Record<number, LearnEntry[]> = {
  1:   [{ level: 7, move: 'Vine Whip' },   { level: 13, move: 'Razor Leaf' }],
  2:   [{ level: 20, move: 'Razor Leaf' }],
  4:   [{ level: 7, move: 'Ember' },       { level: 17, move: 'Flamethrower' }],
  5:   [{ level: 24, move: 'Flamethrower' }],
  7:   [{ level: 7, move: 'Water Gun' },   { level: 19, move: 'Hydro Pump' }],
  8:   [{ level: 24, move: 'Hydro Pump' }],
  16:  [{ level: 9, move: 'Wing Attack' }],
  19:  [{ level: 7, move: 'Quick Attack' },{ level: 14, move: 'Bite' }],
  25:  [{ level: 9, move: 'Thunder Shock' },{ level: 20, move: 'Thunderbolt' }],
  26:  [{ level: 25, move: 'Thunderbolt' }],
  41:  [{ level: 10, move: 'Wing Attack' },{ level: 19, move: 'Bite' }],
  54:  [{ level: 16, move: 'Water Gun' },  { level: 28, move: 'Confusion' }],
  60:  [{ level: 19, move: 'Hydro Pump' }],
  63:  [{ level: 22, move: 'Psychic' }],
  66:  [{ level: 13, move: 'Karate Chop' },{ level: 20, move: 'Headbutt' }],
  74:  [{ level: 11, move: 'Rock Throw' }],
  77:  [{ level: 14, move: 'Ember' }],
  79:  [{ level: 18, move: 'Confusion' }],
  92:  [{ level: 13, move: 'Confusion' }],
  129: [{ level: 15, move: 'Tackle' }],
  130: [{ level: 20, move: 'Bite' },       { level: 25, move: 'Hydro Pump' }],
  133: [{ level: 8, move: 'Quick Attack' },{ level: 16, move: 'Bite' }]
}
