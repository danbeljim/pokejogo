import { PlatformEventType } from '../types'
import { createTrainerTeam } from '../entities/PokemonFactory'
import { Pokemon } from '../entities/Pokemon'

export interface MapNode {
  id: number
  x: number
  y: number
  row: number
  col: number
  eventType: PlatformEventType
  eventData?: any
  connections: number[]
  visited: boolean
}

export interface GameMap {
  nodes: MapNode[]
  rows: number
  startNodeId: number
  bossNodeId: number
}

export default class LevelGenerator {
  generateLevel(platformCount: number, difficulty: number, playerMaxLevel: number = 5): GameMap {
    const nodes: MapNode[] = []
    const worldWidth = 800
    const worldHeight = 540
    const topMargin = 60
    const rows = 5
    const rowSpacing = (worldHeight - topMargin) / (rows - 1)

    let nextId = 0
    const rowNodes: number[][] = []
    const nodesPerRow = [1, 3, 3, 3, 1]

    // Position nodes in diamond grid
    for (let r = 0; r < rows; r++) {
      const cols = nodesPerRow[r]
      const y = topMargin + rowSpacing * r
      const rowSlots: number[] = []
      const colWidth = cols > 1 ? (worldWidth - 100) / (cols - 1) : 0

      for (let c = 0; c < cols; c++) {
        const x = cols === 1 ? worldWidth / 2 : 100 + colWidth * c
        const eventType = r === 0 ? PlatformEventType.POKEMON_CAPTURE :
                          r === rows - 1 ? PlatformEventType.BOSS :
                          this.getRandomEvent(difficulty)
        const node: MapNode = {
          id: nextId++,
          x,
          y,
          row: r,
          col: c,
          eventType,
          eventData: r === 0 ? { pokemonId: 25 } : this.generateEventData(eventType, difficulty, r, rows, playerMaxLevel),
          connections: [],
          visited: r === 0
        }
        nodes.push(node)
        rowSlots.push(node.id)
      }
      rowNodes.push(rowSlots)
    }

    const startNodeId = nodes.find(n => n.eventType === PlatformEventType.POKEMON_CAPTURE)?.id || 0
    const bossNodeId = nodes.find(n => n.eventType === PlatformEventType.BOSS)?.id || nodes.length - 1

    // Connect nodes: each node connects to nearby nodes (distance-based)
    const connectionDistance = 200
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i]
        const n2 = nodes[j]
        const dist = Math.sqrt((n1.x - n2.x) ** 2 + (n1.y - n2.y) ** 2)
        // Connect if close enough and n2 is below n1 (forward direction)
        if (dist <= connectionDistance && n2.row > n1.row) {
          n1.connections.push(n2.id)
        }
      }
    }

    return {
      nodes,
      rows,
      startNodeId,
      bossNodeId
    }
  }

  private getRandomEvent(difficulty: number): PlatformEventType {
    const rand = Math.random()
    if (rand < 0.2 + difficulty * 0.05) return PlatformEventType.TRAINER_BATTLE
    if (rand < 0.45 + difficulty * 0.05) return PlatformEventType.WILD_POKEMON
    if (rand < 0.75) return PlatformEventType.POKEMON_CAPTURE
    return PlatformEventType.ITEM_PICKUP
  }

  private generateEventData(eventType: PlatformEventType, difficulty: number, row: number, rows: number, playerMaxLevel: number): any {
    // Scaled enemy level: ramps from low (row 1) to playerMaxLevel-1 (last middle row).
    // Always strictly under player's strongest.
    const middleRows = Math.max(1, rows - 2)
    const progress = Math.min(1, row / middleRows) // 0..1
    const floor = Math.max(2, playerMaxLevel - difficulty - 2)
    const ceil = Math.max(floor, playerMaxLevel - 1)
    const scaledLevel = Math.round(floor + (ceil - floor) * progress)
    switch (eventType) {
      case PlatformEventType.POKEMON_CAPTURE:
        return { pokemonId: undefined }
      case PlatformEventType.TRAINER_BATTLE: {
        const team: Pokemon[] = createTrainerTeam(difficulty, scaledLevel)
        return { trainerLevel: scaledLevel, team }
      }
      case PlatformEventType.WILD_POKEMON:
        return { pokemonId: undefined, level: scaledLevel }
      case PlatformEventType.ITEM_PICKUP:
        return { itemId: Math.floor(Math.random() * 5) }
      default:
        return {}
    }
  }
}
