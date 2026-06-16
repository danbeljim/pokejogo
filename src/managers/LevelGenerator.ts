import { PlatformEventType } from '../types'
import { POKEMON_LIST, createTrainerTeam, createWildPokemon } from '../entities/PokemonFactory'
import { Pokemon } from '../entities/Pokemon'
import { GAME_W, GAME_H } from '../main'

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
  [PlatformEventType.WILD_POKEMON, PlatformEventType.MEMORIAL, PlatformEventType.ITEM_PICKUP],                // Piso 1
  [PlatformEventType.WILD_POKEMON, PlatformEventType.ITEM_PICKUP, PlatformEventType.MEMORIAL],                // Piso 2
  [PlatformEventType.WILD_POKEMON, PlatformEventType.ITEM_PICKUP, PlatformEventType.MEMORIAL],               // Piso 3
  [PlatformEventType.TRAINER_BATTLE, PlatformEventType.WILD_POKEMON, PlatformEventType.ITEM_PICKUP],          // Piso 4 (Haunter miniboss)
  [PlatformEventType.BOSS],                                                                                    // Boss (Marowak Fantasma)
]

export default class LevelGenerator {
  private portalGenerated: boolean = false
  private dojoGenerated: boolean = false
  private profesorGenerated: boolean = false
  private berryGenerated: boolean = false
  private currentWildPool?: number[]
  private currentMapId: number = 0
  private itemPickupCount: number = 0
  private captureCount: number = 0
  private doubleBattleGenerated: boolean = false

