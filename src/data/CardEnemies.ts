export type EnemyActionType = 'attack' | 'defend' | 'buff' | 'debuff' | 'special'

export interface EnemyAction {
  type: EnemyActionType
  value: number
  effectKey?: string
  label: string
  icon: string
}

export interface EnemyDef {
  id: string
  name: string
  pokemonName: string
  spriteId: string
  maxHp: number
  pattern: EnemyAction[]
  rewardGold: number
  rewardExp?: number
  isBoss?: boolean
}

const atk = (v: number, label?: string): EnemyAction => ({ type: 'attack', value: v, label: label ?? `Ataca ${v}`, icon: '⚔️' })
const def = (v: number): EnemyAction => ({ type: 'defend', value: v, label: `Escudo ${v}`, icon: '🛡️' })
const dbf = (label: string, key: string, v = 0): EnemyAction => ({ type: 'debuff', value: v, effectKey: key, label, icon: '☠️' })
const bf  = (label: string, key: string, v = 0): EnemyAction => ({ type: 'buff',   value: v, effectKey: key, label, icon: '✨' })

// ── Floors 1-3 (normal enemies) ──────────────────────────────────────────────
export const FLOOR_ENEMIES: EnemyDef[][] = [
  // floor 1
  [
    { id: 'rattata',   name: 'Rattata',   pokemonName: 'rattata',   spriteId: 'rattata',   maxHp: 28, rewardGold: 12, pattern: [atk(6), atk(8), atk(6)] },
    { id: 'pidgey',    name: 'Pidgey',    pokemonName: 'pidgey',    spriteId: 'pidgey',    maxHp: 25, rewardGold: 10, pattern: [atk(5), atk(7), def(4), atk(6)] },
    { id: 'caterpie',  name: 'Caterpie',  pokemonName: 'caterpie',  spriteId: 'caterpie',  maxHp: 22, rewardGold: 8,  pattern: [atk(4), def(6), atk(4), atk(4)] },
  ],
  // floor 2
  [
    { id: 'ekans',     name: 'Ekans',     pokemonName: 'ekans',     spriteId: 'ekans',     maxHp: 35, rewardGold: 15, pattern: [atk(8), dbf('Veneno', 'poison_dot', 3), atk(8), atk(10)] },
    { id: 'geodude',   name: 'Geodude',   pokemonName: 'geodude',   spriteId: 'geodude',   maxHp: 42, rewardGold: 14, pattern: [def(12), atk(10), atk(10), def(8)] },
    { id: 'drowzee',   name: 'Drowzee',   pokemonName: 'drowzee',   spriteId: 'drowzee',   maxHp: 32, rewardGold: 13, pattern: [atk(7), dbf('Confunde', 'confuse', 0), atk(9), atk(7)] },
  ],
  // floor 3
  [
    { id: 'machop',    name: 'Machop',    pokemonName: 'machop',    spriteId: 'machop',    maxHp: 48, rewardGold: 18, pattern: [atk(12), atk(10), bf('Furia +4 atq','atk_buff', 4), atk(16)] },
    { id: 'haunter_e', name: 'Haunter',   pokemonName: 'haunter',   spriteId: 'haunter',   maxHp: 38, rewardGold: 18, pattern: [atk(8), dbf('Maldice','curse_dot', 5), atk(10), atk(8)] },
    { id: 'ponyta',    name: 'Ponyta',    pokemonName: 'ponyta',    spriteId: 'ponyta',    maxHp: 40, rewardGold: 16, pattern: [atk(10), dbf('Quema','burn_dot', 3), atk(12), atk(10)] },
  ],
  // floor 4 (elite)
  [
    { id: 'kadabra',   name: 'Kadabra',   pokemonName: 'kadabra',   spriteId: 'kadabra',   maxHp: 55, rewardGold: 25, pattern: [atk(14), dbf('Confunde','confuse', 0), atk(16), bf('Psíquico','atk_buff',6), atk(18)] },
    { id: 'growlithe', name: 'Arcanine',  pokemonName: 'arcanine',  spriteId: 'arcanine',  maxHp: 65, rewardGold: 28, pattern: [atk(14), dbf('Quema','burn_dot',4), atk(18), atk(20)] },
    { id: 'graveler',  name: 'Graveler',  pokemonName: 'graveler',  spriteId: 'graveler',  maxHp: 70, rewardGold: 26, pattern: [def(18), atk(16), atk(16), def(14), atk(20)] },
  ],
  // floor 5 (elite)
  [
    { id: 'cloyster',  name: 'Cloyster',  pokemonName: 'cloyster',  spriteId: 'cloyster',  maxHp: 60, rewardGold: 30, pattern: [def(22), atk(14), atk(14), def(18), atk(18)] },
    { id: 'electabuzz',name: 'Electabuzz',pokemonName: 'electabuzz',spriteId: 'electabuzz',maxHp: 65, rewardGold: 32, pattern: [atk(18), dbf('Paraliza','paralyze',0), atk(20), atk(22)] },
    { id: 'gengar_e',  name: 'Gengar',    pokemonName: 'gengar',    spriteId: 'gengar',    maxHp: 55, rewardGold: 35, pattern: [atk(12), dbf('Maldice','curse_dot',6), atk(16), dbf('Maldice','curse_dot',6), atk(20)] },
  ],
]

