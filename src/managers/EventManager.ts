import { PlatformEventType } from '../types'
import { Platform } from './LevelGenerator'
import { Pokemon } from '../entities/Pokemon'

export interface EventResult {
  type: PlatformEventType
  message: string
  pokemonCaught?: Pokemon
  pokemonLeveledUp?: boolean
  itemObtained?: string
  expGained?: number
}

export default class EventManager {
  private capturedPokemon: Map<number, Pokemon> = new Map()

  handleEvent(platform: Platform, playerTeam: Pokemon[]): EventResult {
    switch (platform.eventType) {
      case PlatformEventType.POKEMON_CAPTURE:
        return this.handleCapture(platform, playerTeam)
      case PlatformEventType.WILD_POKEMON:
        return this.handleWildBattle(platform, playerTeam)
      case PlatformEventType.TRAINER_BATTLE:
        return this.handleTrainerBattle(platform, playerTeam)
      case PlatformEventType.ITEM_PICKUP:
        return this.handleItemPickup(platform)
      case PlatformEventType.BOSS:
        return this.handleBossBattle(platform)
      default:
        return { type: PlatformEventType.POKEMON_CAPTURE, message: 'Unknown event' }
    }
  }

  private handleCapture(platform: Platform, playerTeam: Pokemon[]): EventResult {
    const pokemonId = platform.eventData?.pokemonId || 1
    const pokemon = new Pokemon({
      id: pokemonId,
      name: `Pokémon #${pokemonId}`,
      level: 5 + playerTeam.length,
      hp: 20,
      maxHp: 20,
      attack: 8,
      defense: 8,
      speed: 8,
      moves: ['Tackle', 'Growl']
    })

    playerTeam.push(pokemon)

    return {
      type: PlatformEventType.POKEMON_CAPTURE,
      message: `Caught ${pokemon.name} (Level ${pokemon.level})!`,
      pokemonCaught: pokemon
    }
  }

  private handleWildBattle(platform: Platform, playerTeam: Pokemon[]): EventResult {
    if (playerTeam.length === 0) {
      return {
        type: PlatformEventType.WILD_POKEMON,
        message: 'No Pokémon to battle!'
      }
    }

    const pokemonId = platform.eventData?.pokemonId || 1
    const wildPokemon = new Pokemon({
      id: pokemonId,
      name: `Wild Pokémon #${pokemonId}`,
      level: platform.eventData?.level || 3,
      hp: 15,
      maxHp: 15,
      attack: 5,
      defense: 5,
      speed: 5,
      moves: ['Tackle']
    })

    const playerPokemon = playerTeam[0]
    playerPokemon.levelUp()

    return {
      type: PlatformEventType.WILD_POKEMON,
      message: `Defeated wild ${wildPokemon.name}! ${playerPokemon.name} grew to Level ${playerPokemon.level}!`,
      pokemonLeveledUp: true,
      expGained: 10
    }
  }

  private handleTrainerBattle(platform: Platform, playerTeam: Pokemon[]): EventResult {
    if (playerTeam.length === 0) {
      return {
        type: PlatformEventType.TRAINER_BATTLE,
        message: 'No Pokémon to battle!'
      }
    }

    playerTeam.forEach(poke => {
      poke.levelUp()
      poke.levelUp()
    })

    return {
      type: PlatformEventType.TRAINER_BATTLE,
      message: `Defeated trainer! All Pokémon gained 2 levels!`,
      pokemonLeveledUp: true,
      expGained: 30
    }
  }

  private handleItemPickup(platform: Platform): EventResult {
    const items = ['Potion', 'Super Potion', 'Full Restore', 'Max Revive', 'Stat Boost']
    const itemId = platform.eventData?.itemId || 0
    const item = items[itemId % items.length]

    return {
      type: PlatformEventType.ITEM_PICKUP,
      message: `Found ${item}!`,
      itemObtained: item
    }
  }

  private handleBossBattle(platform: Platform): EventResult {
    return {
      type: PlatformEventType.BOSS,
      message: 'Time to face the Gym Leader!',
      expGained: 50
    }
  }
}
