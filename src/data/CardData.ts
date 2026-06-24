import { PokemonType, TYPE_COLORS } from './Types'

export type CardCategory = 'attack' | 'defense' | 'skill'
export type CardRarity = 'common' | 'uncommon' | 'rare'

export interface CardDef {
  id: string
  name: string
  nameEs: string
  type: PokemonType
  category: CardCategory
  energy: number
  damage?: number
  shield?: number
  heal?: number
  draw?: number
  effect?: string
  effectKey?: string  // machine-readable effect identifier
  rarity: CardRarity
  pokemonName: string
}

export interface TypeSynergy {
  type: PokemonType
  name: string
  description: string
  color: string
  threshold: number
  effectKey: string
}

export const TYPE_SYNERGIES: TypeSynergy[] = [
  { type: 'fire',     name: 'Llama Ardiente',    description: 'Próx. ataque Fuego aplica Quemadura (4/turno 3 turnos)',   color: '#F08030', threshold: 3, effectKey: 'next_fire_burn' },
  { type: 'water',    name: 'Tormenta Acuática',  description: 'Próx. ataque Agua hace +50% daño',                         color: '#6890F0', threshold: 3, effectKey: 'next_water_boost' },
  { type: 'grass',    name: 'Regeneración',       description: 'Cura 15 PS al jugador',                                    color: '#78C850', threshold: 3, effectKey: 'heal_15' },
  { type: 'electric', name: 'Sobrecarga',         description: '40% chance de paralizar al enemigo (pierde turno)',         color: '#F8D030', threshold: 3, effectKey: 'paralysis_40' },
  { type: 'psychic',  name: 'Clarividencia',      description: 'Roba 2 cartas adicionales',                                color: '#F85888', threshold: 3, effectKey: 'draw_2' },
  { type: 'ghost',    name: 'Maldición',          description: 'Próx. ataque Fantasma ignora escudo enemigo',              color: '#705898', threshold: 3, effectKey: 'next_ghost_bypass' },
  { type: 'ice',      name: 'Congelación',        description: 'Congela al enemigo 1 turno (no ataca)',                    color: '#98D8D8', threshold: 3, effectKey: 'freeze_1' },
  { type: 'fighting', name: 'Frenesí',            description: '+25 daño al próx. ataque Lucha',                           color: '#C03028', threshold: 3, effectKey: 'next_fight_plus25' },
  { type: 'rock',     name: 'Fortaleza Pétrea',   description: 'Gana 20 escudo',                                           color: '#B8A038', threshold: 3, effectKey: 'shield_20' },
  { type: 'poison',   name: 'Toxina Mortal',      description: 'Envenena grave al enemigo (8/turno 3 turnos)',             color: '#A040A0', threshold: 3, effectKey: 'toxic_8' },
  { type: 'ground',   name: 'Terremoto',          description: '+1 energía bonus este turno',                              color: '#E0C068', threshold: 3, effectKey: 'energy_plus1' },
  { type: 'flying',   name: 'Viento Cortante',    description: 'Próximas 2 cartas Volador cuestan 0 energía',              color: '#A890F0', threshold: 3, effectKey: 'next2_fly_free' },
  { type: 'dragon',   name: 'Furia Dragón',       description: '+40 daño al próx. ataque Dragón',                         color: '#7038F8', threshold: 3, effectKey: 'next_dragon_plus40' },
  { type: 'bug',      name: 'Enjambre',           description: 'Cartas Bicho restantes en mano cuestan 0',                color: '#A8B820', threshold: 3, effectKey: 'bug_hand_free' },
  { type: 'normal',   name: 'Versatilidad',       description: '+1 energía bonus este turno',                              color: '#A8A878', threshold: 3, effectKey: 'energy_plus1' },
]

