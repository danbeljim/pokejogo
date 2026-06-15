import { PlatformEventType } from '../types'
import { MapNode } from './LevelGenerator'
import { Pokemon } from '../entities/Pokemon'
import { createWildPokemon, createGymLeaderTeam, createTrainerTeam } from '../entities/PokemonFactory'
import { assignRogueTraits } from '../data/RoguelikeData'

const LEGENDARY_IDS = [144, 145, 146, 150, 151]

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
}

export default class EventManager {
  roguelikeMode: boolean = false
  trainerClass: string | null = null

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
    while (opts.length < 3 && tries < 20) {
      const p = ghostOnly
        ? createWildPokemon(level, GHOST_IDS[opts.length])
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
    if (this.roguelikeMode) assignRogueTraits(wild, false)
    return {
      type: PlatformEventType.WILD_POKEMON,
      message: `¡Apareció ${wild.name} salvaje!`,
      requiresBattle: true,
      enemyTeam: [wild],
      battleType: 'wild'
    }
  }

  private prepareTrainerBattle(platform: MapNode, difficulty: number, trainerMax: number): EventResult {
    const teamSize = Math.min(1 + Math.floor(difficulty / 2), 3)
    const team: Pokemon[] = platform.eventData?.team || Array.from({ length: teamSize }, (_, i) => {
      const lvl = Math.max(2, Math.floor(trainerMax * (0.8 - i * 0.1)))
      const p = createWildPokemon(lvl, undefined, true)
      if (this.roguelikeMode) assignRogueTraits(p, false)
      return p
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
    const team: Pokemon[] = createTrainerTeam(Math.min(difficulty + 1, 5), trainerMax)
    if (team.length < 2) team.push(createWildPokemon(trainerMax, undefined, true))
    return {
      type: PlatformEventType.DOUBLE_BATTLE,
      message: '⚔️ ¡COMBATE DOBLE! Dos entrenadores te desafían.',
      requiresBattle: true,
      enemyTeam: team.slice(0, 2),
      battleType: 'trainer'
    }
  }

  private preparePortalBattle(playerTeam: Pokemon[]): EventResult {
    const playerMax = Math.max(...playerTeam.map(p => p.level), 20)
    const level = Math.max(35, playerMax + 5)
    const dexId = LEGENDARY_IDS[Math.floor(Math.random() * LEGENDARY_IDS.length)]
    const legendary = createWildPokemon(level, dexId, true)
    return {
      type: PlatformEventType.PORTAL,
      message: `✨ ¡Un Pokémon Legendario aparece en el portal!`,
      requiresPortal: true,
      portalPokemon: legendary
    }
  }

  applyBattleReward(playerTeam: Pokemon[], battleType: 'wild' | 'trainer' | 'boss'): string {
    const baseGain = battleType === 'wild' ? 1 : battleType === 'trainer' ? 2 : 3
    const levelGain = (this.roguelikeMode && this.trainerClass === 'luchador')
      ? Math.ceil(baseGain * 1.5)
      : baseGain
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
