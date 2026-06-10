import { PokemonType } from '../data/Types'

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
  }

  levelUp() {
    this.level++
    this.maxHp += 5
    this.hp = this.maxHp
    this.attack += 3
    this.defense += 2
    this.speed += 2
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
