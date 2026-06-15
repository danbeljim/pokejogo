import { PokemonType } from '../data/Types'
import { EVOLUTIONS, BRANCH_EVOLUTIONS } from '../data/Evolution'
import { LEARNSET } from '../data/Learnset'

export interface LevelUpEvent {
  learnedMoves: string[]
  evolvedFrom?: string
  evolvedTo?: string
  needsEvoChoice?: boolean
}

export function calcStat(base: number, level: number): number {
  const raw = Math.round(base * (1 + 0.04 * Math.pow(level, 1.05)))
  return Math.max(1, raw <= 150 ? raw : Math.round(150 + (raw - 150) * 0.5))
}

export function calcHp(base: number, level: number): number {
  return Math.max(1, Math.round(base * (1 + 0.05 * Math.pow(level, 1.05)) + level * 0.5))
}

export interface PokemonData {
  id: number
  name: string
  level: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  moves: string[]
  type?: PokemonType
  heldItem?: string
  traits?: string[]
  baseHp?: number
  baseAtk?: number
  baseDef?: number
  baseSpd?: number
}

export class Pokemon implements PokemonData {
  id: number
  name: string
  level: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  moves: string[]
  type: PokemonType
  heldItem?: string
  traits: string[] = []
  experience: number = 0
  pendingEvoChoice: boolean = false
  baseHp: number
  baseAtk: number
  baseDef: number
  baseSpd: number

  constructor(data: PokemonData) {
    this.id = data.id
    this.name = data.name
    this.level = data.level
    this.hp = data.hp
    this.maxHp = data.maxHp
    this.attack = data.attack
    this.defense = data.defense
    this.speed = data.speed
    this.moves = data.moves
    this.type = data.type || 'normal'
    this.heldItem = data.heldItem
    this.traits = data.traits || []
    // Reverse-engineer base stats from current stats if not provided
    const growthFactor = (1 + 0.04 * Math.pow(data.level, 1.05))
    this.baseHp  = data.baseHp  ?? Math.max(1, Math.round((data.maxHp - data.level * 0.5) / (1 + 0.05 * Math.pow(data.level, 1.05))))
    this.baseAtk = data.baseAtk ?? Math.max(1, Math.round(data.attack / growthFactor))
    this.baseDef = data.baseDef ?? Math.max(1, Math.round(data.defense / growthFactor))
    this.baseSpd = data.baseSpd ?? Math.max(1, Math.round(data.speed / growthFactor))
  }

  levelUp(): LevelUpEvent {
    if (this.level >= 70) return { learnedMoves: [] }
    this.level++

    const prevHp = this.hp
    const newMaxHp = calcHp(this.baseHp, this.level)
    const hpGain = newMaxHp - this.maxHp
    this.maxHp = newMaxHp
    this.hp = Math.min(this.hp + hpGain, this.maxHp)
    this.attack  = calcStat(this.baseAtk, this.level)
    this.defense = calcStat(this.baseDef, this.level)
    this.speed   = calcStat(this.baseSpd, this.level)

    const event: LevelUpEvent = { learnedMoves: [] }

    // Learn moves
    const learns = LEARNSET[this.id] || []
    for (const entry of learns) {
      if (entry.level === this.level && !this.moves.includes(entry.move) && this.moves.length < 4) {
        this.moves.push(entry.move)
        event.learnedMoves.push(entry.move)
      }
    }

    // Branch evolution (e.g. Eevee): flag for player choice, don't auto-evolve
    const branchEvo = BRANCH_EVOLUTIONS[this.id]
    if (branchEvo && this.level >= branchEvo.level && !this.pendingEvoChoice) {
      this.pendingEvoChoice = true
      event.needsEvoChoice = true
    }

    // Evolve
    const evo = EVOLUTIONS[this.id]
    if (evo && this.level >= evo.level) {
      event.evolvedFrom = this.name
      event.evolvedTo = evo.toName
      this.id = evo.toDexId
      this.name = evo.toName
      this.type = evo.toType
      // On evolution, update base stats to evolved form and recalculate
      const EVO_BASE_STATS: Record<number, [number, number, number, number]> = {
        2:   [60,  62,  63,  60],  // Ivysaur
        3:   [80,  82,  83,  80],  // Venusaur
        5:   [58,  64,  58,  80],  // Charmeleon
        6:   [78,  84,  78, 100],  // Charizard
        8:   [59,  63,  80,  58],  // Wartortle
        9:   [79,  83, 100,  78],  // Blastoise
        17:  [63,  60,  55,  71],  // Pidgeotto
        18:  [83,  80,  75,  91],  // Pidgeot
        20:  [55,  81,  60,  97],  // Raticate
        22:  [65,  90,  65, 100],  // Fearow
        26:  [60,  90,  55, 110],  // Raichu
        42:  [75,  80,  70, 90],   // Golbat
        55:  [80,  82,  78,  85],  // Golduck
        61:  [65,  65,  65,  90],  // Poliwhirl
        64:  [40,  35,  30, 105],  // Kadabra
        67:  [80,  100, 70,  45],  // Machoke
        75:  [55,  95, 115,  35],  // Graveler
        78:  [65, 100,  70, 105],  // Rapidash
        80:  [95,  75, 110,  30],  // Slowbro
        93:  [45,  50,  45,  95],  // Haunter
        94:  [60,  65,  60, 110],  // Gengar
        130: [95, 125,  79,  81],  // Gyarados
        134: [130,  65,  60,  65], // Vaporeon
        135: [65,   65,  60, 130], // Jolteon
        136: [65,  130,  60,  65], // Flareon
      }
      const newBs = EVO_BASE_STATS[this.id]
      if (newBs) {
        this.baseHp = newBs[0]; this.baseAtk = newBs[1]
        this.baseDef = newBs[2]; this.baseSpd = newBs[3]
      }
      this.maxHp   = calcHp(this.baseHp, this.level)
      this.hp      = this.maxHp
      this.attack  = calcStat(this.baseAtk, this.level)
      this.defense = calcStat(this.baseDef, this.level)
      this.speed   = calcStat(this.baseSpd, this.level)
    }

    return event
  }

  applyEvoChoice(toDexId: number, toName: string, toType: PokemonType) {
    const EVO_BASE_STATS: Record<number, [number, number, number, number]> = {
      134: [130,  65,  60,  65],
      135: [65,   65,  60, 130],
      136: [65,  130,  60,  65],
    }
    this.pendingEvoChoice = false
    const prevName = this.name
    this.id = toDexId
    this.name = toName
    this.type = toType
    const bs = EVO_BASE_STATS[toDexId]
    if (bs) {
      this.baseHp = bs[0]; this.baseAtk = bs[1]
      this.baseDef = bs[2]; this.baseSpd = bs[3]
    }
    this.maxHp   = calcHp(this.baseHp, this.level)
    this.hp      = this.maxHp
    this.attack  = calcStat(this.baseAtk, this.level)
    this.defense = calcStat(this.baseDef, this.level)
    this.speed   = calcStat(this.baseSpd, this.level)
    return prevName
  }

  takeDamage(damage: number) {
    this.hp = Math.max(0, this.hp - damage)
  }

  heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount)
  }

  isAlive() {
    return this.hp > 0
  }
}
