import { Pokemon } from './Pokemon'

export const POKEMON_LIST: { name: string; dexId: number }[] = [
  { name: 'Bulbasaur', dexId: 1 },
  { name: 'Charmander', dexId: 4 },
  { name: 'Squirtle', dexId: 7 },
  { name: 'Pikachu', dexId: 25 },
  { name: 'Eevee', dexId: 133 },
  { name: 'Geodude', dexId: 74 },
  { name: 'Zubat', dexId: 41 },
  { name: 'Pidgey', dexId: 16 },
  { name: 'Rattata', dexId: 19 },
  { name: 'Spearow', dexId: 21 },
  { name: 'Machop', dexId: 66 },
  { name: 'Gastly', dexId: 92 },
  { name: 'Onix', dexId: 95 },
  { name: 'Magikarp', dexId: 129 },
  { name: 'Abra', dexId: 63 },
  { name: 'Psyduck', dexId: 54 },
  { name: 'Growlithe', dexId: 58 },
  { name: 'Poliwag', dexId: 60 },
  { name: 'Ponyta', dexId: 77 },
  { name: 'Slowpoke', dexId: 79 }
]

const STARTERS = POKEMON_LIST.slice(0, 4)

const MOVE_POOL = [
  'Tackle', 'Scratch', 'Ember', 'Water Gun', 'Vine Whip',
  'Thunder Shock', 'Quick Attack', 'Bite', 'Peck', 'Headbutt'
]

export function spriteUrl(dexId: number, back: boolean = false): string {
  return back
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${dexId}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexId}.png`
}

export function spriteKey(dexId: number, back: boolean = false): string {
  return `pokemon-${back ? 'back-' : ''}${dexId}`
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
    moves: [MOVE_POOL[Math.floor(Math.random() * MOVE_POOL.length)]]
  })
}

export function createTrainerTeam(difficulty: number): Pokemon[] {
  const teamSize = Math.min(1 + Math.floor(difficulty / 2), 3)
  const team: Pokemon[] = []
  for (let i = 0; i < teamSize; i++) {
    team.push(createWildPokemon(3 + difficulty * 2))
  }
  return team
}

export function createGymLeaderTeam(difficulty: number): Pokemon[] {
  const teamSize = Math.min(2 + Math.floor(difficulty / 2), 4)
  const team: Pokemon[] = []
  for (let i = 0; i < teamSize; i++) {
    const lvl = 5 + difficulty * 3 + i
    const p = createWildPokemon(lvl)
    p.attack += 3
    p.defense += 3
    team.push(p)
  }
  return team
}

export function createStarterPokemon(): Pokemon {
  const entry = STARTERS[Math.floor(Math.random() * STARTERS.length)]
  return new Pokemon({
    id: entry.dexId,
    name: entry.name,
    level: 5,
    hp: 25,
    maxHp: 25,
    attack: 10,
    defense: 8,
    speed: 8,
    moves: ['Tackle', 'Growl']
  })
}
