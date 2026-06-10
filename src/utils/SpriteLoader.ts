import Phaser from 'phaser'
import { spriteKey, spriteUrl } from '../entities/PokemonFactory'
import { ITEM_SPRITES, itemSpriteKey } from '../data/GameAssets'

export function loadSprite(scene: Phaser.Scene, dexId: number, back: boolean = false): Promise<string> {
  const key = spriteKey(dexId, back)
  if (scene.textures.exists(key)) {
    return Promise.resolve(key)
  }
  return new Promise((resolve) => {
    scene.load.image(key, spriteUrl(dexId, back))
    scene.load.once('complete', () => resolve(key))
    scene.load.once(`fileerror-image-${key}`, () => resolve(''))
    scene.load.start()
  })
}

export function preloadSprites(scene: Phaser.Scene, dexIds: number[], back: boolean = false) {
  dexIds.forEach(id => {
    const key = spriteKey(id, back)
    if (!scene.textures.exists(key)) {
      scene.load.image(key, spriteUrl(id, back))
    }
  })
}

export function preloadItemSprites(scene: Phaser.Scene) {
  Object.entries(ITEM_SPRITES).forEach(([id, url]) => {
    const key = itemSpriteKey(id)
    if (!scene.textures.exists(key)) {
      scene.load.image(key, url)
    }
  })
}
