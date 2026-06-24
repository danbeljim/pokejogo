import Phaser from 'phaser'
import { CardRunState } from '../../data/CardData'
import { GAME_W, GAME_H } from '../../main'

export type MapNodeType = 'battle' | 'elite' | 'shop' | 'rest' | 'event' | 'boss'

export interface CardMapNode {
  id: number
  floor: number
  col: number
  type: MapNodeType
  x: number
  y: number
  connections: number[]  // ids of nodes on next floor connected to this
  visited: boolean
}

export interface CardMap {
  nodes: CardMapNode[]
  totalFloors: number
}

const NODE_ICONS: Record<MapNodeType, string> = {
  battle: '⚔️', elite: '💀', shop: '🏪', rest: '🏕️', event: '❓', boss: '👑'
}
const NODE_LABELS: Record<MapNodeType, string> = {
  battle: 'Batalla', elite: 'Elite', shop: 'Tienda', rest: 'Descanso', event: 'Evento', boss: 'BOSS'
}
const NODE_COLORS: Record<MapNodeType, number> = {
  battle: 0x3355aa, elite: 0x882222, shop: 0x226622, rest: 0x225566, event: 0x664422, boss: 0xaa4400
}

const ACT_BOSS_FLOORS = [2, 5, 8, 11, 14, 17]

function pickType(floor: number): MapNodeType {
  if (floor === 0) return 'rest'
  if (ACT_BOSS_FLOORS.includes(floor)) return 'boss'
  const r = Math.random()
  const act = Math.floor(floor / 3) + 1
  if (act === 1) return r < 0.70 ? 'battle' : r < 0.85 ? 'event' : 'shop'
  if (act === 2) return r < 0.45 ? 'battle' : r < 0.60 ? 'elite' : r < 0.75 ? 'shop' : r < 0.88 ? 'event' : 'rest'
  const eliteChance = Math.min(0.65, 0.35 + (act - 3) * 0.08)
  return r < eliteChance ? 'elite' : r < eliteChance + 0.20 ? 'battle' : r < eliteChance + 0.35 ? 'shop' : r < eliteChance + 0.50 ? 'event' : 'rest'
}

export function generateCardMap(): CardMap {
  const TOTAL_FLOORS = 18
  // Boss nodes are single (floor 2,5,8,11,14,17); rest have 2-3 options
  const NODES_PER_FLOOR = [2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1]
  const mapW = GAME_W * 0.62
  const mapH = GAME_H * 0.78
  const mapOffX = GAME_W * 0.2
  const mapOffY = GAME_H * 0.1

  const nodes: CardMapNode[] = []
  let nextId = 0
  const floorNodeIds: number[][] = []

  for (let f = 0; f < TOTAL_FLOORS; f++) {
    const count = NODES_PER_FLOOR[f]
    const y = mapOffY + mapH - (f / (TOTAL_FLOORS - 1)) * mapH
    const ids: number[] = []
    for (let c = 0; c < count; c++) {
      const xFrac = count === 1 ? 0.5 : c / (count - 1)
      const x = mapOffX + xFrac * mapW
      nodes.push({ id: nextId, floor: f, col: c, type: pickType(f), x, y, connections: [], visited: false })
      ids.push(nextId++)
    }
    floorNodeIds.push(ids)
  }

  // connect floors: each node connects to 1-2 nodes on the next floor
  for (let f = 0; f < TOTAL_FLOORS - 1; f++) {
    const current = floorNodeIds[f]
    const next = floorNodeIds[f + 1]
    // each current node connects to adjacent next node(s)
    for (const cId of current) {
      const cNode = nodes[cId]
      const cFrac = current.length === 1 ? 0.5 : cNode.col / (current.length - 1)
      // find closest next node
      let bestDist = Infinity, bestId = next[0]
      for (const nId of next) {
        const nNode = nodes[nId]
        const nFrac = next.length === 1 ? 0.5 : nNode.col / (next.length - 1)
        const d = Math.abs(cFrac - nFrac)
        if (d < bestDist) { bestDist = d; bestId = nId }
      }
      if (!cNode.connections.includes(bestId)) cNode.connections.push(bestId)
      // 50% chance second connection to neighbor
      if (next.length > 1 && Math.random() < 0.5) {
        const idx = next.indexOf(bestId)
        const alt = idx > 0 ? next[idx - 1] : next[idx + 1]
        if (alt !== undefined && !cNode.connections.includes(alt)) cNode.connections.push(alt)
      }
    }
    // ensure every next-floor node is reachable
    for (const nId of next) {
      const reachable = current.some(cId => nodes[cId].connections.includes(nId))
      if (!reachable) {
        const cId = current[Math.floor(Math.random() * current.length)]
        nodes[cId].connections.push(nId)
      }
    }
  }

  // mark floor 0 (rest) as visited = false, it's the start
  return { nodes, totalFloors: TOTAL_FLOORS }
}

