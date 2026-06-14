import { PokemonType } from '../data/Types'
import { EVOLUTIONS } from '../data/Evolution'
import { LEARNSET } from '../data/Learnset'

export interface LevelUpEvent {
  learnedMoves: string[]
  evolvedFrom?: string
  evolvedTo?: string
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
  }

  levelUp(): LevelUpEvent {
    this.level++
    this.maxHp += 5
    this.hp = Math.min(this.hp + 5, this.maxHp)
    this.attack += 3
    this.defense += 2
    this.speed += 2

    const event: LevelUpEvent = { learnedMoves: [] }

    // Learn moves
    const learns = LEARNSET[this.id] || []
    for (const entry of learns) {
      if (entry.level === this.level && !this.moves.includes(entry.move) && this.moves.length < 4) {
        this.moves.push(entry.move)
        event.learnedMoves.push(entry.move)
      }
    }

    // Evolve
    const evo = EVOLUTIONS[this.id]
    if (evo && this.level >= evo.level) {
      event.evolvedFrom = this.name
      event.evolvedTo = evo.toName
      this.id = evo.toDexId
      this.name = evo.toName
      this.type = evo.toType
      // Stat boost on evolve
      this.maxHp += 10
      this.hp = this.maxHp
      this.attack += 5
      this.defense += 4
      this.speed += 3
    }

    return event
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