export const CARD_POOL: CardDef[] = [
  // NORMAL
  { id: 'tackle',       name: 'Tackle',       nameEs: 'Placaje',        type: 'normal',   category: 'attack',  energy: 1, damage: 6,                 rarity: 'common',   pokemonName: 'Rattata' },
  { id: 'quick_atk',   name: 'Quick Attack', nameEs: 'Ataque Rápido',  type: 'normal',   category: 'attack',  energy: 1, damage: 8,                 rarity: 'common',   pokemonName: 'Eevee' },
  { id: 'headbutt',    name: 'Headbutt',     nameEs: 'Cabezazo',       type: 'normal',   category: 'attack',  energy: 2, damage: 16,                rarity: 'uncommon', pokemonName: 'Tauros' },
  { id: 'harden',      name: 'Harden',       nameEs: 'Endurecimiento', type: 'normal',   category: 'defense', energy: 1, shield: 8,                 rarity: 'common',   pokemonName: 'Metapod' },
  { id: 'withdraw',    name: 'Withdraw',     nameEs: 'Refugio',        type: 'normal',   category: 'defense', energy: 2, shield: 18,                rarity: 'uncommon', pokemonName: 'Squirtle' },
  { id: 'focus',       name: 'Focus',        nameEs: 'Concentración',  type: 'normal',   category: 'skill',   energy: 1, draw: 2, effect: 'Roba 2 cartas',                                  rarity: 'common',   pokemonName: 'Abra',      effectKey: 'draw_cards' },
  // FIRE
  { id: 'ember',       name: 'Ember',        nameEs: 'Ascuas',         type: 'fire',     category: 'attack',  energy: 1, damage: 8,                 rarity: 'common',   pokemonName: 'Charmander' },
  { id: 'flamethrower',name: 'Flamethrower', nameEs: 'Lanzallamas',    type: 'fire',     category: 'attack',  energy: 2, damage: 20,                rarity: 'uncommon', pokemonName: 'Charmeleon' },
  { id: 'fire_spin',   name: 'Fire Spin',    nameEs: 'Torbellino',     type: 'fire',     category: 'attack',  energy: 2, damage: 14, effect: 'Quema 3 daño/turno 2 turnos', rarity: 'uncommon', pokemonName: 'Rapidash',  effectKey: 'burn_3_2' },
  { id: 'fire_blast',  name: 'Fire Blast',   nameEs: 'Llamarada',      type: 'fire',     category: 'attack',  energy: 3, damage: 30,                rarity: 'rare',     pokemonName: 'Charizard' },
  // WATER
  { id: 'water_gun',   name: 'Water Gun',    nameEs: 'Pistola Agua',   type: 'water',    category: 'attack',  energy: 1, damage: 8,                 rarity: 'common',   pokemonName: 'Squirtle' },
  { id: 'bubble',      name: 'Bubble',       nameEs: 'Burbuja',        type: 'water',    category: 'defense', energy: 1, shield: 6, damage: 4, effect: '+escudo +daño',  rarity: 'common',   pokemonName: 'Poliwag' },
  { id: 'surf',        name: 'Surf',         nameEs: 'Surf',           type: 'water',    category: 'attack',  energy: 2, damage: 22,                rarity: 'uncommon', pokemonName: 'Vaporeon' },
  { id: 'hydro_pump',  name: 'Hydro Pump',   nameEs: 'Hidrobomba',     type: 'water',    category: 'attack',  energy: 3, damage: 32,                rarity: 'rare',     pokemonName: 'Blastoise' },
  // GRASS
  { id: 'vine_whip',   name: 'Vine Whip',    nameEs: 'Látigo Cepa',    type: 'grass',    category: 'attack',  energy: 1, damage: 7,                 rarity: 'common',   pokemonName: 'Bulbasaur' },
  { id: 'razor_leaf',  name: 'Razor Leaf',   nameEs: 'Hoja Afilada',   type: 'grass',    category: 'attack',  energy: 1, damage: 10,                rarity: 'common',   pokemonName: 'Ivysaur' },
  { id: 'leech_seed',  name: 'Leech Seed',   nameEs: 'Drenadoras',     type: 'grass',    category: 'skill',   energy: 1, effect: 'Drena 4 PS/turno al enemigo, te cura a ti', rarity: 'uncommon', pokemonName: 'Venusaur',  effectKey: 'leech_4' },
  { id: 'solar_beam',  name: 'Solar Beam',   nameEs: 'Rayo Solar',     type: 'grass',    category: 'attack',  energy: 3, damage: 34,                rarity: 'rare',     pokemonName: 'Exeggutor' },
  // ELECTRIC
  { id: 'thunder_shock',name:'ThunderShock', nameEs: 'Impactrueno',    type: 'electric', category: 'attack',  energy: 1, damage: 7,                 rarity: 'common',   pokemonName: 'Pikachu' },
  { id: 'thunderbolt', name: 'Thunderbolt',  nameEs: 'Rayo',           type: 'electric', category: 'attack',  energy: 2, damage: 20,                rarity: 'uncommon', pokemonName: 'Raichu' },
  { id: 'discharge',   name: 'Discharge',    nameEs: 'Descarga',       type: 'electric', category: 'attack',  energy: 2, damage: 14, effect: 'Paraliza 25%', rarity: 'uncommon', pokemonName: 'Magneton', effectKey: 'paralysis_25' },
  { id: 'thunder',     name: 'Thunder',      nameEs: 'Trueno',         type: 'electric', category: 'attack',  energy: 3, damage: 30,                rarity: 'rare',     pokemonName: 'Zapdos' },
  // PSYCHIC
  { id: 'confusion',   name: 'Confusion',    nameEs: 'Confusión',      type: 'psychic',  category: 'attack',  energy: 1, damage: 8,                 rarity: 'common',   pokemonName: 'Slowpoke' },
  { id: 'psybeam',     name: 'Psybeam',      nameEs: 'Psicoimpacto',   type: 'psychic',  category: 'attack',  energy: 2, damage: 14, effect: 'Confunde al enemigo 25%', rarity: 'uncommon', pokemonName: 'Jynx', effectKey: 'confuse_25' },
  { id: 'psychic_mv',  name: 'Psychic',      nameEs: 'Psíquico',       type: 'psychic',  category: 'attack',  energy: 2, damage: 22,                rarity: 'uncommon', pokemonName: 'Alakazam' },
  { id: 'dream_eater', name: 'Dream Eater',  nameEs: 'Comesuenos',     type: 'psychic',  category: 'attack',  energy: 3, damage: 28, effect: 'Roba 8 PS al enemigo', rarity: 'rare',     pokemonName: 'Gengar', effectKey: 'lifesteal_8' },
  // GHOST
  { id: 'lick',        name: 'Lick',         nameEs: 'Lametón',        type: 'ghost',    category: 'attack',  energy: 1, damage: 5,                 rarity: 'common',   pokemonName: 'Gastly' },
  { id: 'night_shade', name: 'Night Shade',  nameEs: 'Noche Cerrada',  type: 'ghost',    category: 'attack',  energy: 2, damage: 18,                rarity: 'uncommon', pokemonName: 'Haunter' },
  { id: 'shadow_ball', name: 'Shadow Ball',  nameEs: 'Bola Sombra',    type: 'ghost',    category: 'attack',  energy: 2, damage: 24,                rarity: 'uncommon', pokemonName: 'Gengar' },
  { id: 'curse_card',  name: 'Curse',        nameEs: 'Maldición',      type: 'ghost',    category: 'skill',   energy: 1, effect: 'Enemigo pierde 10 PS/turno 3 turnos', rarity: 'rare', pokemonName: 'Misdreavus', effectKey: 'curse_10_3' },
  // ICE
  { id: 'ice_shard',   name: 'Ice Shard',    nameEs: 'Canto Helado',   type: 'ice',      category: 'attack',  energy: 1, damage: 8,                 rarity: 'common',   pokemonName: 'Seel' },
  { id: 'ice_beam',    name: 'Ice Beam',     nameEs: 'Rayo Hielo',     type: 'ice',      category: 'attack',  energy: 2, damage: 20,                rarity: 'uncommon', pokemonName: 'Dewgong' },
  { id: 'blizzard',    name: 'Blizzard',     nameEs: 'Ventisca',       type: 'ice',      category: 'attack',  energy: 3, damage: 28, effect: 'Congela 20%', rarity: 'rare', pokemonName: 'Articuno', effectKey: 'freeze_20pct' },
  // FIGHTING
  { id: 'low_kick',    name: 'Low Kick',     nameEs: 'Patada Baja',    type: 'fighting', category: 'attack',  energy: 1, damage: 8,                 rarity: 'common',   pokemonName: 'Mankey' },
  { id: 'karate_chop', name: 'Karate Chop',  nameEs: 'Golpe Karate',   type: 'fighting', category: 'attack',  energy: 1, damage: 10,                rarity: 'common',   pokemonName: 'Primeape' },
  { id: 'cross_chop',  name: 'Cross Chop',   nameEs: 'Golpe Bis',      type: 'fighting', category: 'attack',  energy: 3, damage: 32,                rarity: 'rare',     pokemonName: 'Machamp' },
  { id: 'bulk_up',     name: 'Bulk Up',      nameEs: 'Corpulencia',    type: 'fighting', category: 'defense', energy: 1, shield: 12,                rarity: 'uncommon', pokemonName: 'Machop' },
  // ROCK
  { id: 'rock_throw',  name: 'Rock Throw',   nameEs: 'Lanzarrocas',    type: 'rock',     category: 'attack',  energy: 1, damage: 8,                 rarity: 'common',   pokemonName: 'Geodude' },
  { id: 'rock_slide',  name: 'Rock Slide',   nameEs: 'Avalancha',      type: 'rock',     category: 'attack',  energy: 2, damage: 18,                rarity: 'uncommon', pokemonName: 'Graveler' },
  { id: 'stone_edge',  name: 'Stone Edge',   nameEs: 'Roca Afilada',   type: 'rock',     category: 'attack',  energy: 3, damage: 30,                rarity: 'rare',     pokemonName: 'Golem' },
  { id: 'iron_defense',name: 'Iron Defense', nameEs: 'Defensa Férrea', type: 'rock',     category: 'defense', energy: 2, shield: 20,                rarity: 'uncommon', pokemonName: 'Onix' },
  // POISON
  { id: 'poison_sting',name: 'Poison Sting', nameEs: 'Picadura',       type: 'poison',   category: 'attack',  energy: 1, damage: 5, effect: 'Envenena 20%', rarity: 'common', pokemonName: 'Ekans', effectKey: 'poison_20pct' },
  { id: 'sludge',      name: 'Sludge',       nameEs: 'Fango',          type: 'poison',   category: 'attack',  energy: 2, damage: 18,                rarity: 'uncommon', pokemonName: 'Grimer' },
  { id: 'sludge_bomb', name: 'Sludge Bomb',  nameEs: 'Bomba Fango',    type: 'poison',   category: 'attack',  energy: 2, damage: 22,                rarity: 'uncommon', pokemonName: 'Muk' },
  { id: 'toxic',       name: 'Toxic',        nameEs: 'Tóxico',         type: 'poison',   category: 'skill',   energy: 1, effect: 'Envenena grave (8/turno escala)', rarity: 'rare', pokemonName: 'Weezing', effectKey: 'toxic_8_scale' },
  // GROUND
  { id: 'mud_slap',    name: 'Mud Slap',     nameEs: 'Fango Lodo',     type: 'ground',   category: 'attack',  energy: 1, damage: 6,                 rarity: 'common',   pokemonName: 'Sandshrew' },
  { id: 'dig',         name: 'Dig',          nameEs: 'Agujero',        type: 'ground',   category: 'defense', energy: 2, shield: 10, damage: 16, effect: 'Esquiva+daña', rarity: 'uncommon', pokemonName: 'Sandslash' },
  { id: 'earthquake',  name: 'Earthquake',   nameEs: 'Terremoto',      type: 'ground',   category: 'attack',  energy: 3, damage: 30,                rarity: 'rare',     pokemonName: 'Rhydon' },
  // FLYING
  { id: 'gust',        name: 'Gust',         nameEs: 'Ráfaga',         type: 'flying',   category: 'attack',  energy: 1, damage: 7,                 rarity: 'common',   pokemonName: 'Pidgey' },
  { id: 'wing_attack', name: 'Wing Attack',  nameEs: 'Ataque Ala',     type: 'flying',   category: 'attack',  energy: 1, damage: 12,                rarity: 'common',   pokemonName: 'Pidgeot' },
  { id: 'aerial_ace',  name: 'Aerial Ace',   nameEs: 'Acróbata',       type: 'flying',   category: 'attack',  energy: 2, damage: 18,                rarity: 'uncommon', pokemonName: 'Fearow' },
  { id: 'sky_attack',  name: 'Sky Attack',   nameEs: 'Ataque Fuerza',  type: 'flying',   category: 'attack',  energy: 3, damage: 30,                rarity: 'rare',     pokemonName: 'Moltres' },
  // DRAGON
  { id: 'dragon_rage', name: 'Dragon Rage',  nameEs: 'Furia Dragón',   type: 'dragon',   category: 'attack',  energy: 2, damage: 18,                rarity: 'uncommon', pokemonName: 'Dratini' },
  { id: 'dragon_breath',name:'DragonBreath', nameEs: 'Aliento Dragón', type: 'dragon',   category: 'attack',  energy: 2, damage: 22,                rarity: 'uncommon', pokemonName: 'Dragonair' },
  { id: 'draco_meteor',name: 'Draco Meteor', nameEs: 'Cometa Draco',   type: 'dragon',   category: 'attack',  energy: 3, damage: 38,                rarity: 'rare',     pokemonName: 'Dragonite' },
  // BUG
  { id: 'bug_bite',    name: 'Bug Bite',     nameEs: 'Picadura Bicho', type: 'bug',      category: 'attack',  energy: 1, damage: 8,                 rarity: 'common',   pokemonName: 'Caterpie' },
  { id: 'silver_wind', name: 'Silver Wind',  nameEs: 'Viento Plata',   type: 'bug',      category: 'attack',  energy: 2, damage: 16,                rarity: 'uncommon', pokemonName: 'Butterfree' },
  { id: 'megahorn',    name: 'Megahorn',     nameEs: 'Megacuerno',     type: 'bug',      category: 'attack',  energy: 3, damage: 30,                rarity: 'rare',     pokemonName: 'Heracross' },
]

