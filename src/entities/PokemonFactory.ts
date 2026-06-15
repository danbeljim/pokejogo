import { Pokemon, calcStat, calcHp } from './Pokemon'
import { PokemonType } from '../data/Types'
import { getMovesForType } from '../data/Moves'
import { getTierBonus, getEvoBonus, applyBossScale } from '../data/StatSystem'

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

// Real Gen 1 base stats: [HP, ATK, DEF, SPD]
const BASE_STATS: Record<number, [number, number, number, number]> = {
  1:   [45,  49,  49,  45],
  4:   [39,  52,  43,  65],
  7:   [44,  48,  65,  43],
  25:  [35,  55,  40,  90],
  26:  [60,  90,  55, 110],
  16:  [40,  45,  40,  56],
  19:  [30,  56,  35,  72],
  21:  [40,  60,  30,  70],
  27:  [50,  75,  85,  40],
  31:  [90,  82,  87,  76],
  34:  [81,  92,  77,  85],
  41:  [40,  45,  35,  55],
  45:  [75,  80,  85,  50],
  49:  [70,  65,  60,  90],
  50:  [10,  55,  25,  95],
  51:  [35, 100,  50, 120],
  54:  [50,  52,  48,  55],
  58:  [55,  70,  45,  60],
  59:  [90, 110,  80,  95],
  60:  [40,  50,  40,  90],
  63:  [25,  20,  15,  90],
  64:  [40,  35,  30, 105],
  65:  [55,  50,  45, 120],
  66:  [70,  80,  50,  35],
  71:  [80, 105,  65,  70],
  72:  [40,  40,  35,  70],
  74:  [40,  80, 100,  20],
  77:  [50,  85,  55,  90],
  78:  [65, 100,  70, 105],
  83:  [52,  65,  55,  60],
  84:  [35,  85,  45,  75],
  89:  [105,105,  75,  50],
  92:  [30,  35,  30,  80],
  93:  [45,  50,  45,  95],
  94:  [60,  65,  60, 110],
  105: [60,  80, 110,  45],
  95:  [35,  45, 160,  70],
  100: [40,  30,  50, 100],
  104: [50,  50,  95,  35],
  109: [40,  65,  95,  35],
  110: [65,  90, 120,  60],
  111: [80,  85,  95,  25],
  112: [105,130, 120,  40],
  114: [65,  55, 115,  60],
  116: [30,  40,  70,  60],
  118: [45,  67,  60,  63],
  120: [30,  45,  55,  85],
  121: [60,  75,  85, 115],
  122: [40,  45,  65,  90],
  129: [20,  10,  55,  80],
  133: [55,  55,  50,  55],
  138: [35,  40, 100,  35],
  140: [30,  80,  90,  55],
  142: [80, 105,  65, 130],
  143: [160, 110,  65,  30],
  147: [41,  64,  45,  50],
  // Kanto wild extras
  10:  [45,  30,  35,  45],
  11:  [50,  20,  55,  30],
  13:  [40,  35,  30,  50],
  14:  [45,  25,  50,  35],
  17:  [63,  60,  55,  71],
  22:  [65,  90,  65, 100],
  23:  [35,  60,  44,  55],
  28:  [75, 100, 110,  65],
  29:  [55,  47,  52,  41],
  30:  [70,  62,  67,  56],
  32:  [46,  57,  40,  50],
  33:  [61,  72,  57,  65],
  35:  [70,  45,  48,  35],
  37:  [38,  41,  40,  65],
  39: [115,  45,  20,  20],
  42:  [75,  80,  70,  90],
  43:  [45,  50,  55,  30],
  46:  [35,  70,  55,  25],
  47:  [60,  95,  80,  30],
  48:  [60,  55,  50,  45],
  52:  [40,  45,  35,  90],
  56:  [40,  80,  35,  70],
  67:  [80, 100,  70,  45],
  69:  [50,  75,  35,  40],
  73:  [80,  70,  65, 100],
  75:  [55,  95, 115,  35],
  81:  [25,  35,  70,  45],
  88:  [80,  80,  50,  25],
  90:  [30,  65, 100,  40],
  96:  [60,  48,  45,  42],
  101: [60,  50,  70, 140],
  102: [60,  40,  80,  40],
  115: [105, 95,  80,  90],
  123: [70, 110,  80, 105],
  126: [65,  95,  57,  93],
  127: [65, 125, 100,  85],
  128: [75, 100,  95, 110],
}


const STARTERS = POKEMON_LIST.slice(0, 4)
const CAPTURABLE_POKEMON = POKEMON_LIST.filter(p => p.capturable !== false)

export function spriteUrl(dexId: number, back: boolean = false): string {
  return back
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${dexId}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexId}.png`
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
  const bs = BASE_STATS[entry.dexId] || [45, 50, 45, 45]
  // Additive bonuses — no chained multiplication
  const flat = getTierBonus(entry.dexId) + getEvoBonus(entry.dexId)
  const effHp  = bs[0] + Math.round(flat * 0.5)  // HP gets half flat bonus
  const effAtk = bs[1] + flat
  const effDef = bs[2] + flat
  const effSpd = bs[3] + flat
  const maxHp = calcHp(effHp, level)
  const moves = enemyMoves
    ? getMovesForType(entry.type, level)
    : pickMoves(entry.moves, level)
  return new Pokemon({
    id: entry.dexId,
    name: entry.name,
    level,
    hp: maxHp,
    maxHp,
    attack:  calcStat(effAtk, level),
    defense: calcStat(effDef, level),
    speed:   calcStat(effSpd, level),
    moves,
    type: entry.type,
    baseHp:  effHp,
    baseAtk: effAtk,
    baseDef: effDef,
    baseSpd: effSpd,
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
