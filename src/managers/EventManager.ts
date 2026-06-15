import { PlatformEventType } from '../types'
import { MapNode } from './LevelGenerator'
import { Pokemon } from '../entities/Pokemon'
import { createWildPokemon, createGymLeaderTeam } from '../entities/PokemonFactory'
import { assignRogueTraits } from '../data/RoguelikeData'
import { applyEnemyScale } from '../data/StatSystem'

const PORTAL_IDS = [147, 63, 92, 143, 142]

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
  requiresRandomPicker?: boolean
  requiresBerryTree?: boolean
  requiresDojo?: boolean
  requiresProfessor?: boolean
  requiresPortal?: boolean
  portalPokemon?: Pokemon
  isDouble?: boolean
}

export default class EventManager {
  roguelikeMode: boolean = false
  trainerClass: string | null = null
  wildPool: number[] | undefined = undefined
  currentFloor: number = 0

  handleEvent(platform: MapNode, playerTeam: Pokemon[], difficulty: number = 1, gymName?: string, bossMaxLevel: number = 14, wildMin: number = 3, wildMax: number = 6, ghostOnly: boolean = false): EventResult {
    const trainerMax = Math.max(3, Math.floor(bossMaxLevel * 0.70))
    switch (platform.eventType) {
      case PlatformEventType.POKEMON_CAPTURE:
        return this.handleCapture(platform, playerTeam, wildMin, wildMax, ghostOnly)
      case PlatformEventType.WILD_POKEMON:
        return this.prepareWildBattle(platform, wildMin, wildMax)
      case PlatformEventType.TRAINER_BATTLE:
        return this.prepareTrainerBattle(platform, difficulty, trainerMax)
      case PlatformEventType.ITEM_PICKUP:
        return this.handleItemPickup(platform)
      case PlatformEventType.BOSS:
        return this.prepareBossBattle(difficulty, gymName || 'Boss', playerTeam)
      case PlatformEventType.POKEMON_CENTER:
        return this.handlePokemonCenter(playerTeam)
      case PlatformEventType.RANDOM:
        return { type: PlatformEventType.RANDOM, message: '¡Un evento especial!', requiresRandomPicker: true }
      case PlatformEventType.MEMORIAL:
        return this.handleMemorial(platform, playerTeam)
      case PlatformEventType.NARRATIVE:
        return this.handleNarrative()
      case PlatformEventType.DOUBLE_BATTLE:
        return this.prepareDoubleBattle(difficulty, trainerMax)
      case PlatformEventType.BERRY_TREE:
        return { type: PlatformEventType.BERRY_TREE, message: '¡Un Árbol de Bayas!', requiresBerryTree: true }
      case PlatformEventType.DOJO:
        return { type: PlatformEventType.DOJO, message: '¡Bienvenido al Dojo!', requiresDojo: true }
      case PlatformEventType.PROFESSOR:
        return { type: PlatformEventType.PROFESSOR, message: '¡El Profesor te espera!', requiresProfessor: true }
      case PlatformEventType.PORTAL:
        return this.preparePortalBattle(playerTeam)
      default:
        return { type: PlatformEventType.POKEMON_CAPTURE, message: 'Unknown' }
    }
  }

