import { PlatformEventType } from '../types'

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
  generateLevel(platformCount: number, difficulty: number): GameMap {
    const rows = Math.max(6, Math.min(10, platformCount))
    const nodes: MapNode[] = []
    const worldWidth = 800
    const worldHeight = 540
    const topMargin = 60
    const rowSpacing = (worldHeight - topMargin) / (rows + 1)

    let nextId = 0
    const rowNodes: number[][] = []

    // Row 0: single start node
    const startNode: MapNode = {
      id: nextId++,
      x: worldWidth / 2,
      y: worldHeight - rowSpacing * 0.5,
      row: 0,
      col: 0,
      eventType: PlatformEventType.POKEMON_CAPTURE,
      eventData: { pokemonId: 25 },
      connections: [],
      visited: true
    }
    nodes.push(startNode)
    rowNodes.push([startNode.id])

    // Middle rows: 2-3 nodes each
    for (let r = 1; r < rows - 1; r++) {
      const cols = 2 + Math.floor(Math.random() * 2)
      const y = worldHeight - rowSpacing * (r + 0.5)
      const rowSlots: number[] = []
      const colWidth = (worldWidth - 100) / cols

      for (let c = 0; c < cols; c++) {
        const eventType = this.getRandomEvent(difficulty)
        const node: MapNode = {
          id: nextId++,
          x: 50 + colWidth * (c + 0.5) + (Math.random() * 40 - 20),
          y: y + (Math.random() * 20 - 10),
          row: r,
          col: c,
          eventType,
          eventData: this.generateEventData(eventType),
          connections: [],
          visited: false
        }
        nodes.push(node)
        rowSlots.push(node.id)
      }
      rowNodes.push(rowSlots)
    }

    // Boss row
    const bossNode: MapNode = {
      id: nextId++,
      x: worldWidth / 2,
      y: topMargin,
      row: rows - 1,
      col: 0,
      eventType: PlatformEventType.BOSS,
      connections: [],
      visited: false
    }
    nodes.push(bossNode)
    rowNodes.push([bossNode.id])

    // Build connections: each node connects to 1-2 nodes in next row
    for (let r = 0; r < rows - 1; r++) {
      const current = rowNodes[r]
      const next = rowNodes[r + 1]

      current.forEach(nodeId => {
        const node = nodes[nodeId]
        // Find nearest 1-2 nodes in next row
        const sorted = next
          .map(id => ({ id, dist: Math.abs(nodes[id].x - node.x) }))
          .sort((a, b) => a.dist - b.dist)
        const numConn = 1 + (Math.random() < 0.5 ? 1 : 0)
        for (let i = 0; i < Math.min(numConn, sorted.length); i++) {
          node.connections.push(sorted[i].id)
        }
      })

      // Ensure every next-row node has at least one incoming connection
      next.forEach(nextId => {
        const hasIncoming = current.some(cId => nodes[cId].connections.includes(nextId))
        if (!hasIncoming) {
          // Connect from closest current-row node
          const closest = current
            .map(id => ({ id, dist: Math.abs(nodes[id].x - nodes[nextId].x) }))
            .sort((a, b) => a.dist - b.dist)[0]
          nodes[closest.id].connections.push(nextId)
        }
      })
    }

    return {
      nodes,
      rows,
      startNodeId: startNode.id,
      bossNodeId: bossNode.id
    }
  }

  private getRandomEvent(difficulty: number): PlatformEventType {
    const rand = Math.random()
    if (rand < 0.2 + difficulty * 0.05) return PlatformEventType.TRAINER_BATTLE
    if (rand < 0.45 + difficulty * 0.05) return PlatformEventType.WILD_POKEMON
    if (rand < 0.75) return PlatformEventType.POKEMON_CAPTURE
    return PlatformEventType.ITEM_PICKUP
  }

  private generateEventData(eventType: PlatformEventType): any {
    switch (eventType) {
      case PlatformEventType.POKEMON_CAPTURE:
        return { pokemonId: undefined }
      case PlatformEventType.TRAINER_BATTLE:
        return { trainerLevel: Math.floor(Math.random() * 10) + 5 }
      case PlatformEventType.WILD_POKEMON:
        return { pokemonId: undefined, level: Math.floor(Math.random() * 5) + 1 }
      case PlatformEventType.ITEM_PICKUP:
        return { itemId: Math.floor(Math.random() * 5) }
      default:
        return {}
    }
  }
}
