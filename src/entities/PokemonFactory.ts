import { Pokemon, calcStat, calcHp } from './Pokemon'
import { PokemonType } from '../data/Types'
import { getMovesForType } from '../data/Moves'
import { getTierBonus, getEvoBonus, applyBossScale } from '../data/StatSystem'
import { getBaseStats } from '../data/StatLoader'

export const POKEMON_LIST: { name: string; dexId: number; type: PokemonType; moves: string[]; capturable?: false }[] = [
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
  { name: 'Gastly',  dexId: 92,  type: 'ghost',  moves: ['Lick', 'Confusion'] },
  { name: 'Haunter', dexId: 93,  type: 'ghost',  moves: ['Lick', 'Confusion', 'Psychic'] },
  { name: 'Gengar',  dexId: 94,  type: 'ghost',  moves: ['Lick', 'Confusion', 'Psychic'], capturable: false },
  { name: 'Marowak', dexId: 105, type: 'ground', moves: ['Headbutt', 'Bite', 'Rock Throw'] },
  { name: 'Onix', dexId: 95, type: 'rock', moves: ['Tackle', 'Rock Throw', 'Bite'] },
  { name: 'Magikarp', dexId: 129, type: 'water', moves: ['Tackle'] },
  { name: 'Abra', dexId: 63, type: 'psychic', moves: ['Confusion', 'Psychic'] },
  { name: 'Psyduck', dexId: 54, type: 'water', moves: ['Scratch', 'Water Gun', 'Confusion'] },
  { name: 'Growlithe', dexId: 58, type: 'fire', moves: ['Bite', 'Ember', 'Flamethrower'] },
  { name: 'Poliwag', dexId: 60, type: 'water', moves: ['Water Gun', 'Hydro Pump'] },
  { name: 'Ponyta', dexId: 77, type: 'fire', moves: ['Tackle', 'Ember'] },
  { name: 'Slowpoke',   dexId: 79,  type: 'psychic', moves: ['Tackle', 'Confusion'] },
  // Ground
  { name: 'Diglett',   dexId: 50,  type: 'ground',  moves: ['Scratch', 'Dig'] },
  { name: 'Sandshrew', dexId: 27,  type: 'ground',  moves: ['Scratch', 'Sand Attack', 'Dig'] },
  { name: 'Cubone',    dexId: 104, type: 'ground',  moves: ['Growl', 'Bone Club', 'Headbutt'] },
  { name: 'Rhyhorn',   dexId: 111, type: 'ground',  moves: ['Horn Attack', 'Stomp', 'Rock Blast'] },
  // Rock extra
  { name: 'Kabuto',    dexId: 140, type: 'rock',    moves: ['Scratch', 'Harden', 'Rock Throw'] },
  { name: 'Omanyte',   dexId: 138, type: 'rock',    moves: ['Water Gun', 'Withdraw', 'Rock Throw'] },
  // Water extra
  { name: 'Tentacool', dexId: 72,  type: 'water',   moves: ['Poison Sting', 'Water Gun'] },
  { name: 'Horsea',    dexId: 116, type: 'water',   moves: ['Bubble', 'Water Gun', 'Hydro Pump'] },
  { name: 'Goldeen',   dexId: 118, type: 'water',   moves: ['Peck', 'Water Gun', 'Horn Attack'] },
  // Flying extra
  { name: 'Doduo',     dexId: 84,  type: 'flying',  moves: ['Peck', 'Fury Attack'] },
  { name: 'Farfetchd', dexId: 83,  type: 'flying',  moves: ['Peck', 'Cut', 'Wing Attack'] },
  { name: 'Aerodactyl',dexId: 142, type: 'flying',  moves: ['Wing Attack', 'Rock Throw', 'Bite'] },
  { name: 'Snorlax',   dexId: 143, type: 'normal',  moves: ['Tackle', 'Headbutt', 'Bite'] },
  { name: 'Dratini',   dexId: 147, type: 'dragon',  moves: ['Tackle', 'Headbutt', 'Bite'] },
  // Kanto wild pool extras
  { name: 'Caterpie',  dexId: 10,  type: 'bug',     moves: ['Tackle'] },
  { name: 'Metapod',   dexId: 11,  type: 'bug',     moves: ['Tackle'] },
  { name: 'Weedle',    dexId: 13,  type: 'poison',  moves: ['Tackle', 'Poison Sting'] },
  { name: 'Kakuna',    dexId: 14,  type: 'poison',  moves: ['Tackle', 'Poison Sting'] },
  { name: 'Pidgeotto', dexId: 17,  type: 'flying',  moves: ['Peck', 'Wing Attack'] },
  { name: 'Fearow',    dexId: 22,  type: 'flying',  moves: ['Peck', 'Wing Attack'] },
  { name: 'Ekans',     dexId: 23,  type: 'poison',  moves: ['Tackle', 'Bite', 'Poison Sting'] },
  { name: 'Sandslash', dexId: 28,  type: 'ground',  moves: ['Scratch', 'Headbutt'] },
  { name: 'NidoranF',  dexId: 29,  type: 'poison',  moves: ['Tackle', 'Poison Sting'] },
  { name: 'Nidorina',  dexId: 30,  type: 'poison',  moves: ['Tackle', 'Bite', 'Poison Sting'] },
  { name: 'NidoranM',  dexId: 32,  type: 'poison',  moves: ['Tackle', 'Poison Sting'] },
  { name: 'Nidorino',  dexId: 33,  type: 'poison',  moves: ['Tackle', 'Bite', 'Poison Sting'] },
  { name: 'Clefairy',  dexId: 35,  type: 'normal',  moves: ['Tackle', 'Quick Attack'] },
  { name: 'Vulpix',    dexId: 37,  type: 'fire',    moves: ['Ember', 'Bite'] },
  { name: 'Jigglypuff',dexId: 39,  type: 'normal',  moves: ['Tackle', 'Quick Attack'] },
  { name: 'Golbat',    dexId: 42,  type: 'poison',  moves: ['Bite', 'Wing Attack', 'Poison Sting'] },
  { name: 'Oddish',    dexId: 43,  type: 'grass',   moves: ['Tackle', 'Vine Whip', 'Razor Leaf'] },
  { name: 'Paras',     dexId: 46,  type: 'bug',     moves: ['Tackle', 'Quick Attack'] },
  { name: 'Parasect',  dexId: 47,  type: 'bug',     moves: ['Tackle', 'Quick Attack', 'Headbutt'] },
  { name: 'Venonat',   dexId: 48,  type: 'poison',  moves: ['Tackle', 'Poison Sting', 'Confusion'] },
  { name: 'Meowth',    dexId: 52,  type: 'normal',  moves: ['Scratch', 'Bite', 'Quick Attack'] },
  { name: 'Mankey',    dexId: 56,  type: 'fighting',moves: ['Scratch', 'Karate Chop'] },
  { name: 'Machoke',   dexId: 67,  type: 'fighting',moves: ['Karate Chop', 'Headbutt'] },
  { name: 'Bellsprout',dexId: 69,  type: 'grass',   moves: ['Vine Whip', 'Razor Leaf'] },
  { name: 'Tentacruel',dexId: 73,  type: 'water',   moves: ['Poison Sting', 'Water Gun', 'Hydro Pump'] },
  { name: 'Graveler',  dexId: 75,  type: 'rock',    moves: ['Tackle', 'Rock Throw', 'Headbutt'] },
  { name: 'Magnemite', dexId: 81,  type: 'electric',moves: ['Tackle', 'Thunder Shock'] },
  { name: 'Grimer',    dexId: 88,  type: 'poison',  moves: ['Tackle', 'Poison Sting'] },
  { name: 'Shellder',  dexId: 90,  type: 'water',   moves: ['Tackle', 'Water Gun'] },
  { name: 'Drowzee',   dexId: 96,  type: 'psychic', moves: ['Tackle', 'Confusion'] },
  { name: 'Electrode', dexId: 101, type: 'electric',moves: ['Thunder Shock', 'Thunderbolt'] },
  { name: 'Exeggcute', dexId: 102, type: 'grass',   moves: ['Tackle', 'Razor Leaf', 'Confusion'] },
  { name: 'Kangaskhan',dexId: 115, type: 'normal',  moves: ['Tackle', 'Headbutt', 'Bite'] },
  { name: 'Scyther',   dexId: 123, type: 'flying',  moves: ['Wing Attack', 'Bite'] },
  { name: 'Magmar',    dexId: 126, type: 'fire',    moves: ['Ember', 'Flamethrower'] },
  { name: 'Pinsir',    dexId: 127, type: 'bug',     moves: ['Bite', 'Headbutt'] },
  { name: 'Tauros',    dexId: 128, type: 'normal',  moves: ['Tackle', 'Headbutt', 'Bite'] },
  // Gym leader canonical mons
  { name: 'Staryu',     dexId: 120, type: 'water',   moves: ['Water Gun', 'Tackle', 'Rapid Spin'] },
  { name: 'Starmie',    dexId: 121, type: 'water',   moves: ['Water Gun', 'Psychic', 'Hydro Pump'],    capturable: false },
  { name: 'Voltorb',    dexId: 100, type: 'electric', moves: ['Tackle', 'Thunder Shock', 'Spark'] },
  { name: 'Raichu',     dexId: 26,  type: 'electric', moves: ['Quick Attack', 'Thunderbolt', 'Thunder'], capturable: false },
  { name: 'Victreebel', dexId: 71,  type: 'grass',   moves: ['Razor Leaf', 'Vine Whip', 'Acid'],        capturable: false },
  { name: 'Tangela',    dexId: 114, type: 'grass',   moves: ['Vine Whip', 'Absorb', 'Mega Drain'] },
  { name: 'Vileplume',  dexId: 45,  type: 'grass',   moves: ['Petal Dance', 'Mega Drain', 'Acid'],      capturable: false },
  { name: 'Koffing',    dexId: 109, type: 'poison',  moves: ['Tackle', 'Smog', 'Poison Gas'] },
  { name: 'Muk',        dexId: 89,  type: 'poison',  moves: ['Poison Gas', 'Minimize', 'Acid'],         capturable: false },
  { name: 'Weezing',    dexId: 110, type: 'poison',  moves: ['Smog', 'Poison Gas', 'Explosion'],        capturable: false },
  { name: 'Kadabra',    dexId: 64,  type: 'psychic', moves: ['Confusion', 'Psychic', 'Psybeam'],        capturable: false },
  { name: 'Mr. Mime',   dexId: 122, type: 'psychic', moves: ['Confusion', 'Psybeam', 'Barrier'] },
  { name: 'Venomoth',   dexId: 49,  type: 'poison',  moves: ['Psychic', 'Poison Powder', 'Silver Wind'], capturable: false },
  { name: 'Alakazam',   dexId: 65,  type: 'psychic', moves: ['Psychic', 'Psybeam', 'Recover'],          capturable: false },
  { name: 'Rapidash',   dexId: 78,  type: 'fire',    moves: ['Ember', 'Flame Wheel', 'Fire Blast'],     capturable: false },
  { name: 'Arcanine',   dexId: 59,  type: 'fire',    moves: ['Flamethrower', 'Bite', 'Fire Blast'],     capturable: false },
  { name: 'Dugtrio',    dexId: 51,  type: 'ground',  moves: ['Scratch', 'Dig', 'Slash'],                capturable: false },
  { name: 'Nidoqueen',  dexId: 31,  type: 'ground',  moves: ['Tackle', 'Poison Sting', 'Earthquake'],   capturable: false },
  { name: 'Nidoking',   dexId: 34,  type: 'ground',  moves: ['Horn Attack', 'Poison Sting', 'Earthquake'], capturable: false },
  { name: 'Rhydon',     dexId: 112, type: 'ground',  moves: ['Horn Attack', 'Stomp', 'Rock Blast'],     capturable: false },
]



