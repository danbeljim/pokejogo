import { PlatformEventType } from '../types'
import { POKEMON_LIST, createTrainerTeam, createWildPokemon } from '../entities/PokemonFactory'
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

// Tower floor event pools per floor index (0=entry, last=boss)
const TOWER_FLOOR_POOLS: PlatformEventType[][] = [
  [PlatformEventType.POKEMON_CENTER],                                                                          // Entry (Pueblo Lavanda)
  [PlatformEventType.WILD_POKEMON, PlatformEventType.MEMORIAL, PlatformEventType.NARRATIVE],                  // Piso 1
  [PlatformEventType.WILD_POKEMON, PlatformEventType.ITEM_PICKUP, PlatformEventType.MEMORIAL],                // Piso 2
  [PlatformEventType.WILD_POKEMON, PlatformEventType.NARRATIVE, PlatformEventType.ITEM_PICKUP],               // Piso 3
  [PlatformEventType.TRAINER_BATTLE, PlatformEventType.WILD_POKEMON, PlatformEventType.ITEM_PICKUP],          // Piso 4 (Haunter miniboss)
  [PlatformEventType.BOSS],                                                                                    // Boss (Marowak Fantasma)
]

export default class LevelGenerator {
  generateTower(playerMaxLevel: number): GameMap {
    const nodes: MapNode[] = []
    const worldWidth = 1600
    const floors = TOWER_FLOOR_POOLS.length
    const minY = 170
    const maxY = 870
    const rowSpacing = (maxY - minY) / (floors - 1)
    let nextId = 0
    const rowNodes: number[][] = []

    // Entry and boss floors: 1 node. Middle floors: 2-3 nodes (choices)
    const nodesPerFloor = [1, 2, 3, 2, 2, 1]

    for (let f = 0; f < floors; f++) {
      const cols = nodesPerFloor[f]
      const y = maxY - rowSpacing * f
      const rowSlots: number[] = []
      const colWidth = cols === 1 ? 0 : 400 / (cols - 1)
      const startX = cols === 1 ? worldWidth / 2 : worldWidth / 2 - 200

      for (let c = 0; c < cols; c++) {
        const x = cols === 1 ? startX : startX + colWidth * c
        const pool = TOWER_FLOOR_POOLS[f]
        const eventType = pool[c % pool.length]
        const level = Math.round(22 + (f / (floors - 1)) * 8)
        const node: MapNode = {
          id: nextId++,
          x,
          y,
          row: f,
          col: c,
          eventType,
          eventData: this.generateTowerEventData(eventType, level, f),
          connections: [],
          visited: f === 0
        }
        nodes.push(node)
        rowSlots.push(node.id)
      }
      rowNodes.push(rowSlots)
    }

    // Connect floors
    for (let f = 0; f < floors - 1; f++) {
      const current = rowNodes[f]
      const next = rowNodes[f + 1]
      current.forEach(nodeId => {
        const node = nodes[nodeId]
        const sorted = next
          .map(id => ({ id, dist: Math.abs(nodes[id].x - node.x) }))
          .sort((a, b) => a.dist - b.dist)
        node.connections.push(...sorted.slice(0, Math.min(2, sorted.length)).map(s => s.id))
      })
      next.forEach(nextId => {
        if (!current.some(cId => nodes[cId].connections.includes(nextId))) {
          const closest = current.sort((a, b) =>
            Math.abs(nodes[a].x - nodes[nextId].x) - Math.abs(nodes[b].x - nodes[nextId].x)
          )[0]
          nodes[closest].connections.push(nextId)
        }
      })
    }

    const startNodeId = nodes.find(n => n.row === 0)?.id ?? 0
    const bossNodeId = nodes.find(n => n.eventType === PlatformEventType.BOSS)?.id ?? nodes.length - 1
    return { nodes, rows: floors, startNodeId, bossNodeId }
  }

  private generateTowerEventData(eventType: PlatformEventType, level: number, floor: number): any {
    const GHOST_IDS = [92, 92, 93, 93, 94]
    switch (eventType) {
      case PlatformEventType.WILD_POKEMON: {
        const ghostId = GHOST_IDS[Math.min(floor, GHOST_IDS.length - 1)]
        return { pokemonId: ghostId, level }
      }
      case PlatformEventType.TRAINER_BATTLE: {
        const team: Pokemon[] = [
          createWildPokemon(Math.max(1, level - 2), 93, true),
          createWildPokemon(level, 93, true),
        ]
        return { team }
      }
      case PlatformEventType.MEMORIAL:
        return { healPercent: 0.4 }
      default:
        return {}
    }
  }

