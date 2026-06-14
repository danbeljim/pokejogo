import { PokemonType } from './Types'

export interface Move {
  name: string
  nameEs: string
  type: PokemonType
  power: number
}

export const MOVES: Record<string, Move> = {
  'Tackle':        { name: 'Tackle',        nameEs: 'Placaje',        type: 'normal',   power: 40 },
  'Scratch':       { name: 'Scratch',       nameEs: 'Arañazo',        type: 'normal',   power: 40 },
  'Quick Attack':  { name: 'Quick Attack',  nameEs: 'Ataque Rápido',  type: 'normal',   power: 40 },
  'Headbutt':      { name: 'Headbutt',      nameEs: 'Cabezazo',       type: 'normal',   power: 70 },
  'Bite':          { name: 'Bite',          nameEs: 'Mordisco',       type: 'normal',   power: 60 },
  'Ember':         { name: 'Ember',         nameEs: 'Ascuas',         type: 'fire',     power: 40 },
  'Flamethrower':  { name: 'Flamethrower',  nameEs: 'Lanzallamas',    type: 'fire',     power: 90 },
  'Water Gun':     { name: 'Water Gun',     nameEs: 'Pistola Agua',   type: 'water',    power: 40 },
  'Hydro Pump':    { name: 'Hydro Pump',    nameEs: 'Hidrobomba',     type: 'water',    power: 110 },
  'Vine Whip':     { name: 'Vine Whip',     nameEs: 'Látigo Cepa',    type: 'grass',    power: 45 },
  'Razor Leaf':    { name: 'Razor Leaf',    nameEs: 'Hoja Afilada',   type: 'grass',    power: 55 },
  'Thunder Shock': { name: 'Thunder Shock', nameEs: 'Impactrueno',    type: 'electric', power: 40 },
  'Thunderbolt':   { name: 'Thunderbolt',   nameEs: 'Rayo',           type: 'electric', power: 90 },
  'Peck':          { name: 'Peck',          nameEs: 'Picotazo',       type: 'flying',   power: 35 },
  'Wing Attack':   { name: 'Wing Attack',   nameEs: 'Ataque Ala',     type: 'flying',   power: 60 },
  'Confusion':     { name: 'Confusion',     nameEs: 'Confusión',      type: 'psychic',  power: 50 },
  'Psychic':       { name: 'Psychic',       nameEs: 'Psíquico',       type: 'psychic',  power: 90 },
  'Rock Throw':    { name: 'Rock Throw',    nameEs: 'Lanzarrocas',    type: 'rock',     power: 50 },
  'Karate Chop':   { name: 'Karate Chop',   nameEs: 'Golpe Karate',   type: 'fighting', power: 50 },
  'Poison Sting':  { name: 'Poison Sting',  nameEs: 'Picadura',       type: 'poison',   power: 15 },
  'Lick':          { name: 'Lick',          nameEs: 'Lametón',        type: 'ghost',    power: 30 },
  'Ice Beam':      { name: 'Ice Beam',      nameEs: 'Rayo Hielo',     type: 'ice',      power: 90 }
}

export function getMove(name: string): Move {
  return MOVES[name] || MOVES['Tackle']
}

// Ordered by power ascending (low power = low level, high power = high level)
const TYPE_MOVE_POOL: Partial<Record<string, { name: string; minLevel: number }[]>> = {
  normal:   [{ name: 'Tackle', minLevel: 1 }, { name: 'Quick Attack', minLevel: 5 }, { name: 'Bite', minLevel: 10 }, { name: 'Headbutt', minLevel: 15 }],
  fire:     [{ name: 'Ember', minLevel: 1 }, { name: 'Flamethrower', minLevel: 15 }],
  water:    [{ name: 'Water Gun', minLevel: 1 }, { name: 'Hydro Pump', minLevel: 20 }],
  grass:    [{ name: 'Vine Whip', minLevel: 1 }, { name: 'Razor Leaf', minLevel: 10 }],
  electric: [{ name: 'Thunder Shock', minLevel: 1 }, { name: 'Thunderbolt', minLevel: 15 }],
  flying:   [{ name: 'Peck', minLevel: 1 }, { name: 'Wing Attack', minLevel: 10 }],
  psychic:  [{ name: 'Confusion', minLevel: 1 }, { name: 'Psychic', minLevel: 15 }],
  rock:     [{ name: 'Tackle', minLevel: 1 }, { name: 'Rock Throw', minLevel: 5 }],
  fighting: [{ name: 'Tackle', minLevel: 1 }, { name: 'Karate Chop', minLevel: 5 }],
  poison:   [{ name: 'Poison Sting', minLevel: 1 }, { name: 'Tackle', minLevel: 1 }],
  ground:   [{ name: 'Tackle', minLevel: 1 }, { name: 'Headbutt', minLevel: 10 }],
  ghost:    [{ name: 'Lick', minLevel: 1 }, { name: 'Confusion', minLevel: 10 }],
  ice:      [{ name: 'Tackle', minLevel: 1 }, { name: 'Ice Beam', minLevel: 15 }],
  bug:      [{ name: 'Tackle', minLevel: 1 }, { name: 'Quick Attack', minLevel: 8 }],
  dragon:   [{ name: 'Headbutt', minLevel: 1 }, { name: 'Bite', minLevel: 10 }],
}

export function getMovesForType(type: string, level: number): string[] {
  const pool = TYPE_MOVE_POOL[type] || TYPE_MOVE_POOL['normal']!
  const available = pool.filter(m => m.minLevel <= level)
  if (available.length === 0) return ['Tackle']
  const count = level >= 15 ? Math.min(3, available.length) : level >= 8 ? Math.min(2, available.length) : 1
  return available.slice(-count).map(m => m.name)
}