const STARTERS = POKEMON_LIST.slice(0, 4)
const CAPTURABLE_POKEMON = POKEMON_LIST.filter(p => p.capturable !== false)

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

export function createWildPokemon(level: number, dexId?: number, enemyMoves: boolean = false): Pokemon {
  const entry = dexId
    ? (POKEMON_LIST.find(p => p.dexId === dexId) || CAPTURABLE_POKEMON[Math.floor(Math.random() * CAPTURABLE_POKEMON.length)])
    : CAPTURABLE_POKEMON[Math.floor(Math.random() * CAPTURABLE_POKEMON.length)]
  const bs = getBaseStats(entry.dexId)
  // Flat bonus applied AFTER level scaling — truly additive, never multiplied
  const statBonus = getTierBonus(entry.dexId) + getEvoBonus(entry.dexId)
  const maxHp = calcHp(bs[0], level) + Math.round(statBonus * 0.5)
  const moves = enemyMoves
    ? getMovesForType(entry.type, level)
    : pickMoves(entry.moves, level)
  return new Pokemon({
    id: entry.dexId,
    name: entry.name,
    level,
    hp: maxHp,
    maxHp,
    attack:  calcStat(bs[1], level) + statBonus,
    defense: calcStat(bs[2], level) + statBonus,
    speed:   calcStat(bs[3], level) + statBonus,
    moves,
    type: entry.type,
    baseHp:  bs[0],
    baseAtk: bs[1],
    baseDef: bs[2],
    baseSpd: bs[3],
    statBonus,
  })
}

