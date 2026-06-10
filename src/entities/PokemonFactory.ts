import { Pokemon } from './Pokemon'

const POKEMON_NAMES = [
  'Bulbasaur', 'Charmander', 'Squirtle', 'Pikachu', 'Eevee',
  'Geodude', 'Zubat', 'Pidgey', 'Rattata', 'Spearow',
  'Machop', 'Gastly', 'Onix', 'Magikarp', 'Abra',
  'Psyduck', 'Growlithe', 'Poliwag', 'Ponyta', 'Slowpoke'
]

const MOVE_POOL = [
  'Tackle', 'Scratch', 'Ember', 'Water Gun', 'Vine Whip',
  'Thunder Shock', 'Quick Attack', 'Bite', 'Peck', 'Headbutt'
]

export function createWildPokemon(level: number, id?: number): Pokemon {
  const name = POKEMON_NAMES[(id || Math.floor(Math.random() * POKEMON_NAMES.length)) % POKEMON_NAMES.length]
  const baseHp = 20 + level * 3
  return new Pokemon({
    id: id || Math.floor(Math.random() * 151) + 1,
    name,
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
  const starters = [0, 1, 2, 3]
  const idx = starters[Math.floor(Math.random() * starters.length)]
  return new Pokemon({
    id: idx + 1,
    name: POKEMON_NAMES[idx],
    level: 5,
    hp: 25,
    maxHp: 25,
    attack: 10,
    defense: 8,
    speed: 8,
    moves: ['Tackle', 'Growl']
  })
}
