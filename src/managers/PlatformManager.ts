import Phaser from 'phaser'
import { GameMap, MapNode } from './LevelGenerator'
import { PlatformEventType } from '../types'

export default class PlatformManager {
  private scene: Phaser.Scene
  private map?: GameMap
  private nodeGraphics: Map<number, Phaser.GameObjects.Container> = new Map()
  private linesGraphics?: Phaser.GameObjects.Graphics
  private onNodeClick?: (node: MapNode) => void
  private currentNodeId: number = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  setMap(map: GameMap, onNodeClick: (node: MapNode) => void) {
    this.map = map
    this.onNodeClick = onNodeClick
    this.currentNodeId = map.startNodeId
    this.draw()
  }

  setCurrentNode(nodeId: number) {
    this.currentNodeId = nodeId
    if (this.map) {
      this.map.nodes[nodeId].visited = true
    }
    this.redrawNodes()
  }

  getCurrentNode(): MapNode | undefined {
    return this.map?.nodes[this.currentNodeId]
  }

  getMap(): GameMap | undefined {
    return this.map
  }

  private draw() {
    if (!this.map) return

    // Draw lines first (behind nodes)
    this.linesGraphics = this.scene.add.graphics()
    this.linesGraphics.setDepth(1)

    this.map.nodes.forEach(node => {
      node.connections.forEach(targetId => {
        const target = this.map!.nodes[targetId]
        this.linesGraphics!.lineStyle(2, 0x888888, 0.6)
        this.linesGraphics!.beginPath()
        this.linesGraphics!.moveTo(node.x, node.y)
        this.linesGraphics!.lineTo(target.x, target.y)
        this.linesGraphics!.strokePath()
      })
    })

    // Draw nodes
    this.map.nodes.forEach(node => this.drawNode(node))
  }

  private redrawNodes() {
    this.nodeGraphics.forEach(c => c.destroy())
    this.nodeGraphics.clear()
    if (!this.map) return
    this.map.nodes.forEach(node => this.drawNode(node))
  }

  private drawNode(node: MapNode) {
    if (!this.map) return

    const isCurrent = node.id === this.currentNodeId
    const isClickable = this.isClickable(node)
    const color = this.getColorForEventType(node.eventType)

    const container = this.scene.add.container(node.x, node.y)
    container.setDepth(2)

    // Outer ring (for current/clickable highlight)
    if (isCurrent) {
      const ring = this.scene.add.graphics()
      ring.lineStyle(4, 0xFFFFFF, 1)
      ring.strokeCircle(0, 0, 26)
      container.add(ring)
    } else if (isClickable) {
      const ring = this.scene.add.graphics()
      ring.lineStyle(3, 0xFFFF00, 1)
      ring.strokeCircle(0, 0, 24)
      container.add(ring)
    }

    // Node circle
    const circle = this.scene.add.graphics()
    circle.fillStyle(color, node.visited && !isCurrent ? 0.4 : 1)
    circle.fillCircle(0, 0, 20)
    circle.lineStyle(2, 0x000000, 1)
    circle.strokeCircle(0, 0, 20)
    container.add(circle)

    // Icon (text symbol)
    const icon = this.scene.add.text(0, 0, this.getIconForEventType(node.eventType), {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5)
    container.add(icon)

    if (isClickable) {
      container.setSize(50, 50)
      container.setInteractive({ useHandCursor: true })
      container.on('pointerdown', () => {
        if (this.onNodeClick) this.onNodeClick(node)
      })
      container.on('pointerover', () => circle.setScale(1.15))
      container.on('pointerout', () => circle.setScale(1.0))
    }

    this.nodeGraphics.set(node.id, container)
  }

  private isClickable(node: MapNode): boolean {
    if (!this.map) return false
    const current = this.map.nodes[this.currentNodeId]
    return current.connections.includes(node.id)
  }

  private getColorForEventType(t: PlatformEventType): number {
    switch (t) {
      case PlatformEventType.POKEMON_CAPTURE: return 0x4CAF50
      case PlatformEventType.TRAINER_BATTLE: return 0xFF5722
      case PlatformEventType.WILD_POKEMON: return 0xFF9800
      case PlatformEventType.ITEM_PICKUP: return 0x2196F3
      case PlatformEventType.BOSS: return 0xFFD700
      default: return 0x808080
    }
  }

  private getIconForEventType(t: PlatformEventType): string {
    switch (t) {
      case PlatformEventType.POKEMON_CAPTURE: return 'C'
      case PlatformEventType.TRAINER_BATTLE: return 'T'
      case PlatformEventType.WILD_POKEMON: return 'W'
      case PlatformEventType.ITEM_PICKUP: return 'I'
      case PlatformEventType.BOSS: return 'B'
      default: return '?'
    }
  }

  clearMap() {
    this.nodeGraphics.forEach(c => c.destroy())
    this.nodeGraphics.clear()
    if (this.linesGraphics) {
      this.linesGraphics.destroy()
      this.linesGraphics = undefined
    }
  }
}
