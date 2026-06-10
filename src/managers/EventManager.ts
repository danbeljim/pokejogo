import { PlatformEventType } from '../types'
import { MapNode } from './LevelGenerator'
import { Pokemon } from '../entities/Pokemon'
import { createWildPokemon, createTrainerTeam, createGymLeaderTeam } from '../entities/PokemonFactory'

export interface EventResult {
  type: PlatformEventType
  message: string
  requiresBattle?: boolean
  enemyTeam?: Pokemon[]
  battleType?: 'wild' | 'trainer' | 'boss'
  pokemonCaught?: Pokemon
  itemObtained?: string
}

export default class EventManager {
  handleEvent(platform: MapNode, playerTeam: Pokemon[], difficulty: number = 1, gymName?: string): EventResult {
    switch (platform.eventType) {
      case PlatformEventType.POKEMON_CAPTURE:
        return this.handleCapture(platform, playerTeam, difficulty)
      case PlatformEventType.WILD_POKEMON:
        return this.prepareWildBattle(platform, difficulty)
      case PlatformEventType.TRAINER_BATTLE:
        return this.prepareTrainerBattle(difficulty)
      case PlatformEventType.ITEM_PICKUP:
        return this.handleItemPickup(platform)
      case PlatformEventType.BOSS:
        return this.prepareBossBattle(difficulty, gymName || 'Boss')
      default:
        return { type: PlatformEventType.POKEMON_CAPTURE, message: 'Unknown' }
    }
  }

  private handleCapture(platform: MapNode, playerTeam: Pokemon[], difficulty: number): EventResult {
    if (playerTeam.length >= 6) {
      return {
        type: PlatformEventType.POKEMON_CAPTURE,
        message: 'Team full! Skipped capture.'
      }
    }
    const level = Math.max(3, difficulty * 3 + Math.floor(Math.random() * 4))
    const pokemon = createWildPokemon(level, platform.eventData?.pokemonId)
    playerTeam.push(pokemon)
    return {
      type: PlatformEventType.POKEMON_CAPTURE,
      message: `Caught ${pokemon.name} (Lv.${pokemon.level})! Team: ${playerTeam.length}/6`,
      pokemonCaught: pokemon
    }
  }

  private prepareWildBattle(platform: MapNode, difficulty: number): EventResult {
    const level = platform.eventData?.level || (2 + difficulty * 2)
    const wild = createWildPokemon(level, platform.eventData?.pokemonId)
    return {
      type: PlatformEventType.WILD_POKEMON,
      message: `Wild ${wild.name} appeared!`,
      requiresBattle: true,
      enemyTeam: [wild],
      battleType: 'wild'
    }
  }

  private prepareTrainerBattle(difficulty: number): EventResult {
    const team = createTrainerTeam(difficulty)
    return {
      type: PlatformEventType.TRAINER_BATTLE,
      message: `Trainer challenges you!`,
      requiresBattle: true,
      enemyTeam: team,
      battleType: 'trainer'
    }
  }

  private prepareBossBattle(difficulty: number, gymName: string): EventResult {
    const team = createGymLeaderTeam(difficulty)
    return {
      type: PlatformEventType.BOSS,
      message: `Gym Leader ${gymName} appears!`,
      requiresBattle: true,
      enemyTeam: team,
      battleType: 'boss'
    }
  }

  private handleItemPickup(platform: MapNode): EventResult {
    const items = ['Potion', 'Super Potion', 'Full Restore', 'Max Revive', 'X Attack']
    const item = items[(platform.eventData?.itemId || 0) % items.length]
    return {
      type: PlatformEventType.ITEM_PICKUP,
      message: `Found ${item}!`,
      itemObtained: item
    }
  }

  applyBattleReward(playerTeam: Pokemon[], battleType: 'wild' | 'trainer' | 'boss'): string {
    const levelGain = battleType === 'wild' ? 1 : battleType === 'trainer' ? 2 : 3
    playerTeam.forEach(p => {
      if (p.isAlive()) {
        for (let i = 0; i < levelGain; i++) p.levelUp()
      }
    })
    return `All Pokémon gained ${levelGain} level(s)!`
  }
}
