import { Pokemon } from '../entities/Pokemon'

export interface Item {
  id: string
  name: string
  description: string
  bonus: {
    hp?: number
    attack?: number
    defense?: number
    speed?: number
  }
}

export const ITEMS: Item[] = [
  { id: 'muscle-band', name: 'Muscle Band', description: '+5 Attack', bonus: { attack: 5 } },
  { id: 'metal-coat', name: 'Metal Coat', description: '+5 Defense', bonus: { defense: 5 } },
  { id: 'quick-claw', name: 'Quick Claw', description: '+5 Speed', bonus: { speed: 5 } },
  { id: 'life-orb', name: 'Life Orb', description: '+8 Atk, -10 HP', bonus: { attack: 8, hp: -10 } },
  { id: 'leftovers', name: 'Leftovers', description: '+15 Max HP', bonus: { hp: 15 } },
  { id: 'expert-belt', name: 'Expert Belt', description: '+3 Atk +3 Def', bonus: { attack: 3, defense: 3 } },
  { id: 'choice-band', name: 'Choice Band', description: '+10 Attack', bonus: { attack: 10 } },
  { id: 'choice-scarf', name: 'Choice Scarf', description: '+10 Speed', bonus: { speed: 10 } },
  { id: 'assault-vest', name: 'Assault Vest', description: '+10 Defense', bonus: { defense: 10 } },
  { id: 'focus-sash', name: 'Focus Sash', description: '+20 Max HP', bonus: { hp: 20 } }
]

export function getRandomItems(count: number): Item[] {
  const shuffled = [...ITEMS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function unequipItem(pokemon: Pokemon) {
  if (!pokemon.heldItem) return null

  const heldItemName = pokemon.heldItem
  const item = ITEMS.find(i => i.name === heldItemName)
  if (!item) return null

  pokemon.attack -= item.bonus.attack || 0
  pokemon.defense -= item.bonus.defense || 0
  pokemon.speed -= item.bonus.speed || 0
  if (item.bonus.hp) {
    pokemon.maxHp -= item.bonus.hp
    pokemon.hp = Math.min(pokemon.hp - item.bonus.hp, pokemon.maxHp)
    if (pokemon.maxHp < 1) pokemon.maxHp = 1
    if (pokemon.hp < 1) pokemon.hp = 1
  }
  pokemon.heldItem = undefined

  return item
}

export function equipItem(pokemon: Pokemon, item: Item): Item | null {
  const oldItem = unequipItem(pokemon)

  pokemon.attack += item.bonus.attack || 0
  pokemon.defense += item.bonus.defense || 0
  pokemon.speed += item.bonus.speed || 0
  if (item.bonus.hp) {
    pokemon.maxHp += item.bonus.hp
    pokemon.hp = Math.min(pokemon.hp + item.bonus.hp, pokemon.maxHp)
    if (pokemon.maxHp < 1) pokemon.maxHp = 1
    if (pokemon.hp < 1) pokemon.hp = 1
  }
  ;(pokemon as any).heldItem = item.name

  return oldItem
}
