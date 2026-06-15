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
  'Ice Beam':      { name: 'Ice Beam',      nameEs: 'Rayo Hielo',     type: 'ice',      power: 90 },
  'Dig':           { name: 'Dig',           nameEs: 'Agujero',         type: 'ground',   power: 80 },
  'Earthquake':    { name: 'Earthquake',    nameEs: 'Terremoto',       type: 'ground',   power: 100 },
  'Low Kick':      { name: 'Low Kick',      nameEs: 'Patada Baja',     type: 'fighting', power: 50 },
  'Cross Chop':    { name: 'Cross Chop',    nameEs: 'Golpe Bis',       type: 'fighting', power: 100 },
  'Sludge':        { name: 'Sludge',        nameEs: 'Fango',           type: 'poison',   power: 65 },
  'Sludge Bomb':   { name: 'Sludge Bomb',   nameEs: 'Bomba Fango',     type: 'poison',   power: 90 },
  'Night Shade':   { name: 'Night Shade',   nameEs: 'Noche Cerrada',   type: 'ghost',    power: 50 },
  'Shadow Ball':   { name: 'Shadow Ball',   nameEs: 'Bola Sombra',     type: 'ghost',    power: 80 },
  'Rock Blast':    { name: 'Rock Blast',    nameEs: 'Tumba Rocas',     type: 'rock',     power: 25 },
  'Stone Edge':    { name: 'Stone Edge',    nameEs: 'Roca Afilada',    type: 'rock',     power: 100 },
  'Silver Wind':   { name: 'Silver Wind',   nameEs: 'Viento Plata',    type: 'bug',      power: 60 },
  'Bug Bite':      { name: 'Bug Bite',      nameEs: 'Picadura Bicho',  type: 'bug',      power: 60 },
  'Dragon Rage':   { name: 'Dragon Rage',   nameEs: 'Furia Dragón',    type: 'dragon',   power: 40 },
  'Dragon Breath': { name: 'Dragon Breath', nameEs: 'Aliento Dragón',  type: 'dragon',   power: 60 },
  'Blizzard':      { name: 'Blizzard',      nameEs: 'Ventisca',        type: 'ice',      power: 110 },
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
  rock:     [{ name: 'Rock Throw', minLevel: 1 }, { name: 'Rock Blast', minLevel: 5 }, { name: 'Stone Edge', minLevel: 20 }],
  fighting: [{ name: 'Low Kick', minLevel: 1 }, { name: 'Karate Chop', minLevel: 5 }, { name: 'Cross Chop', minLevel: 20 }],
  poison:   [{ name: 'Poison Sting', minLevel: 1 }, { name: 'Sludge', minLevel: 10 }, { name: 'Sludge Bomb', minLevel: 20 }],
  ground:   [{ name: 'Dig', minLevel: 1 }, { name: 'Earthquake', minLevel: 15 }],
  ghost:    [{ name: 'Lick', minLevel: 1 }, { name: 'Night Shade', minLevel: 10 }, { name: 'Shadow Ball', minLevel: 20 }],
  ice:      [{ name: 'Ice Beam', minLevel: 1 }, { name: 'Blizzard', minLevel: 20 }],
  bug:      [{ name: 'Silver Wind', minLevel: 1 }, { name: 'Bug Bite', minLevel: 8 }],
  dragon:   [{ name: 'Dragon Rage', minLevel: 1 }, { name: 'Dragon Breath', minLevel: 15 }],
}

export function getMovesForType(type: string, level: number): string[] {
  const pool = TYPE_MOVE_POOL[type] || TYPE_MOVE_POOL['normal']!
  const available = pool.filter(m => m.minLevel <= level)
  if (available.length === 0) return ['Tackle']
  const count = level >= 15 ? Math.min(3, available.length) : level >= 8 ? Math.min(2, available.length) : 1
  return available.slice(-count).map(m => m.name)
}
