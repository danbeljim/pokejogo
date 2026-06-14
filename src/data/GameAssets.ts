export const ITEM_SPRITES: Record<string, string> = {
  pokeball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
  potion: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png',
  rarecandy: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png',
  greatball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png',
  bag: '/assets/Mochila_DP_(chico).png',
  menuBtn: '/assets/80px-Cuerda_huida_EP.png',
  pokemon_center: '/assets/locations/enfermera_joy.webp',
  // Vitamins
  'hp-up':   '/assets/items/masps.png',
  protein:   '/assets/items/proteina.png',
  iron:      '/assets/items/hierro.png',
  carbos:    '/assets/items/Carburante_(Dream_World).png',
  calcium:   '/assets/items/calcio.png',
  zinc:      '/assets/items/zinc.png',
  // Relics
  leftovers:    '/assets/items/Restos_EP.png',
  'life-orb':   '/assets/items/Vidasfera_(Dream_World).png',
  'focus-sash': '/assets/items/Banda_aguante_(Dream_World).png',
  'choice-band':'/assets/items/choice_band.png',
  // Random node
  'random': '/assets/random/interrogante.gif',
  // Random node options
  'random-excavar':  '/assets/random/Excavar_LGPE.gif',
  'random-supercana':'/assets/random/Supercaña_DBPR.png',
  'random-vuelo':    '/assets/random/Vuelo_HGSS.gif',
}

// Kanto gym badges (local assets)
export const BADGE_SPRITES: Record<string, string> = {
  'Brock':     '/assets/items/badge-boulder.png',
  'Misty':     '/assets/items/badge-cascade.png',
  'Lt. Surge': '/assets/items/badge-thunder.png',
  'Erika':     '/assets/items/badge-rainbow.png',
  'Koga':      '/assets/items/badge-soul.png',
  'Sabrina':   '/assets/items/badge-marsh.png',
  'Blaine':    '/assets/items/badge-volcano.png',
  'Giovanni':  '/assets/items/badge-earth.png',
}

export function badgeSpriteKey(gymLeaderName: string): string {
  return `badge-${gymLeaderName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`
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
  'Giovanni': '/assets/trainers/giovanni.png',
  'Marowak Fantasma': '/assets/trainers/Marowak_fantasma.webp'
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
