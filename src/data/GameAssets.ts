export const ITEM_SPRITES: Record<string, string> = {
  pokeball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
  potion: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png',
  rarecandy: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png',
  greatball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png'
}

// Pokemon used as trainer icon (representative of "trainer" battles)
export const TRAINER_ICON_DEX = 66 // Machop, classic trainer-rep pokemon

export function itemSpriteKey(id: string): string {
  return `item-${id}`
}
