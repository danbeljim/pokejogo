import { Pokemon } from './Pokemon'
import { PokemonType } from '../data/Types'

export const POKEMON_LIST: { name: string; dexId: number; type: PokemonType; moves: string[] }[] = [
  { name: 'Bulbasaur', dexId: 1, type: 'grass', moves: ['Tackle', 'Vine Whip', 'Razor Leaf'] },
  { name: 'Charmander', dexId: 4, type: 'fire', moves: ['Scratch', 'Ember', 'Flamethrower'] },
  { name: 'Squirtle', dexId: 7, type: 'water', moves: ['Tackle', 'Water Gun', 'Hydro Pump'] },
  { name: 'Pikachu', dexId: 25, type: 'electric', moves: ['Quick Attack', 'Thunder Shock', 'Thunderbolt'] },
  { name: 'Eevee', dexId: 133, type: 'normal', moves: ['Tackle', 'Quick Attack', 'Bite'] },
  { name: 'Geodude', dexId: 74, type: 'rock', moves: ['Tackle', 'Rock Throw'] },
  { name: 'Zubat', dexId: 41, type: 'poison', moves: ['Bite', 'Wing Attack', 'Poison Sting'] },
  { name: 'Pidgey', dexId: 16, type: 'flying', moves: ['Tackle', 'Peck', 'Wing Attack'] },
  { name: 'Rattata', dexId: 19, type: 'normal', moves: ['Tackle', 'Quick Attack', 'Bite'] },
  { name: 'Spearow', dexId: 21, type: 'flying', moves: ['Peck', 'Wing Attack'] },
  { name: 'Machop', dexId: 66, type: 'fighting', moves: ['Karate Chop', 'Headbutt'] },
  { name: 'Gastly', dexId: 92, type: 'ghost', moves: ['Lick', 'Confusion'] },
  { name: 'Onix', dexId: 95, type: 'rock', moves: ['Tackle', 'Rock Throw', 'Bite'] },
  { name: 'Magikarp', dexId: 129, type: 'water', moves: ['Tackle'] },
  { name: 'Abra', dexId: 63, type: 'psychic', moves: ['Confusion', 'Psychic'] },
  { name: 'Psyduck', dexId: 54, type: 'water', moves: ['Scratch', 'Water Gun', 'Confusion'] },
  { name: 'Growlithe', dexId: 58, type: 'fire', moves: ['Bite', 'Ember', 'Flamethrower'] },
  { name: 'Poliwag', dexId: 60, type: 'water', moves: ['Water Gun', 'Hydro Pump'] },
  { name: 'Ponyta', dexId: 77, type: 'fire', moves: ['Tackle', 'Ember'] },
  { name: 'Slowpoke', dexId: 79, type: 'psychic', moves: ['Tackle', 'Confusion'] }
]

const STARTERS = POKEMON_LIST.slice(0, 4)

export function spriteUrl(dexId: number, back: boolean = false): string {
  return back
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${dexId}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexId}.png`
}

export function spriteKey(dexId: number, back: boolean = false): string {
  return `pokemon-${back ? 'back-' : ''}${dexId}`
}

function pickMoves(allMoves: string[], level: number): string[] {
  if (allMoves.length <= 2) return [...allMoves]
  const count = Math.min(level >= 10 ? 3 : 2, allMoves.length)
  return allMoves.slice(0, count)
}

export function createWildPokemon(level: number, dexId?: number): Pokemon {
  const entry = dexId
    ? (POKEMON_LIST.find(p => p.dexId === dexId) || POKEMON_LIST[Math.floor(Math.random() * POKEMON_LIST.length)])
    : POKEMON_LIST[Math.floor(Math.random() * POKEMON_LIST.length)]
  const baseHp = 20 + level * 3
  return new Pokemon({
    id: entry.dexId,
    name: entry.name,
    level,
    hp: baseHp,
    maxHp: baseHp,
    attack: 6 + level * 2,
    defense: 6 + level,
    speed: 6 + level,
    moves: pickMoves(entry.moves, level),
    type: entry.type
  })
}

export function createTrainerTeam(difficulty: number, targetLevel?: number): Pokemon[] {
  const teamSize = Math.min(1 + Math.floor(difficulty / 2), 3)
  const team: Pokemon[] = []
  const base = targetLevel ?? (3 + difficulty * 2)
  for (let i = 0; i < teamSize; i++) {
    const lvl = Math.max(1, base - i) // first mon strongest
    team.push(createWildPokemon(lvl))
  }
  return team
}

export function createGymLeaderTeam(difficulty: number, topLevel?: number): Pokemon[] {
  const teamSize = Math.min(2 + Math.floor(difficulty / 2), 4)
  const team: Pokemon[] = []
  const cap = topLevel ?? (5 + difficulty * 3)
  for (let i = 0; i < teamSize; i++) {
    const lvl = Math.max(2, cap - i)
    const p = createWildPokemon(lvl)
    p.attack += 3
    p.defense += 3
    team.push(p)
  }
  return team
}

export function createStarterByDexId(dexId: number): Pokemon {
  const entry = STARTERS.find(s => s.dexId === dexId) || STARTERS[0]
  return new Pokemon({
    id: entry.dexId,
    name: entry.name,
    level: 5,
    hp: 25,
    maxHp: 25,
    attack: 10,
    defense: 8,
    speed: 8,
    moves: entry.moves.slice(0, 2),
    type: entry.type
  })
}

export function createStarterPokemon(): Pokemon {
  const entry = STARTERS[Math.floor(Math.random() * STARTERS.length)]
  return createStarterByDexId(entry.dexId)
}

export function getStarters() {
  return STARTERS
}