export type MetaUnlockId = string

export interface MetaUnlock {
  id: MetaUnlockId
  name: string
  description: string
  cost: number
  tag: 'stat' | 'start_bonus'
  statKey?: string
  statValue?: number
}

export const META_UNLOCKS: MetaUnlock[] = [
  { id: 'start_gold_50',  name: '+50 Oro inicial',     description: 'Cada run comienza con 50 oro extra',           cost: 30,  tag: 'start_bonus', statKey: 'gold',         statValue: 50 },
  { id: 'start_hp_20',    name: '+20 PS máx',          description: '+20 PS máximos al iniciar run',                cost: 50,  tag: 'stat',        statKey: 'maxHp',        statValue: 20 },
  { id: 'start_hp_40',    name: '+40 PS máx',          description: '+40 PS máximos adicionales (acumulable)',      cost: 100, tag: 'stat',        statKey: 'maxHp',        statValue: 40 },
  { id: 'extra_choice',   name: 'Elección extra',      description: '+1 carta para elegir tras cada batalla',      cost: 80,  tag: 'stat',        statKey: 'cardChoices',  statValue: 1 },
  { id: 'energy_plus',    name: '+1 Energía/turno',    description: 'Empiezas cada turno con 4 en vez de 3',        cost: 120, tag: 'stat',        statKey: 'baseEnergy',   statValue: 1 },
  { id: 'hand_plus',      name: 'Mano grande',         description: 'Roba 6 cartas/turno en vez de 5',             cost: 90,  tag: 'stat',        statKey: 'handSize',     statValue: 1 },
  { id: 'shop_discount',  name: 'Descuento tienda',    description: '-20% precios en tiendas',                     cost: 70,  tag: 'stat',        statKey: 'shopDiscount', statValue: 20 },
  { id: 'unlock_rares',   name: 'Rareza desbloqueada', description: 'Cartas raras aparecen en recompensas',        cost: 60,  tag: 'stat',        statKey: 'raresEnabled', statValue: 1 },
]

