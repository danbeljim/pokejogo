import { PokemonType } from './Types'

export interface EvolutionTarget {
  level: number
  toDexId: number
  toName: string
  toType: PokemonType
  statBonusDelta: number  // flat bonus added to statBonus on evolution
}

// statBonusDelta: stage1→2 = +8, stage2→3 = +7 (from EVO_BONUS [0,8,15])
export const EVOLUTIONS: Record<number, EvolutionTarget> = {
  1:   { level: 16, toDexId: 2,   toName: 'Ivysaur',    toType: 'grass',    statBonusDelta: 8 },
  2:   { level: 32, toDexId: 3,   toName: 'Venusaur',   toType: 'grass',    statBonusDelta: 7 },
  4:   { level: 16, toDexId: 5,   toName: 'Charmeleon', toType: 'fire',     statBonusDelta: 8 },
  5:   { level: 36, toDexId: 6,   toName: 'Charizard',  toType: 'fire',     statBonusDelta: 7 },
  7:   { level: 16, toDexId: 8,   toName: 'Wartortle',  toType: 'water',    statBonusDelta: 8 },
  8:   { level: 36, toDexId: 9,   toName: 'Blastoise',  toType: 'water',    statBonusDelta: 7 },
  16:  { level: 18, toDexId: 17,  toName: 'Pidgeotto',  toType: 'flying',   statBonusDelta: 8 },
  17:  { level: 36, toDexId: 18,  toName: 'Pidgeot',    toType: 'flying',   statBonusDelta: 7 },
  19:  { level: 20, toDexId: 20,  toName: 'Raticate',   toType: 'normal',   statBonusDelta: 8 },
  21:  { level: 20, toDexId: 22,  toName: 'Fearow',     toType: 'flying',   statBonusDelta: 8 },
  25:  { level: 30, toDexId: 26,  toName: 'Raichu',     toType: 'electric', statBonusDelta: 8 },
  41:  { level: 22, toDexId: 42,  toName: 'Golbat',     toType: 'poison',   statBonusDelta: 8 },
  54:  { level: 33, toDexId: 55,  toName: 'Golduck',    toType: 'water',    statBonusDelta: 8 },
  60:  { level: 25, toDexId: 61,  toName: 'Poliwhirl',  toType: 'water',    statBonusDelta: 8 },
  63:  { level: 16, toDexId: 64,  toName: 'Kadabra',    toType: 'psychic',  statBonusDelta: 8 },
  66:  { level: 28, toDexId: 67,  toName: 'Machoke',    toType: 'fighting', statBonusDelta: 8 },
  74:  { level: 25, toDexId: 75,  toName: 'Graveler',   toType: 'rock',     statBonusDelta: 8 },
  77:  { level: 40, toDexId: 78,  toName: 'Rapidash',   toType: 'fire',     statBonusDelta: 8 },
  79:  { level: 37, toDexId: 80,  toName: 'Slowbro',    toType: 'psychic',  statBonusDelta: 8 },
  92:  { level: 25, toDexId: 93,  toName: 'Haunter',    toType: 'ghost',    statBonusDelta: 8 },
  129: { level: 20, toDexId: 130, toName: 'Gyarados',   toType: 'water',    statBonusDelta: 8 },
}

export const BRANCH_EVOLUTIONS: Record<number, { level: number; options: EvolutionTarget[] }> = {
  133: {
    level: 20,
    options: [
      { level: 20, toDexId: 134, toName: 'Vaporeon', toType: 'water',    statBonusDelta: 8 },
      { level: 20, toDexId: 135, toName: 'Jolteon',  toType: 'electric', statBonusDelta: 8 },
      { level: 20, toDexId: 136, toName: 'Flareon',  toType: 'fire',     statBonusDelta: 8 },
    ]
  }
}

// All evolution target dex IDs (for sprite preload)
export const EVOLUTION_TARGET_IDS: number[] = Array.from(
  new Set([
    ...Object.values(EVOLUTIONS).map(e => e.toDexId),
    ...Object.values(BRANCH_EVOLUTIONS).flatMap(b => b.options.map(o => o.toDexId)),
  ])
)