// ── Boss pool (floor 6) ───────────────────────────────────────────────────────
export const BOSSES: EnemyDef[] = [
  {
    id: 'giovanni',
    name: 'Giovanni',
    pokemonName: 'nidoking',
    spriteId: 'nidoking',
    maxHp: 130,
    rewardGold: 80,
    isBoss: true,
    pattern: [
      atk(20, 'Megapatada 20'),
      def(20),
      dbf('Tóxico', 'toxic_dot', 8),
      atk(25, 'Terremoto 25'),
      bf('Fortalece', 'atk_buff', 8),
      atk(30, 'Terremoto 30'),
    ]
  },
  {
    id: 'misty',
    name: 'Misty',
    pokemonName: 'starmie',
    spriteId: 'starmie',
    maxHp: 110,
    rewardGold: 80,
    isBoss: true,
    pattern: [
      atk(18, 'Pistola Agua 18'),
      atk(18, 'Pistola Agua 18'),
      bf('Recupera', 'heal_self', 20),
      atk(24, 'Hidrobomba 24'),
      dbf('Congela', 'freeze', 0),
      atk(28, 'Hidrobomba 28'),
    ]
  },
  {
    id: 'blaine',
    name: 'Blaine',
    pokemonName: 'arcanine',
    spriteId: 'arcanine',
    maxHp: 120,
    rewardGold: 80,
    isBoss: true,
    pattern: [
      atk(18, 'Llamarada 18'),
      dbf('Quema', 'burn_dot', 5),
      atk(22, 'Llamarada 22'),
      bf('Furia', 'atk_buff', 10),
      atk(28, 'Llamarada 28'),
      dbf('Quema', 'burn_dot', 5),
    ]
  },
]

export function getEnemiesForFloor(floor: number): EnemyDef[] {
  const idx = Math.min(floor - 1, FLOOR_ENEMIES.length - 1)
  return FLOOR_ENEMIES[Math.max(0, idx)]
}

export function getRandomEnemy(floor: number): EnemyDef {
  const pool = getEnemiesForFloor(floor)
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getRandomBoss(): EnemyDef {
  return BOSSES[Math.floor(Math.random() * BOSSES.length)]
}

export function getEnemyByName(pokemonName: string, act: number = 1): EnemyDef {
  const key = pokemonName.toLowerCase()
  // Search existing pool
  for (const floor of FLOOR_ENEMIES) {
    const found = floor.find(e => e.pokemonName === key)
    if (found) return found
  }
  const bossFound = BOSSES.find(e => e.pokemonName === key)
  if (bossFound) return bossFound

  // Procedural enemy scaled by act
  const hp   = [22, 45, 70][act - 1] ?? 30
  const a1   = [7,  13, 20][act - 1] ?? 8
  const a2   = [10, 18, 26][act - 1] ?? 12
  const gold = [12, 20, 30][act - 1] ?? 14
  return {
    id: key,
    name: pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1),
    pokemonName: key,
    spriteId: key,
    maxHp: hp,
    rewardGold: gold,
    pattern: [atk(a1), atk(a2), def(Math.round(a1 * 0.8)), atk(a2)],
  }
}