export interface MetaProgress {
  starDust: number
  totalRuns: number
  bestFloor: number
  unlocks: string[]
  legacyDeck?: string[]  // deck saved from last run — persists on death
}

export function loadMeta(): MetaProgress {
  try {
    const raw = localStorage.getItem('cardRogueMeta')
    if (raw) return JSON.parse(raw)
  } catch {}
  return { starDust: 0, totalRuns: 0, bestFloor: 0, unlocks: [] }
}

export function saveMeta(meta: MetaProgress) {
  localStorage.setItem('cardRogueMeta', JSON.stringify(meta))
}

export interface CardRunState {
  playerHp: number
  playerMaxHp: number
  gold: number
  deck: string[]
  floor: number
  cardChoices: number
  baseEnergy: number
  handSize: number
  shopDiscount: number
  raresEnabled: boolean
}

export function buildRunState(meta: MetaProgress): CardRunState {
  const ul = meta.unlocks
  const has = (id: string) => ul.includes(id)
  return {
    playerHp:     75 + (has('start_hp_20') ? 20 : 0) + (has('start_hp_40') ? 40 : 0),
    playerMaxHp:  75 + (has('start_hp_20') ? 20 : 0) + (has('start_hp_40') ? 40 : 0),
    gold:         50 + (has('start_gold_50') ? 50 : 0),
    deck:         meta.legacyDeck?.length ? [...meta.legacyDeck] : getStarterDeck(),
    floor:        0,
    cardChoices:  3 + (has('extra_choice') ? 1 : 0),
    baseEnergy:   3 + (has('energy_plus') ? 1 : 0),
    handSize:     5 + (has('hand_plus') ? 1 : 0),
    shopDiscount: has('shop_discount') ? 20 : 0,
    raresEnabled: has('unlock_rares'),
  }
}

