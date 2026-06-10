import { PlatformEventType } from '../types'

export interface Platform {
  x: number
  y: number
  width: number
  height: number
  eventType: PlatformEventType
  eventData?: any
}

export default class LevelGenerator {
  private seed: number = 0

  generateLevel(platformCount: number, difficulty: number): Platform[] {
    const platforms: Platform[] = []
    const worldWidth = 800
    const worldHeight = 600
    const baseSpacing = worldHeight / (platformCount + 2)

    // Starting platform
    platforms.push({
      x: worldWidth / 2,
      y: worldHeight - 50,
      width: 100,
      height: 20,
      eventType: PlatformEventType.POKEMON_CAPTURE
    })

    // Generate middle platforms
    for (let i = 1; i <= platformCount - 2; i++) {
      const y = worldHeight - (i * baseSpacing) - (Math.random() * 30 - 15)
      const x = 50 + Math.random() * (worldWidth - 100)
      const width = 60 + Math.random() * 40

      const eventType = this.getRandomEvent(difficulty)

      platforms.push({
        x,
        y,
        width,
        height: 20,
        eventType,
        eventData: this.generateEventData(eventType)
      })
    }

    // Boss platform
    platforms.push({
      x: worldWidth / 2,
      y: 50,
      width: 100,
      height: 20,
      eventType: PlatformEventType.BOSS
    })

    return platforms.sort((a, b) => b.y - a.y)
  }

  private getRandomEvent(difficulty: number): PlatformEventType {
    const rand = Math.random()
    const eventTypes = [
      PlatformEventType.POKEMON_CAPTURE,
      PlatformEventType.TRAINER_BATTLE,
      PlatformEventType.WILD_POKEMON,
      PlatformEventType.ITEM_PICKUP
    ]

    // Higher difficulty = more battles
    if (rand < 0.2 + difficulty * 0.05) return PlatformEventType.TRAINER_BATTLE
    if (rand < 0.4 + difficulty * 0.05) return PlatformEventType.WILD_POKEMON
    if (rand < 0.7) return PlatformEventType.POKEMON_CAPTURE
    return PlatformEventType.ITEM_PICKUP
  }

  private generateEventData(eventType: PlatformEventType): any {
    switch (eventType) {
      case PlatformEventType.POKEMON_CAPTURE:
        return { pokemonId: Math.floor(Math.random() * 151) + 1 }
      case PlatformEventType.TRAINER_BATTLE:
        return { trainerLevel: Math.floor(Math.random() * 10) + 5 }
      case PlatformEventType.WILD_POKEMON:
        return { pokemonId: Math.floor(Math.random() * 151) + 1, level: Math.floor(Math.random() * 5) + 1 }
      case PlatformEventType.ITEM_PICKUP:
        return { itemId: Math.floor(Math.random() * 5) }
      default:
        return {}
    }
  }
}
