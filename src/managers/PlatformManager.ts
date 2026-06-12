import Phaser from 'phaser'
import { GameMap, MapNode } from './LevelGenerator'
import { PlatformEventType } from '../types'
import { itemSpriteKey, TRAINER_KEYS, trainerSpriteKey, gymLeaderSpriteKey } from '../data/GameAssets'
import { spriteKey } from '../entities/PokemonFactory'
import { Pokemon } from '../entities/Pokemon'

export default class PlatformManager {
  private scene: Phaser.Scene
  private map?: GameMap
  private nodeGraphics: Map<number, Phaser.GameObjects.Container> = new Map()
  private maskShapes: Phaser.GameObjects.Graphics[] = []
  private linesGraphics?: Phaser.GameObjects.Graphics
  private onNodeClick?: (node: MapNode) => void
  private currentNodeId: number = 0
  private bossSignatureDexId: number = 95
  private bossGymLeaderName: string = 'Brock'
  private tooltip?: Phaser.GameObjects.GameObject

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  setMap(map: GameMap, onNodeClick: (node: MapNode) => void, bossSignatureDexId?: number, bossGymLeaderName?: string) {
    this.map = map
    this.onNodeClick = onNodeClick
    this.currentNodeId = map.startNodeId
    if (bossSignatureDexId) this.bossSignatureDexId = bossSignatureDexId
    if (bossGymLeaderName) this.bossGymLeaderName = bossGymLeaderName
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
        this.drawDashedLine(node.x, node.y, target.x, target.y, 0x888888, 0.6)
      })
    })

    // Draw nodes
    this.map.nodes.forEach(node => this.drawNode(node))
  }


  private redrawNodes() {
    this.hideTrainerTooltip()
    this.nodeGraphics.forEach(c => c.destroy())
    this.nodeGraphics.clear()
    this.maskShapes.forEach(m => m.destroy())
    this.maskShapes = []
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

    // Node circle (background)
    const circle = this.scene.add.graphics()
    const radius = node.eventType === PlatformEventType.BOSS ? 28 : 22
    circle.fillStyle(color, node.visited && !isCurrent ? 0.4 : 1)
    circle.fillCircle(0, 0, radius)
    circle.lineStyle(2, 0x000000, 1)
    circle.strokeCircle(0, 0, radius)
    container.add(circle)

    // Icon: real sprite based on event type
    const iconSprite = this.makeNodeIcon(node)
    if (iconSprite) {
      if (node.visited && !isCurrent) iconSprite.setAlpha(0.5)
      container.add(iconSprite)

      // Circular clip mask so all icons stay inside node circle
      const maskRadius = node.eventType === PlatformEventType.BOSS ? 27 : 21
      const maskShape = this.scene.make.graphics({ x: node.x, y: node.y }, false)
      maskShape.fillStyle(0xffffff)
      maskShape.fillCircle(0, 0, maskRadius)
      const mask = maskShape.createGeometryMask()
      iconSprite.setMask(mask)
      this.maskShapes.push(maskShape)
    } else {
      const icon = this.scene.add.text(0, 0, this.getIconForEventType(node.eventType), {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0.5)
      container.add(icon)
    }

    const isTrainer = node.eventType === PlatformEventType.TRAINER_BATTLE
    if (isClickable || isTrainer) {
      container.setSize(50, 50)
      container.setInteractive({ useHandCursor: isClickable })
      if (isClickable) {
        container.on('pointerdown', () => {
          this.hideTrainerTooltip()
          if (this.onNodeClick) this.onNodeClick(node)
        })
      }
      container.on('pointerover', () => {
        circle.setScale(1.15)
        if (isTrainer) this.showTrainerTooltip(node)
      })
      container.on('pointerout', () => {
        circle.setScale(1.0)
        if (isTrainer) this.hideTrainerTooltip()
      })
    }

    this.nodeGraphics.set(node.id, container)
  }

  private makeNodeIcon(node: MapNode): Phaser.GameObjects.Image | undefined {
    let key: string | undefined
    let scale = 1.5

    switch (node.eventType) {
      case PlatformEventType.POKEMON_CAPTURE:
        key = itemSpriteKey('pokeball')
        scale = 1.8
        break
      case PlatformEventType.ITEM_PICKUP:
        key = itemSpriteKey('potion')
        scale = 1.8
        break
      case PlatformEventType.WILD_POKEMON:
        key = this.scene.textures.exists('tall-grass-tile') ? 'tall-grass-tile' : 'tall-grass'
        scale = 0.5
        break
      case PlatformEventType.TRAINER_BATTLE: {
        const tk = TRAINER_KEYS[node.id % TRAINER_KEYS.length]
        key = trainerSpriteKey(tk)
        scale = 0.9
        break
      }
      case PlatformEventType.BOSS: {
        const gkey = gymLeaderSpriteKey(this.bossGymLeaderName)
        if (this.scene.textures.exists(gkey)) {
          key = gkey
          scale = 1.4
        } else {
          // Fallback to generic rival trainer (NOT pokemon)
          key = trainerSpriteKey('red')
          scale = 1.4
          console.warn('[PlatformManager] gym leader sprite missing:', gkey, 'leader:', this.bossGymLeaderName)
        }
        break
      }
    }

    if (key && this.scene.textures.exists(key)) {
      const img = this.scene.add.image(0, 0, key)
      if (key === 'tall-grass-tile' || key === 'tall-grass') {
        img.setDisplaySize(44, 44)
      } else {
        img.setScale(scale)
      }
      return img
    }
    return undefined
  }

  private drawDashedLine(x1: number, y1: number, x2: number, y2: number, color: number, alpha: number) {
    if (!this.linesGraphics) return
    const dashLen = 10
    const gapLen = 5
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt(dx * dx + dy * dy)

    this.linesGraphics.lineStyle(2, color, alpha)
    let traveled = 0
    while (traveled < dist) {
      const segEnd = Math.min(traveled + dashLen, dist)
      const t1 = traveled / dist
      const t2 = segEnd / dist
      this.linesGraphics.beginPath()
      this.linesGraphics.moveTo(x1 + dx * t1, y1 + dy * t1)
      this.linesGraphics.lineTo(x1 + dx * t2, y1 + dy * t2)
      this.linesGraphics.strokePath()
      traveled += dashLen + gapLen
    }
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

  private showTrainerTooltip(node: MapNode) {
    this.hideTrainerTooltip()
    const team: Pokemon[] = node.eventData?.team || []
    const header = `Entrenador · ${team.length} Pokémon`
    const lines = team.length
      ? team.map(p => `• ${p.name} Nv.${p.level}`)
      : ['(equipo oculto)']
    const txt = this.scene.add.text(0, 0, [header, ...lines].join('\n'), {
      font: '11px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 6, y: 4 }
    })
    txt.setDepth(200)
    const w = txt.width
    const h = txt.height
    let x = node.x + 28
    let y = node.y - h - 24
    if (x + w > 796) x = node.x - w - 28
    if (y < 4) y = node.y + 28
    txt.setPosition(x, y)
    this.tooltip = txt
  }

  private hideTrainerTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy()
      this.tooltip = undefined
    }
  }

  clearMap() {
    this.hideTrainerTooltip()
    this.nodeGraphics.forEach(c => c.destroy())
    this.nodeGraphics.clear()
    this.maskShapes.forEach(m => m.destroy())
    this.maskShapes = []
    if (this.linesGraphics) {
      this.linesGraphics.destroy()
      this.linesGraphics = undefined
    }
  }
}