export function createTrainerTeam(difficulty: number, targetLevel?: number): Pokemon[] {
  const teamSize = Math.min(1 + Math.floor(difficulty / 2), 3)
  const team: Pokemon[] = []
  const base = targetLevel ?? (3 + difficulty * 2)
  for (let i = 0; i < teamSize; i++) {
    const lvl = Math.max(1, base - i)
    team.push(createWildPokemon(lvl, undefined, true))
  }
  return team
}

const GYM_LEADER_ROSTERS: Record<string, { dexId: number; level: number }[]> = {
  'Brock':    [{ dexId: 74, level: 12 }, { dexId: 95, level: 14 }],
  'Misty':    [{ dexId: 120, level: 18 }, { dexId: 121, level: 21 }],
  'Lt. Surge':[{ dexId: 100, level: 21 }, { dexId: 25, level: 18 }, { dexId: 26, level: 24 }],
  'Marowak Fantasma': [{ dexId: 92, level: 24 }, { dexId: 93, level: 26 }, { dexId: 105, level: 28 }, { dexId: 94, level: 30 }],
  'Erika':    [{ dexId: 71, level: 29 }, { dexId: 114, level: 24 }, { dexId: 45, level: 29 }],
  'Koga':     [{ dexId: 109, level: 37 }, { dexId: 89, level: 39 }, { dexId: 109, level: 37 }, { dexId: 110, level: 43 }],
  'Sabrina':  [{ dexId: 64, level: 38 }, { dexId: 122, level: 37 }, { dexId: 49, level: 38 }, { dexId: 65, level: 43 }],
  'Blaine':   [{ dexId: 58, level: 42 }, { dexId: 77, level: 40 }, { dexId: 78, level: 42 }, { dexId: 59, level: 47 }],
  'Giovanni': [{ dexId: 111, level: 45 }, { dexId: 51, level: 42 }, { dexId: 31, level: 44 }, { dexId: 34, level: 45 }, { dexId: 112, level: 50 }],
}

export function createGymLeaderTeam(gymName: string): Pokemon[] {
  const roster = GYM_LEADER_ROSTERS[gymName]
  if (!roster) return []
  return roster.map(({ dexId, level }) => {
    const p = createWildPokemon(level, dexId, true)
    applyBossScale(p)
    return p
  })
}

export function createStarterByDexId(dexId: number): Pokemon {
  const entry = STARTERS.find(s => s.dexId === dexId) || STARTERS[0]
  return createWildPokemon(5, entry.dexId)
}

export function createStarterPokemon(): Pokemon {
  const entry = STARTERS[Math.floor(Math.random() * STARTERS.length)]
  return createStarterByDexId(entry.dexId)
}

export function getStarters() {
  return STARTERS
}