  generateLevel(platformCount: number, difficulty: number, playerMaxLevel: number = 5, ghostOnly: boolean = false): GameMap {
    const nodes: MapNode[] = []
    const worldWidth = 1600
    const rows = 9
    const minY = 170   // below HUD
    const maxY = 870   // above bottom buttons
    const rowSpacing = (maxY - minY) / (rows - 1)

    let nextId = 0
    const rowNodes: number[][] = []
    const nodesPerRow = [1, 2, 3, 4, 5, 4, 5, 2, 1]

    // Position nodes in centered diamond grid
    for (let r = 0; r < rows; r++) {
      const cols = nodesPerRow[r]
      const y = maxY - rowSpacing * r
      const rowSlots: number[] = []

      // Center the row based on number of columns
      let colWidth = 0
      let startX = 0
      if (cols === 1) {
        startX = worldWidth / 2
      } else {
        colWidth = 500 / (cols - 1)
        startX = worldWidth / 2 - 250
      }

      for (let c = 0; c < cols; c++) {
        const x = cols === 1 ? startX : startX + colWidth * c
        const centerCol = Math.floor(nodesPerRow[r] / 2)
        const eventType = r === rows - 1 ? PlatformEventType.BOSS :
                          r === 0 ? (ghostOnly ? PlatformEventType.POKEMON_CENTER : PlatformEventType.POKEMON_CAPTURE) :
                          r === rows - 2 && c === centerCol ? PlatformEventType.POKEMON_CENTER :
                          ghostOnly ? this.getGhostEvent() :
                          this.getRandomEvent(difficulty)
        const node: MapNode = {
          id: nextId++,
          x,
          y,
          row: r,
          col: c,
          eventType,
          eventData: (r === 0 && !ghostOnly) ? { pokemonId: 25 } : this.generateEventData(eventType, difficulty, r, rows, playerMaxLevel, ghostOnly),
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

    // Build connections: monotonic (no crossing), 1 connection per node max
    // unless needed to cover uncovered targets
    for (let r = 0; r < rows - 1; r++) {
      const cur = rowNodes[r].map(id => ({ id, x: nodes[id].x })).sort((a, b) => a.x - b.x)
      const nxt = rowNodes[r + 1].map(id => ({ id, x: nodes[id].x })).sort((a, b) => a.x - b.x)

      const midNxt = Math.floor(nxt.length / 2)

      // Monotonic primary connection
      cur.forEach((src, si) => {
        const ti = Math.round((si / Math.max(cur.length - 1, 1)) * (nxt.length - 1))
        nodes[src.id].connections.push(nxt[ti].id)
      })

      // Leftmost and rightmost nodes get an extra connection toward the middle
      if (cur.length >= 2 && nxt.length >= 3) {
        const leftSrc = cur[0]
        const rightSrc = cur[cur.length - 1]
        const midTarget = nxt[midNxt]
        if (!nodes[leftSrc.id].connections.includes(midTarget.id))
          nodes[leftSrc.id].connections.push(midTarget.id)
        if (!nodes[rightSrc.id].connections.includes(midTarget.id))
          nodes[rightSrc.id].connections.push(midTarget.id)
      }

      // Cover any uncovered targets by linking to nearest source
      nxt.forEach(tgt => {
        const covered = cur.some(src => nodes[src.id].connections.includes(tgt.id))
        if (!covered) {
          const nearest = [...cur].sort((a, b) => Math.abs(a.x - tgt.x) - Math.abs(b.x - tgt.x))[0]
          nodes[nearest.id].connections.push(tgt.id)
        }
      })
    }

    return {
      nodes,
      rows,
      startNodeId,
      bossNodeId
    }
  }

  private getGhostEvent(): PlatformEventType {
    const rand = Math.random()
    if (rand < 0.50) return PlatformEventType.WILD_POKEMON
    if (rand < 0.75) return PlatformEventType.POKEMON_CAPTURE
    return PlatformEventType.ITEM_PICKUP
  }

  private getRandomEvent(difficulty: number): PlatformEventType {
    const rand = Math.random()
    if (rand < 0.30 + difficulty * 0.05) return PlatformEventType.TRAINER_BATTLE
    if (rand < 0.60 + difficulty * 0.05) return PlatformEventType.WILD_POKEMON
    if (rand < 0.75) return PlatformEventType.POKEMON_CAPTURE
    if (rand < 0.88) return PlatformEventType.ITEM_PICKUP
    return PlatformEventType.RANDOM
  }

  private generateEventData(eventType: PlatformEventType, difficulty: number, row: number, rows: number, playerMaxLevel: number, ghostOnly: boolean = false): any {
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
      case PlatformEventType.WILD_POKEMON: {
        const pool = ghostOnly
          ? POKEMON_LIST.filter(p => p.type === 'ghost')
          : POKEMON_LIST
        const entry = pool[Math.floor(Math.random() * pool.length)]
        return { pokemonId: entry.dexId, level: scaledLevel }
      }
      case PlatformEventType.ITEM_PICKUP:
        return { itemId: Math.floor(Math.random() * 5) }
      default:
        return {}
    }
  }
}
