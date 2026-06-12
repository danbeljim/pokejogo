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
  requiresItemPicker?: boolean
  requiresCapturePicker?: boolean
  captureOptions?: Pokemon[]
}

export default class EventManager {
  handleEvent(platform: MapNode, playerTeam: Pokemon[], difficulty: number = 1, gymName?: string): EventResult {
    switch (platform.eventType) {
      case PlatformEventType.POKEMON_CAPTURE:
        return this.handleCapture(platform, playerTeam, difficulty)
      case PlatformEventType.WILD_POKEMON:
        return this.prepareWildBattle(platform, difficulty)
      case PlatformEventType.TRAINER_BATTLE:
        return this.prepareTrainerBattle(platform, difficulty)
      case PlatformEventType.ITEM_PICKUP:
        return this.handleItemPickup(platform)
      case PlatformEventType.BOSS:
        return this.prepareBossBattle(difficulty, gymName || 'Boss', playerTeam)
      default:
        return { type: PlatformEventType.POKEMON_CAPTURE, message: 'Unknown' }
    }
  }

  private handleCapture(_platform: MapNode, playerTeam: Pokemon[], difficulty: number): EventResult {
    const level = Math.max(3, difficulty * 3 + Math.floor(Math.random() * 4))
    const opts: Pokemon[] = []
    const seen = new Set<number>()
    let tries = 0
    while (opts.length < 3 && tries < 20) {
      const p = createWildPokemon(level)
      if (!seen.has(p.id)) {
        seen.add(p.id)
        opts.push(p)
      }
      tries++
    }
    return {
      type: PlatformEventType.POKEMON_CAPTURE,
      message: playerTeam.length >= 6
        ? '¡Equipo lleno! Elige uno para cambiar o salta.'
        : 'Elige un Pokémon para capturar:',
      requiresCapturePicker: true,
      captureOptions: opts
    }
  }

  private prepareWildBattle(platform: MapNode, difficulty: number): EventResult {
    const level = platform.eventData?.level || (2 + difficulty * 2)
    const wild = createWildPokemon(level, platform.eventData?.pokemonId)
    return {
      type: PlatformEventType.WILD_POKEMON,
      message: `¡Apareció ${wild.name} salvaje!`,
      requiresBattle: true,
      enemyTeam: [wild],
      battleType: 'wild'
    }
  }

  private prepareTrainerBattle(platform: MapNode, difficulty: number): EventResult {
    const team: Pokemon[] = platform.eventData?.team || createTrainerTeam(difficulty)
    return {
      type: PlatformEventType.TRAINER_BATTLE,
      message: `¡Un Entrenador te reta!`,
      requiresBattle: true,
      enemyTeam: team,
      battleType: 'trainer'
    }
  }

  private prepareBossBattle(difficulty: number, gymName: string, playerTeam: Pokemon[]): EventResult {
    const playerMax = Math.max(...playerTeam.map(p => p.level), 5)
    const team = createGymLeaderTeam(difficulty, playerMax - 1)
    return {
      type: PlatformEventType.BOSS,
      message: `¡Aparece el Líder de Gimnasio ${gymName}!`,
      requiresBattle: true,
      enemyTeam: team,
      battleType: 'boss'
    }
  }

  private handleItemPickup(_platform: MapNode): EventResult {
    return {
      type: PlatformEventType.ITEM_PICKUP,
      message: '¡Encontraste 3 objetos! Elige uno.',
      requiresItemPicker: true
    }
  }

  applyBattleReward(playerTeam: Pokemon[], battleType: 'wild' | 'trainer' | 'boss'): string {
    const levelGain = battleType === 'wild' ? 1 : battleType === 'trainer' ? 2 : 3
    const notes: string[] = []
    playerTeam.forEach(p => {
      if (!p.isAlive()) return
      for (let i = 0; i < levelGain; i++) {
        const ev = p.levelUp()
        if (ev.learnedMoves.length) {
          notes.push(`¡${p.name} aprendió ${ev.learnedMoves.join(', ')}!`)
        }
        if (ev.evolvedTo) {
          notes.push(`¡${ev.evolvedFrom} evolucionó a ${ev.evolvedTo}!`)
        }
      }
    })
    const base = `+${levelGain} Nv`
    return notes.length ? `${base}. ${notes.join(' ')}` : base
  }
}
