import { Pokemon } from '../entities/Pokemon'

export type ItemCategory = 'vitamin' | 'relic' | 'berry' | 'consumable'
export type RelicEffect = 'leftovers' | 'life_orb' | 'focus_sash' | 'choice_band'

export interface Item {
  id: string
  name: string
  description: string
  category: ItemCategory
  // Vitamins only
  vitaminStat?: 'hp' | 'attack' | 'defense' | 'speed'
  // Relics only
  relicEffect?: RelicEffect
  bonus?: { hp?: number; attack?: number; defense?: number; speed?: number }
}

export const FRAMBU_BERRY: Item = {
  id: 'frambu-berry',
  name: 'Baya Frambu',
  description: 'Cura 50% PS a todo el equipo',
  category: 'berry',
}

export const VITAMINS: Item[] = [
  { id: 'hp-up',   name: 'HP Up',   description: '+PS máximos permanentes',   category: 'vitamin', vitaminStat: 'hp' },
  { id: 'protein', name: 'Protein', description: '+Ataque permanente',         category: 'vitamin', vitaminStat: 'attack' },
  { id: 'iron',    name: 'Iron',    description: '+Defensa permanente',        category: 'vitamin', vitaminStat: 'defense' },
  { id: 'carbos',  name: 'Carbos',  description: '+Velocidad permanente',      category: 'vitamin', vitaminStat: 'speed' },
  { id: 'calcium', name: 'Calcium', description: '+Atq Especial (→Ataque)',    category: 'vitamin', vitaminStat: 'attack' },
  { id: 'zinc',    name: 'Zinc',    description: '+Def Especial (→Defensa)',   category: 'vitamin', vitaminStat: 'defense' },
]

export const RELICS: Item[] = [
  {
    id: 'leftovers', name: 'Leftovers',
    description: 'Cura 5% PS cada turno',
    category: 'relic', relicEffect: 'leftovers',
    bonus: {}
  },
  {
    id: 'life-orb', name: 'Life Orb',
    description: '+30% daño, pierdes 10% PS al atacar',
    category: 'relic', relicEffect: 'life_orb',
    bonus: {}
  },
  {
    id: 'focus-sash', name: 'Focus Sash',
    description: 'Sobrevives un golpe mortal a 1 PS',
    category: 'relic', relicEffect: 'focus_sash',
    bonus: {}
  },
  {
    id: 'choice-band', name: 'Choice Band',
    description: '+30% Ataque, repites movimiento',
    category: 'relic', relicEffect: 'choice_band',
    bonus: {}
  },
]

export const CONSUMABLES: Item[] = [
  { id: 'potion',       name: 'Poción',        description: 'Restaura 50% HP a todo el equipo',  category: 'consumable' },
  { id: 'super_potion', name: 'Superpoción',   description: 'Restaura HP completo al equipo',    category: 'consumable' },
  { id: 'rare_candy',   name: 'Caramelo Raro', description: 'Sube 3 niveles a un Pokémon',       category: 'consumable' },
  { id: 'revive',       name: 'Revivir',       description: 'Revive un Pokémon debilitado (50% HP)', category: 'consumable' },
]

export function applyConsumable(item: Item, team: Pokemon[], targetIdx?: number): string {
  if (item.id === 'potion') {
    team.forEach(p => { if (p.isAlive()) p.heal(Math.floor(p.maxHp * 0.5)) })
    return '¡50% HP restaurado al equipo!'
  }
  if (item.id === 'super_potion') {
    team.forEach(p => { if (p.isAlive()) p.heal(p.maxHp) })
    return '¡HP completo restaurado al equipo!'
  }
  if (item.id === 'rare_candy' && targetIdx !== undefined) {
    const p = team[targetIdx]
    p.level += 3
    return `${p.name} subió al nivel ${p.level}!`
  }
  if (item.id === 'revive' && targetIdx !== undefined) {
    const p = team[targetIdx]
    p.hp = Math.floor(p.maxHp * 0.5)
    return `${p.name} fue revivido con ${p.hp} PS!`
  }
  return ''
}

export const ITEMS: Item[] = [...VITAMINS, ...RELICS]

export function getRandomItems(count: number): Item[] {
  const shuffled = [...RELICS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// Vitaminas: boost 1-3% del stat actual, mínimo 2
export function applyVitamin(pokemon: Pokemon, item: Item): string {
  const stat = item.vitaminStat
  if (!stat) return ''
  const pct = 1 + Math.random() * 2  // 1–3%
  if (stat === 'hp') {
    const gain = Math.max(2, Math.floor(pokemon.maxHp * pct / 100))
    pokemon.maxHp += gain
    pokemon.hp = Math.min(pokemon.hp + gain, pokemon.maxHp)
    return `+${gain} PS máx`
  }
  if (stat === 'attack') {
    const gain = Math.max(2, Math.floor(pokemon.attack * pct / 100))
    pokemon.attack += gain
    return `+${gain} Ataque`
  }
  if (stat === 'defense') {
    const gain = Math.max(2, Math.floor(pokemon.defense * pct / 100))
    pokemon.defense += gain
    return `+${gain} Defensa`
  }
  if (stat === 'speed') {
    const gain = Math.max(2, Math.floor(pokemon.speed * pct / 100))
    pokemon.speed += gain
    return `+${gain} Velocidad`
  }
  return ''
}

function unequipRelic(pokemon: Pokemon) {
  if (!pokemon.heldItem) return null
  const item = RELICS.find(i => i.id === pokemon.heldItem)
  if (!item) return null
  const b = item.bonus || {}
  pokemon.attack  -= b.attack  || 0
  pokemon.defense -= b.defense || 0
  pokemon.speed   -= b.speed   || 0
  if (b.hp) {
    pokemon.maxHp -= b.hp
    pokemon.hp = Math.min(pokemon.hp, pokemon.maxHp)
    if (pokemon.maxHp < 1) pokemon.maxHp = 1
    if (pokemon.hp   < 1) pokemon.hp   = 1
  }
  pokemon.heldItem = undefined
  return item
}

export function equipRelic(pokemon: Pokemon, item: Item): Item | null {
  const old = unequipRelic(pokemon)
  const b = item.bonus || {}
  pokemon.attack  += b.attack  || 0
  pokemon.defense += b.defense || 0
  pokemon.speed   += b.speed   || 0
  if (b.hp) {
    pokemon.maxHp += b.hp
    pokemon.hp = Math.min(pokemon.hp + b.hp, pokemon.maxHp)
    if (pokemon.maxHp < 1) pokemon.maxHp = 1
    if (pokemon.hp   < 1) pokemon.hp   = 1
  }
  ;(pokemon as any).heldItem = item.id
  return old
}

// Legacy alias — kept so BagScene/BattleScene imports don't break
export function equipItem(pokemon: Pokemon, item: Item): Item | null {
  if (item.category === 'vitamin') {
    applyVitamin(pokemon, item)
    return null
  }
  return equipRelic(pokemon, item)
}