  generateTower(playerMaxLevel: number, mapAreaX: number = 0, mapAreaW: number = GAME_W): GameMap {
    const nodes: MapNode[] = []
    const mobile = GAME_W < 1000
    const worldWidth = mapAreaW
    const floors = TOWER_FLOOR_POOLS.length
    const minY = Math.round(GAME_H * (mobile ? 0.12 : 0.09))
    const maxY = Math.round(GAME_H * (mobile ? 0.69 : 0.72))
    const rowSpacing = (maxY - minY) / (floors - 1)
    let nextId = 0
    const rowNodes: number[][] = []

    // Entry and boss floors: 1 node. Middle floors: 2-3 nodes (choices)
    const nodesPerFloor = [1, 2, 3, 2, 2, 1]

    for (let f = 0; f < floors; f++) {
      const cols = nodesPerFloor[f]
      const y = maxY - rowSpacing * f
      const rowSlots: number[] = []
      const halfSpan = Math.round(worldWidth * (mobile ? 0.22 : 0.30))
      const colWidth = cols === 1 ? 0 : halfSpan * 2 / (cols - 1)
      const centerX = mapAreaX + worldWidth / 2
      const startX = cols === 1 ? centerX : centerX - halfSpan

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

  generateLevel(platformCount: number, difficulty: number, playerMaxLevel: number = 5, ghostOnly: boolean = false, wildPool?: number[], mapId: number = 0, mapAreaX: number = 0, mapAreaW: number = GAME_W): GameMap {
    this.portalGenerated = false
    this.dojoGenerated = false
    this.profesorGenerated = false
    this.berryGenerated = false
    this.currentWildPool = wildPool
    this.currentMapId = mapId
    this.itemPickupCount = 0
    this.captureCount = 0
    this.doubleBattleGenerated = false

    const W  = mapAreaW
    const mobile   = GAME_W < 1000
    const minY     = Math.round(GAME_H * (mobile ? 0.19 : 0.15))
    const maxY     = Math.round(GAME_H * (mobile ? 0.72 : 0.76))
    const cx       = mapAreaX + mapAreaW / 2
    const halfSpan = W * (mobile ? 0.20 : 0.24)

    // Fixed 9-row diamond: [1, 2, 3, 4, 3, 4, 3, 2, 1]
    // r=0 = START (bottom), r=8 = BOSS (top)
    const ROW_COUNTS = [1, 2, 3, 4, 3, 4, 3, 2, 1]
    const ROWS = ROW_COUNTS.length
    const rowSpacing = (maxY - minY) / (ROWS - 1)

    // X positions: evenly spread within halfSpan, symmetric per row
    const rowXs: number[][] = ROW_COUNTS.map(count => {
      if (count === 1) return [cx]
      return Array.from({ length: count }, (_, c) =>
        cx - halfSpan + (halfSpan * 2 / (count - 1)) * c
      )
    })

    // ── Build nodes ───────────────────────────────────────────────────────────
    const nodes: MapNode[] = []
    const rowNodes: number[][] = []
    let nextId = 0

    for (let r = 0; r < ROWS; r++) {
      const count = ROW_COUNTS[r]
      const y     = maxY - rowSpacing * r
      const slots: number[] = []

      for (let c = 0; c < count; c++) {
        const x         = rowXs[r][c]
        const eventType = this.pickEventForRow(r, ROWS, c, count, difficulty, ghostOnly)
        nodes.push({
          id: nextId++,
          x, y,
          row: r, col: c,
          eventType,
          eventData: (r === 0 && !ghostOnly)
            ? { pokemonId: 25 }
            : this.generateEventData(eventType, difficulty, r, ROWS, playerMaxLevel, ghostOnly),
          connections: [],
          visited: r === 0,
        })
        slots.push(nextId - 1)
      }
      rowNodes.push(slots)
    }

    // ── Connections: adjacency rule, max 2 out / max 2 in, 20% converge ──────
    //
    // proj(i, N, M) = (N===1) ? (M-1)/2 : i*(M-1)/(N-1)
    // canReach(i→j): |proj - j| ≤ 1  →  no skip connections, no crossings
    // Convergence 20%: secondary may reuse an already-targeted dst node

    const inDeg = new Array(nodes.length).fill(0)

    const proj = (i: number, N: number, M: number): number =>
      N === 1 ? (M - 1) / 2 : i * (M - 1) / (N - 1)

    const canReach = (i: number, N: number, j: number, M: number): boolean =>
      Math.abs(proj(i, N, M) - j) <= 1.0001

    const addEdge = (srcId: number, dstId: number) => {
      if (!nodes[srcId].connections.includes(dstId)) {
        nodes[srcId].connections.push(dstId)
        inDeg[dstId]++
      }
    }

    for (let r = 0; r < ROWS - 1; r++) {
      const src = rowNodes[r]
      const dst = rowNodes[r + 1]
      const N   = src.length
      const M   = dst.length

      // Primary: each src → nearest projected dst (always fires)
      for (let i = 0; i < N; i++) {
        addEdge(src[i], dst[Math.round(proj(i, N, M))])
      }

      // Secondary: adjacent only, always fires → forms rhombus shapes
      for (let i = 0; i < N; i++) {
        if (nodes[src[i]].connections.length >= 2) continue
        const p   = proj(i, N, M)
        const pri = Math.round(p)
        const candidates = p >= pri ? [pri + 1, pri - 1] : [pri - 1, pri + 1]
        for (const j of candidates) {
          if (j < 0 || j >= M) continue
          if (!canReach(i, N, j, M)) continue
          if (inDeg[dst[j]] >= 2) continue
          addEdge(src[i], dst[j])
          break
        }
      }

      // Guarantee every dst has ≥1 parent
      for (let j = 0; j < M; j++) {
        if (inDeg[dst[j]] > 0) continue
        const eligible = src.filter(sId =>
          canReach(nodes[sId].col, N, j, M) && nodes[sId].connections.length < 2
        )
        const pool    = eligible.length > 0 ? eligible : src
        const nearest = pool.reduce((best, sId) =>
          Math.abs(proj(nodes[sId].col, N, M) - j) <
          Math.abs(proj(nodes[best].col, N, M) - j) ? sId : best
        )
        addEdge(nearest, dst[j])
      }
    }

    const startNodeId = nodes.find(n => n.row === 0)?.id ?? 0
    const bossNodeId  = nodes.find(n => n.eventType === PlatformEventType.BOSS)?.id ?? nodes.length - 1

    // Guarantee at least 2 capture nodes in mid-map rows
    const SAFE = [PlatformEventType.WILD_POKEMON, PlatformEventType.TRAINER_BATTLE, PlatformEventType.MEMORIAL]
    const midNodes = nodes.filter(n => n.row > 0 && n.row < ROWS - 1 && n.eventType !== PlatformEventType.POKEMON_CAPTURE)
    let needed = 2 - this.captureCount
    for (let i = 0; i < midNodes.length && needed > 0; i++) {
      if (SAFE.includes(midNodes[i].eventType as any)) {
        midNodes[i].eventType = PlatformEventType.POKEMON_CAPTURE
        needed--
      }
    }

    return { nodes, rows: ROWS, startNodeId, bossNodeId }
  }

  private pickEventForRow(r: number, ROWS: number, c: number, count: number, difficulty: number, ghostOnly: boolean): PlatformEventType {
    if (r === 0)        return ghostOnly ? PlatformEventType.POKEMON_CENTER : PlatformEventType.POKEMON_CAPTURE
    if (r === ROWS - 1) return PlatformEventType.BOSS
    if (r === ROWS - 2) return PlatformEventType.TRAINER_BATTLE
    if (r === 4 && count === 3 && c === 1) return this.tryItemPickup()   // guaranteed shop mid-map
    if (r === 6 && count === 3 && c === 1) return PlatformEventType.POKEMON_CENTER // guaranteed rest late-map
    if (ghostOnly) return Math.random() < 0.7 ? PlatformEventType.WILD_POKEMON : this.tryItemPickup()
    const roll = Math.random()
    if (roll < 0.42 + difficulty * 0.05) return this.pickCombat(difficulty)
    if (roll < 0.58)                     return PlatformEventType.WILD_POKEMON
    return this.pickNonCombat()
  }

  private tryItemPickup(): PlatformEventType {
    if (this.itemPickupCount >= 2) return PlatformEventType.WILD_POKEMON
    this.itemPickupCount++
    return PlatformEventType.ITEM_PICKUP
  }

  private tryCapture(): PlatformEventType {
    if (this.captureCount >= 2) return PlatformEventType.WILD_POKEMON
    this.captureCount++
    return PlatformEventType.POKEMON_CAPTURE
  }

  private tryDoubleBattle(difficulty: number): PlatformEventType {
    if (this.currentMapId >= 1 && !this.doubleBattleGenerated) {
      this.doubleBattleGenerated = true
      return PlatformEventType.DOUBLE_BATTLE
    }
    return PlatformEventType.TRAINER_BATTLE
  }

  private pickCombat(difficulty: number): PlatformEventType {
    const r = Math.random()
    if (r < 0.50 + difficulty * 0.06) return this.tryDoubleBattle(difficulty)
    if (r < 0.65 + difficulty * 0.04) return this.currentMapId >= 1 ? PlatformEventType.DOUBLE_BATTLE : PlatformEventType.TRAINER_BATTLE
    return PlatformEventType.WILD_POKEMON
  }

  private pickNonCombat(): PlatformEventType {
    const every3 = this.currentMapId > 0 && this.currentMapId % 3 === 0
    const r = Math.random()
    if (r < 0.22) return this.tryItemPickup()
    if (r < 0.38) {
      if (!this.berryGenerated && every3) { this.berryGenerated = true; return PlatformEventType.BERRY_TREE }
      return this.tryItemPickup()
    }
    if (r < 0.54) {
      if (!this.dojoGenerated && every3) { this.dojoGenerated = true; return PlatformEventType.DOJO }
      return this.tryItemPickup()
    }
    if (r < 0.68) {
      if (!this.profesorGenerated && every3) { this.profesorGenerated = true; return PlatformEventType.PROFESSOR }
      return this.tryItemPickup()
    }
    if (r < 0.80) return this.tryCapture()
    if (r < 0.90) return PlatformEventType.MERCHANT
    if (!this.portalGenerated && this.currentMapId >= 5) { this.portalGenerated = true; return PlatformEventType.PORTAL }
    return this.tryItemPickup()
  }

  private generateEventData(eventType: PlatformEventType, difficulty: number, row: number, rows: number, playerMaxLevel: number, ghostOnly: boolean = false): any {
    // Scaled enemy level: ramps from low (row 1) to playerMaxLevel-1 (last middle row).
    // Always strictly under player's strongest.
    const middleRows = Math.max(1, rows - 2)
    const progress = Math.min(1, row / middleRows) // 0..1
    const floor = Math.max(2, playerMaxLevel - difficulty - 3)
    // Hard cap: rivals always strictly below player's max level
    const ceil = Math.max(floor, playerMaxLevel - 2)
    const scaledLevel = Math.round(floor + (ceil - floor) * progress)

    const buildTrainerTeam = (size: number): Pokemon[] => {
      const pool = ghostOnly
        ? POKEMON_LIST.filter(p => p.type === 'ghost')
        : this.currentWildPool
        ? POKEMON_LIST.filter(p => this.currentWildPool!.includes(p.dexId))
        : POKEMON_LIST
      const filtered = pool.length > 0 ? pool : POKEMON_LIST
      return Array.from({ length: size }, (_, i) => {
        const entry = filtered[Math.floor(Math.random() * filtered.length)]
        return createWildPokemon(Math.max(1, scaledLevel - i), entry.dexId, true)
      })
    }

    switch (eventType) {
      case PlatformEventType.POKEMON_CAPTURE:
        return { pokemonId: undefined }
      case PlatformEventType.TRAINER_BATTLE: {
        const teamSize = Math.min(1 + Math.floor(difficulty / 2), 3)
        return { trainerLevel: scaledLevel, team: buildTrainerTeam(teamSize) }
      }
      case PlatformEventType.DOUBLE_BATTLE: {
        // Two trainers with 1 Pokémon each, both below player level
        return {
          trainerLevel: scaledLevel,
          team:  buildTrainerTeam(1),
          team2: buildTrainerTeam(1),
        }
      }
      case PlatformEventType.WILD_POKEMON: {
        const pool = ghostOnly
          ? POKEMON_LIST.filter(p => p.type === 'ghost')
          : this.currentWildPool
          ? POKEMON_LIST.filter(p => this.currentWildPool!.includes(p.dexId))
          : POKEMON_LIST
        const filtered = pool.length > 0 ? pool : POKEMON_LIST
        const entry = filtered[Math.floor(Math.random() * filtered.length)]
        return { pokemonId: entry.dexId, level: scaledLevel }
      }
      case PlatformEventType.ITEM_PICKUP:
        return { itemId: Math.floor(Math.random() * 5) }
      default:
        return {}
    }
  }
}
