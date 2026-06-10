import Phaser from 'phaser'
import { Platform } from './LevelGenerator'
import { PlatformEventType } from '../types'

export default class PlatformManager {
  private scene: Phaser.Scene
  private platforms: Phaser.Physics.Arcade.StaticGroup
  private platformData: Map<any, Platform> = new Map()
  private platformGraphics: Map<any, Phaser.GameObjects.Graphics> = new Map()
  private currentPlatforms: Platform[] = []

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.platforms = scene.physics.add.staticGroup()
  }

  createPlatforms(platforms: Platform[]) {
    this.currentPlatforms = platforms
    this.platformData.clear()
    this.platformGraphics.clear()

    platforms.forEach(platform => {
      const color = this.getColorForEventType(platform.eventType)

      // Create graphics for visual
      const graphics = this.scene.add.graphics()
      graphics.fillStyle(color, 1)
      graphics.fillRect(platform.x - platform.width / 2, platform.y, platform.width, platform.height)

      // Create physics body
      const sprite = this.platforms.create(platform.x, platform.y, '')
      sprite.body?.setSize(platform.width, platform.height)
      sprite.setVisible(false)

      this.platformData.set(sprite, platform)
      this.platformGraphics.set(sprite, graphics)
    })
  }

  getPlatformsGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.platforms
  }

  getPlatformData(sprite: any): Platform | undefined {
    return this.platformData.get(sprite)
  }

  private getColorForEventType(eventType: PlatformEventType): number {
    switch (eventType) {
      case PlatformEventType.POKEMON_CAPTURE:
        return 0x4CAF50 // Green
      case PlatformEventType.TRAINER_BATTLE:
        return 0xFF5722 // Orange
      case PlatformEventType.WILD_POKEMON:
        return 0xFF9800 // Amber
      case PlatformEventType.ITEM_PICKUP:
        return 0x2196F3 // Blue
      case PlatformEventType.BOSS:
        return 0xFFD700 // Gold
      default:
        return 0x808080 // Gray
    }
  }

  clearPlatforms() {
    this.platforms.clear(true)
    this.platformData.clear()
  }
}