export function getStarterDeck(): string[] {
  return ['tackle','tackle','tackle','harden','harden','quick_atk','quick_atk','focus','ember','water_gun']
}

export function getCardById(id: string): CardDef | undefined {
  return CARD_POOL.find(c => c.id === id)
}

export function getCardsByRarity(rarity: CardRarity): CardDef[] {
  return CARD_POOL.filter(c => c.rarity === rarity)
}

export function getSynergyForType(type: string): TypeSynergy | undefined {
  return TYPE_SYNERGIES.find(s => s.type === type)
}

export function getTypeColor(type: string): number {
  const hex = (TYPE_COLORS as Record<string, string>)[type] ?? '#A8A878'
  return parseInt(hex.replace('#', ''), 16)
}

export function getRandomRewardCards(run: CardRunState, count: number): CardDef[] {
  const rarities: CardRarity[] = run.raresEnabled
    ? ['common', 'common', 'uncommon', 'uncommon', 'rare']
    : ['common', 'common', 'uncommon']
  const pool = CARD_POOL.filter(c => rarities.includes(c.rarity))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function getShopCards(run: CardRunState): { card: CardDef; price: number }[] {
  const pool = run.raresEnabled
    ? CARD_POOL.filter(c => c.rarity !== 'common')
    : CARD_POOL.filter(c => c.rarity === 'uncommon')
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 4)
  const discount = run.shopDiscount / 100
  return shuffled.map(card => ({
    card,
    price: Math.round((card.rarity === 'rare' ? 80 : 50) * (1 - discount))
  }))
}
