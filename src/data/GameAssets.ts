export const ITEM_SPRITES: Record<string, string> = {
  pokeball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
  potion: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png',
  rarecandy: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png',
  greatball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png'
}

// Legacy fallback (kept for backward compat)
export const TRAINER_ICON_DEX = 66

// Rival/trainer sprites (local copies of Pokemon Showdown sprites)
export const TRAINER_SPRITES: Record<string, string> = {
  'blue': '/assets/trainers/blue.png',
  'red': '/assets/trainers/red.png',
  'silver': '/assets/trainers/silver.png',
  'lance': '/assets/trainers/lance.png',
  'youngster': '/assets/trainers/youngster.png',
  'bugcatcher': '/assets/trainers/bugcatcher.png',
  'lass': '/assets/trainers/lass.png',
  'hiker': '/assets/trainers/hiker.png'
}

export const TRAINER_KEYS = Object.keys(TRAINER_SPRITES)

// Gym leader sprites (Gen1 Kanto)
export const GYM_LEADER_SPRITES: Record<string, string> = {
  'Brock': '/assets/trainers/brock.png',
  'Misty': '/assets/trainers/misty.png',
  'Lt. Surge': '/assets/trainers/ltsurge.png',
  'Erika': '/assets/trainers/erika.png',
  'Koga': '/assets/trainers/koga.png',
  'Sabrina': '/assets/trainers/sabrina.png',
  'Blaine': '/assets/trainers/blaine.png',
  'Giovanni': '/assets/trainers/giovanni.png'
}

export function gymLeaderSpriteKey(name: string): string {
  return `gymleader-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`
}

export function itemSpriteKey(id: string): string {
  return `item-${id}`
}

export function trainerSpriteKey(id: string): string {
  return `trainer-${id}`
}
