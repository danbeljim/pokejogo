import { PokemonType } from './Types'

export interface Move {
  name: string
  type: PokemonType
  power: number
}

export const MOVES: Record<string, Move> = {
  'Tackle': { name: 'Tackle', type: 'normal', power: 40 },
  'Scratch': { name: 'Scratch', type: 'normal', power: 40 },
  'Quick Attack': { name: 'Quick Attack', type: 'normal', power: 40 },
  'Headbutt': { name: 'Headbutt', type: 'normal', power: 70 },
  'Bite': { name: 'Bite', type: 'normal', power: 60 },
  'Ember': { name: 'Ember', type: 'fire', power: 40 },
  'Flamethrower': { name: 'Flamethrower', type: 'fire', power: 90 },
  'Water Gun': { name: 'Water Gun', type: 'water', power: 40 },
  'Hydro Pump': { name: 'Hydro Pump', type: 'water', power: 110 },
  'Vine Whip': { name: 'Vine Whip', type: 'grass', power: 45 },
  'Razor Leaf': { name: 'Razor Leaf', type: 'grass', power: 55 },
  'Thunder Shock': { name: 'Thunder Shock', type: 'electric', power: 40 },
  'Thunderbolt': { name: 'Thunderbolt', type: 'electric', power: 90 },
  'Peck': { name: 'Peck', type: 'flying', power: 35 },
  'Wing Attack': { name: 'Wing Attack', type: 'flying', power: 60 },
  'Confusion': { name: 'Confusion', type: 'psychic', power: 50 },
  'Psychic': { name: 'Psychic', type: 'psychic', power: 90 },
  'Rock Throw': { name: 'Rock Throw', type: 'rock', power: 50 },
  'Karate Chop': { name: 'Karate Chop', type: 'fighting', power: 50 },
  'Poison Sting': { name: 'Poison Sting', type: 'poison', power: 15 },
  'Lick': { name: 'Lick', type: 'ghost', power: 30 },
  'Ice Beam': { name: 'Ice Beam', type: 'ice', power: 90 }
}

export function getMove(name: string): Move {
  return MOVES[name] || MOVES['Tackle']
}