export default class CardMapScene extends Phaser.Scene {
  private run!: CardRunState
  private cardMap!: CardMap
  private currentFloor!: number
  private currentNodeId!: number | null
  private nodeObjects: Map<number, Phaser.GameObjects.Container> = new Map()

  constructor() { super('CardMapScene') }

  create() {
    this.run = this.registry.get('cardRunState') as CardRunState
    if (!this.run) { this.scene.start('CardMenuScene'); return }

    // reuse or generate map
    let stored = this.registry.get('cardMap') as CardMap | undefined
    if (!stored || this.run.floor === 0) {
      stored = generateCardMap()
      this.registry.set('cardMap', stored)
    }
    this.cardMap = stored
    this.currentFloor = this.run.floor
    this.currentNodeId = this.registry.get('cardCurrentNode') as number | null ?? null

    const act = Math.floor(this.currentFloor / 3) + 1
    const actBgColors = ['#080818', '#0a1808', '#180808']
    const actStarColors = [0xffffff, 0xaaffaa, 0xffaaaa]
    this.cameras.main.setBackgroundColor(actBgColors[act - 1] ?? '#080818')

    // stars
    const starColor = actStarColors[act - 1] ?? 0xffffff
    for (let i = 0; i < 60; i++) {
      this.add.circle(Math.random() * GAME_W, Math.random() * GAME_H, Math.random() * 1.5 + 0.5, starColor, Math.random() * 0.5 + 0.2)
    }

    this.drawMap()
    this.drawHUD()
  }

  private drawMap() {
    const nodes = this.cardMap.nodes
    // draw connections first
    const lineG = this.add.graphics()
    lineG.lineStyle(2, 0x334466, 0.6)
    for (const node of nodes) {
      for (const targetId of node.connections) {
        const target = nodes[targetId]
        lineG.strokeLineShape(new Phaser.Geom.Line(node.x, node.y, target.x, target.y))
      }
    }

    // draw nodes
    for (const node of nodes) {
      const container = this.createNodeContainer(node)
      this.nodeObjects.set(node.id, container)
    }
  }

  private createNodeContainer(node: CardMapNode): Phaser.GameObjects.Container {
    const container = this.add.container(node.x, node.y)
    const isCurrentFloor = node.floor === this.currentFloor
    const isVisited = node.visited
    const isReachable = this.isReachable(node)
    const isCurrent = node.id === this.currentNodeId

    const radius = node.type === 'boss' ? 38 : 28
    const baseColor = NODE_COLORS[node.type]
    const alpha = isVisited ? 0.35 : (isReachable ? 1 : 0.4)

    const g = this.add.graphics()
    g.fillStyle(baseColor, alpha)
    g.fillCircle(0, 0, radius)
    g.lineStyle(isCurrent ? 4 : 2, isCurrent ? 0xFFD700 : (isReachable ? 0xffffff : 0x444466), isReachable ? 1 : 0.5)
    g.strokeCircle(0, 0, radius)

    if (isCurrent) {
      const pulse = this.add.graphics()
      pulse.lineStyle(3, 0xFFD700, 0.6)
      pulse.strokeCircle(0, 0, radius + 8)
      container.add(pulse)
      this.tweens.add({ targets: pulse, alpha: { from: 0.6, to: 0 }, duration: 1200, repeat: -1 })
    }

    container.add(g)

    const icon = this.add.text(0, -6, NODE_ICONS[node.type], {
      fontSize: `${node.type === 'boss' ? 22 : 16}px`
    }).setOrigin(0.5)
    container.add(icon)

    const label = this.add.text(0, radius + 12, NODE_LABELS[node.type], {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: isReachable ? '#ffffff' : '#555577'
    }).setOrigin(0.5)
    container.add(label)

    if (isReachable && !isVisited) {
      const hitArea = this.add.circle(0, 0, radius + 4, 0xffffff, 0).setInteractive({ useHandCursor: true })
      container.add(hitArea)
      hitArea.on('pointerover', () => { g.clear(); g.fillStyle(baseColor, 1); g.fillCircle(0, 0, radius * 1.1); g.lineStyle(3, 0xFFD700); g.strokeCircle(0, 0, radius * 1.1) })
      hitArea.on('pointerout',  () => { g.clear(); g.fillStyle(baseColor, alpha); g.fillCircle(0, 0, radius); g.lineStyle(isCurrent ? 4 : 2, 0xffffff); g.strokeCircle(0, 0, radius) })
      hitArea.on('pointerdown', () => this.selectNode(node))
    }

    return container
  }