  private handleCapture(_platform: MapNode, playerTeam: Pokemon[], wildMin: number, wildMax: number, ghostOnly: boolean = false): EventResult {
    const level = wildMin + Math.floor(Math.random() * (wildMax - wildMin + 1))
    const opts: Pokemon[] = []
    const seen = new Set<number>()
    const GHOST_IDS = [92, 92, 93]
    let tries = 0
    const poolIds = (!ghostOnly && this.wildPool && this.wildPool.length > 0) ? this.wildPool : null
    while (opts.length < 3 && tries < 20) {
      const p = ghostOnly
        ? createWildPokemon(level, GHOST_IDS[opts.length])
        : poolIds
        ? createWildPokemon(level, poolIds[Math.floor(Math.random() * poolIds.length)])
        : createWildPokemon(level)
      if (!seen.has(p.id) || ghostOnly) {
        seen.add(p.id)
        if (this.roguelikeMode) {
          const guaranteePositive = this.trainerClass === 'criador'
          assignRogueTraits(p, guaranteePositive)
        }
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

  private prepareWildBattle(platform: MapNode, wildMin: number, wildMax: number): EventResult {
    const level = platform.eventData?.level || (wildMin + Math.floor(Math.random() * (wildMax - wildMin + 1)))
    const wild = createWildPokemon(level, platform.eventData?.pokemonId, true)
    applyEnemyScale(wild, this.currentFloor)
    if (this.roguelikeMode) assignRogueTraits(wild, false)
    return {
      type: PlatformEventType.WILD_POKEMON,
      message: `¡Apareció ${wild.name} salvaje!`,
      requiresBattle: true,
      enemyTeam: [wild],
      battleType: 'wild'
    }
  }

  private buildTeamFromPool(size: number, level: number): Pokemon[] {
    const poolIds = this.wildPool && this.wildPool.length > 0 ? this.wildPool : undefined
    return Array.from({ length: size }, (_, i) => {
      const lvl = Math.max(1, level - i)
      const dexId = poolIds ? poolIds[Math.floor(Math.random() * poolIds.length)] : undefined
      return createWildPokemon(lvl, dexId, true)
    })
  }

  private prepareTrainerBattle(platform: MapNode, difficulty: number, trainerMax: number): EventResult {
    const teamSize = Math.min(1 + Math.floor(difficulty / 2), 3)
    const team: Pokemon[] = this.buildTeamFromPool(teamSize, Math.max(2, Math.floor(trainerMax * 0.8)))
    team.forEach(p => {
      applyEnemyScale(p, this.currentFloor)
      if (this.roguelikeMode) assignRogueTraits(p, false)
    })
    return {
      type: PlatformEventType.TRAINER_BATTLE,
      message: `¡Un Entrenador te reta!`,
      requiresBattle: true,
      enemyTeam: team,
      battleType: 'trainer'
    }
  }

  private prepareBossBattle(_difficulty: number, gymName: string, _playerTeam: Pokemon[]): EventResult {
    const team = createGymLeaderTeam(gymName)
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

  private handlePokemonCenter(playerTeam: Pokemon[]): EventResult {
    playerTeam.forEach(p => p.heal(p.maxHp))
    return {
      type: PlatformEventType.POKEMON_CENTER,
      message: '¡Bienvenido al Centro Pokémon! Tu equipo ha sido restaurado completamente.'
    }
  }

  private handleMemorial(platform: MapNode, playerTeam: Pokemon[]): EventResult {
    const pct = platform.eventData?.healPercent ?? 0.4
    playerTeam.forEach(p => p.heal(Math.floor(p.maxHp * pct)))
    return {
      type: PlatformEventType.MEMORIAL,
      message: '🙏 Sala Memorial. Una paz extraña recorre la torre... El equipo recupera el 40% de PS.'
    }
  }

  private handleNarrative(): EventResult {
    const EVENTS = [
      '📜 Un médium te habla: "Los espíritus aquí llevan décadas sin descanso..."',
      '📜 Encuentras una lápida. Pone: "Pokémon caído en batalla. Nunca olvidado."',
      '📜 Una voz susurra tu nombre. No hay nadie. Sientes un escalofrío.',
      '📜 Un niño Rocket abandonó aquí su bichapod. Yace inmóvil en el suelo.',
      '📜 Las paredes vibran levemente. Desde arriba llega un gemido distante.',
    ]
    const msg = EVENTS[Math.floor(Math.random() * EVENTS.length)]
    return { type: PlatformEventType.NARRATIVE, message: msg }
  }

  private prepareDoubleBattle(difficulty: number, trainerMax: number): EventResult {
    const teamSize = Math.min(2 + Math.floor(difficulty / 2), 4)
    const team: Pokemon[] = this.buildTeamFromPool(Math.max(2, teamSize), Math.max(2, Math.floor(trainerMax * 0.85)))
    team.slice(0, 2).forEach(p => applyEnemyScale(p, this.currentFloor))
    return {
      type: PlatformEventType.DOUBLE_BATTLE,
      message: '⚔️ ¡COMBATE DOBLE! Dos entrenadores te desafían.',
      requiresBattle: true,
      enemyTeam: team.slice(0, 2),
      battleType: 'trainer',
      isDouble: true
    }
  }

  private preparePortalBattle(playerTeam: Pokemon[]): EventResult {
    const playerMax = Math.max(...playerTeam.map(p => p.level), 5)
    const level = playerMax + 5
    const dexId = PORTAL_IDS[Math.floor(Math.random() * PORTAL_IDS.length)]
    const legendary = createWildPokemon(level, dexId, true)
    return {
      type: PlatformEventType.PORTAL,
      message: `✨ ¡Un Pokémon Legendario aparece en el portal!`,
      requiresPortal: true,
      portalPokemon: legendary
    }
  }

  applyBattleReward(playerTeam: Pokemon[], battleType: 'wild' | 'trainer' | 'boss'): { message: string; pendingEvolutions: Pokemon[] } {
    const baseGain = battleType === 'wild' ? 1 : battleType === 'trainer' ? 2 : 3
    const levelGain = (this.roguelikeMode && this.trainerClass === 'luchador')
      ? Math.ceil(baseGain * 1.5)
      : baseGain
    const notes: string[] = []
    const pendingEvolutions: Pokemon[] = []
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
        if (ev.needsEvoChoice && !pendingEvolutions.includes(p)) {
          pendingEvolutions.push(p)
        }
      }
    })
    const base = `+${levelGain} Nv`
    const message = notes.length ? `${base}. ${notes.join(' ')}` : base
    return { message, pendingEvolutions }
  }
}