  private isReachable(node: CardMapNode): boolean {
    if (this.currentNodeId === null) return node.floor === 0
    if (node.floor !== this.currentFloor + 1) return false
    const currentNode = this.cardMap.nodes.find(n => n.id === this.currentNodeId)
    if (!currentNode) return false
    return currentNode.connections.includes(node.id)
  }

  private selectNode(node: CardMapNode) {
    node.visited = true
    this.registry.set('cardCurrentNode', node.id)
    this.run.floor = node.floor
    this.registry.set('cardRunState', this.run)
    this.registry.set('cardMapNodeType', node.type)

    switch (node.type) {
      case 'battle':
      case 'elite':
        this.registry.set('cardBattleIsElite', node.type === 'elite')
        this.registry.set('cardBattleIsBoss', false)
        this.scene.start('CardBattleScene')
        break
      case 'boss':
        this.registry.set('cardBattleIsElite', false)
        this.registry.set('cardBattleIsBoss', true)
        this.scene.start('CardBattleScene')
        break
      case 'shop':
        this.scene.start('CardShopScene')
        break
      case 'rest':
        this.scene.start('CardRestScene')
        break
      case 'event':
        this.scene.start('CardEventScene')
        break
    }
  }

  private drawHUD() {
    const W = GAME_W, H = GAME_H
    // left panel
    const g = this.add.graphics()
    g.fillStyle(0x0a0a1a, 0.88)
    g.fillRect(0, 0, W * 0.17, H)

    const fs = Math.round(H * 0.018)
    const cx = W * 0.085

    const act = Math.floor(this.currentFloor / 3) + 1
    const actColors = ['#88aaff', '#88ffaa', '#ffaa88']
    const actColor = actColors[act - 1] ?? '#ffffff'
    this.add.text(cx, H * 0.04, `ACTO ${act}`, { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.7)}px`, color: actColor }).setOrigin(0.5)
    this.add.text(cx, H * 0.08, 'PISO', { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.8)}px`, color: '#888888' }).setOrigin(0.5)
    this.add.text(cx, H * 0.13, `${this.currentFloor + 1}/9`, { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 1.3)}px`, color: '#FFD700' }).setOrigin(0.5)

    this.add.text(cx, H * 0.22, '❤️ PS', { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.75)}px`, color: '#888' }).setOrigin(0.5)
    this.add.text(cx, H * 0.27, `${this.run.playerHp}/${this.run.playerMaxHp}`, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.9)}px`,
      color: this.run.playerHp < this.run.playerMaxHp * 0.3 ? '#FF4444' : '#FF8888'
    }).setOrigin(0.5)

    // HP bar
    const barW = W * 0.12, barH = 10
    const barX = cx - barW / 2
    const barY = H * 0.31
    const g2 = this.add.graphics()
    g2.fillStyle(0x440000).fillRect(barX, barY, barW, barH)
    g2.fillStyle(0xdd2222).fillRect(barX, barY, barW * (this.run.playerHp / this.run.playerMaxHp), barH)

    this.add.text(cx, H * 0.38, '💰 ORO', { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.75)}px`, color: '#888' }).setOrigin(0.5)
    this.add.text(cx, H * 0.43, `${this.run.gold}`, { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.9)}px`, color: '#FFD700' }).setOrigin(0.5)

    this.add.text(cx, H * 0.53, '🃏 MAZO', { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.75)}px`, color: '#888' }).setOrigin(0.5)
    this.add.text(cx, H * 0.58, `${this.run.deck.length}`, { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.9)}px`, color: '#aaddff' }).setOrigin(0.5)

    // legend
    const legendY = H * 0.68
    this.add.text(cx, legendY, 'LEYENDA', { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.65)}px`, color: '#555588' }).setOrigin(0.5)
    const types = (['battle', 'elite', 'shop', 'rest', 'event', 'boss'] as MapNodeType[])
    types.forEach((t, i) => {
      const ly = legendY + 22 + i * 28
      const g3 = this.add.graphics()
      g3.fillStyle(NODE_COLORS[t], 0.9)
      g3.fillCircle(W * 0.045, ly, 8)
      this.add.text(W * 0.07, ly, `${NODE_ICONS[t]} ${NODE_LABELS[t]}`, {
        fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.6)}px`, color: '#aaaacc'
      }).setOrigin(0, 0.5)
    })

    // back button
    const btnBack = this.add.text(cx, H * 0.96, '< SALIR', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.7)}px`, color: '#666666',
      backgroundColor: '#0a0a1a', padding: { x: 10, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btnBack.on('pointerover', () => btnBack.setColor('#ff4444'))
    btnBack.on('pointerout',  () => btnBack.setColor('#666666'))
    btnBack.on('pointerdown', () => {
      this.registry.remove('cardMap')
      this.registry.remove('cardCurrentNode')
      this.scene.start('CardMenuScene')
    })
  }
}
