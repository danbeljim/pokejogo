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

    const NODE_ASSETS: [string, string][] = [
      ['makuhita-icon',   '/assets/random/Makuhita_icono_HOME.png'],
      ['cientifico-icon', '/assets/random/cientifico.png'],
      ['baya-icon',       '/assets/random/baya.png'],
      ['gemelas-icon',    '/assets/random/gemelas.png'],
    ]
    const missing = NODE_ASSETS.filter(([k]) => !this.scene.textures.exists(k))
    if (missing.length > 0) {
      missing.forEach(([k, url]) => this.scene.load.image(k, url))
      this.scene.load.once('complete', () => this.draw())
      this.scene.load.once('loaderror', () => this.draw())
      this.scene.load.start()
    } else {
      this.draw()
    }
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

    this.linesGraphics = this.scene.add.graphics()
    this.linesGraphics.setDepth(1)

    this.map.nodes.forEach(node => {
      if (node.connections.length === 0) return
      const targets = node.connections.map(id => this.map!.nodes[id])

      targets.forEach(target => {
        this.drawDashedLine(node.x, node.y, target.x, target.y, 0x888888, 0.6)
      })
    })

    this.map.nodes.forEach(node => this.drawNode(node))
  }


  private redrawNodes() {
    this.hideNodeTooltip()
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
    const visited = node.visited && !isCurrent
    const color = this.getColorForEventType(node.eventType)
    const mobile = this.scene.scale.width < 1000
    const radius = node.eventType === PlatformEventType.BOSS
      ? (mobile ? 22 : 48)
      : (mobile ? 16 : 38)

    const container = this.scene.add.container(node.x, node.y)
    container.setDepth(2)

    // Outer ring for current / clickable
    if (isCurrent) {
      const ring = this.scene.add.graphics()
      ring.lineStyle(4, 0xFFFFFF, 1)
      ring.strokeCircle(0, 0, radius + 6)
      container.add(ring)
    } else if (isClickable) {
      const ring = this.scene.add.graphics()
      ring.lineStyle(3, 0xFFFF00, 1)
      ring.strokeCircle(0, 0, radius + 5)
      container.add(ring)
    }

    // Circle background
    const circle = this.scene.add.graphics()
    circle.fillStyle(color, visited ? 0.4 : 1)
    circle.fillCircle(0, 0, radius)
    circle.lineStyle(2, 0x000000, 1)
    circle.strokeCircle(0, 0, radius)
    container.add(circle)

    // Sprite inside circle with mask
    const iconSprite = this.makeNodeIcon(node)
    if (iconSprite) {
      const spriteSize = radius * 2 - 6
      iconSprite.setDisplaySize(spriteSize, spriteSize)
      if (visited) iconSprite.setAlpha(0.5)
      container.add(iconSprite)

      const maskShape = this.scene.make.graphics({ x: node.x, y: node.y }, false)
      maskShape.fillStyle(0xffffff)
      maskShape.fillCircle(0, 0, radius - 1)
      iconSprite.setMask(maskShape.createGeometryMask())
      this.maskShapes.push(maskShape)
    } else {
      const isRandom = node.eventType === PlatformEventType.RANDOM
      const fontSize = node.eventType === PlatformEventType.BOSS
        ? (mobile ? 18 : 32)
        : isRandom ? (mobile ? 20 : 36)
        : (mobile ? 14 : 24)
      const icon = this.scene.add.text(0, 0, this.getIconForEventType(node.eventType), {
        font: `bold ${fontSize}px Arial`,
        color: visited ? '#888888' : (isRandom ? '#FFD700' : '#ffffff'),
        stroke: isRandom ? '#000000' : undefined,
        strokeThickness: isRandom ? 3 : 0
      }).setOrigin(0.5)
      container.add(icon)
    }

    container.setSize((radius + 6) * 2, (radius + 6) * 2)
    container.setInteractive({ useHandCursor: isClickable })
    if (isClickable) {
      container.on('pointerdown', () => {
        this.hideNodeTooltip()
        if (this.onNodeClick) this.onNodeClick(node)
      })
    }
    container.on('pointerover', () => {
      circle.setScale(1.12)
      this.showNodeTooltip(node)
    })
    container.on('pointerout', () => {
      circle.setScale(1.0)
      this.hideNodeTooltip()
    })

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
        key = spriteKey(41)
        scale = 1.0
        break
      case PlatformEventType.TRAINER_BATTLE: {
        const tk = TRAINER_KEYS[node.id % TRAINER_KEYS.length]
        key = trainerSpriteKey(tk)
        scale = 0.9
        break
      }
      case PlatformEventType.POKEMON_CENTER:
        key = itemSpriteKey('pokemon_center')
        scale = 1.8
        break
      case PlatformEventType.RANDOM:
        key = undefined
        break
      case PlatformEventType.DOUBLE_BATTLE:
        key = 'gemelas-icon'
        scale = 1.2
        break
      case PlatformEventType.DOJO:
        key = 'makuhita-icon'
        scale = 1.2
        break
      case PlatformEventType.PROFESSOR:
        key = 'cientifico-icon'
        scale = 1.2
        break
      case PlatformEventType.BERRY_TREE:
        key = 'baya-icon'
        scale = 1.4
        break
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
      return this.scene.add.image(0, 0, key)
    }
    return undefined
  }

  private drawDashedLine(x1: number, y1: number, x2: number, y2: number, color: number, alpha: number) {
    if (!this.linesGraphics) return
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt(dx * dx + dy * dy)
    const step = 10
    this.linesGraphics.fillStyle(color, alpha)
    let traveled = 0
    while (traveled <= dist) {
      const t = traveled / dist
      this.linesGraphics.fillCircle(x1 + dx * t, y1 + dy * t, 2.5)
      traveled += step
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
      case PlatformEventType.POKEMON_CENTER: return 0xFF69B4
      case PlatformEventType.RANDOM: return 0xAA44FF
      case PlatformEventType.MEMORIAL: return 0x9370DB
      case PlatformEventType.NARRATIVE: return 0x556B8F
      case PlatformEventType.DOUBLE_BATTLE: return 0xFF2222
      case PlatformEventType.BERRY_TREE: return 0xFF4499
      case PlatformEventType.DOJO: return 0xE65C00
      case PlatformEventType.PROFESSOR: return 0x00BCD4
      case PlatformEventType.PORTAL: return 0x8B00FF
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
      case PlatformEventType.POKEMON_CENTER: return '+'
      case PlatformEventType.RANDOM: return '?'
      case PlatformEventType.MEMORIAL: return '🙏'
      case PlatformEventType.NARRATIVE: return '📜'
      case PlatformEventType.DOUBLE_BATTLE: return '⚔️'
      case PlatformEventType.BERRY_TREE: return '🍓'
      case PlatformEventType.DOJO: return '🥋'
      case PlatformEventType.PROFESSOR: return '🔬'
      case PlatformEventType.PORTAL: return '✨'
      default: return '?'
    }
  }

  private getNodeTooltipLines(node: MapNode): string[] {
    switch (node.eventType) {
      case PlatformEventType.TRAINER_BATTLE: {
        const team: Pokemon[] = node.eventData?.team || []
        const lines = team.length ? team.map(p => `• ${p.name} Nv.${p.level}`) : ['(equipo oculto)']
        return [`ENTRENADOR`, ...lines]
      }
      case PlatformEventType.BOSS: {
        const team: Pokemon[] = node.eventData?.team || []
        const lines = team.length ? team.map(p => `${p.name} Nv.${p.level}`) : ['???']
        return [`LIDER ${this.bossGymLeaderName.toUpperCase()}`, ...lines]
      }
      case PlatformEventType.POKEMON_CAPTURE:
        return ['CAPTURA', 'Lanza una Poke Ball\ny atrapa un Pokemon\nsalvaje.']
      case PlatformEventType.WILD_POKEMON:
        return ['POKEMON SALVAJE', 'Aparece un Pokemon\nsalvaje. Combate\no huye.']
      case PlatformEventType.ITEM_PICKUP:
        return ['OBJETO', 'Recoge un objeto\nutil para tu\naventura.']
      case PlatformEventType.POKEMON_CENTER:
        return ['CENTRO POKEMON', 'Cura a todos tus\nPokemon\ncompletamente.']
      case PlatformEventType.RANDOM:
        return ['EVENTO MISTERIOSO', 'Algo inesperado\nocurrira. Bueno\no malo...']
      case PlatformEventType.MEMORIAL:
        return ['MEMORIAL', 'Un lugar de\nrecuerdo y\nreflexion.']
      case PlatformEventType.NARRATIVE:
        return ['HISTORIA', 'Un evento\nnarrativo que\navanza la trama.']
      case PlatformEventType.DOUBLE_BATTLE:
        return ['COMBATE DOBLE', '⚔️ Dos entrenadores\nte desafian a la vez.\nMas XP al ganar.']
      case PlatformEventType.BERRY_TREE:
        return ['ARBOL DE BAYAS', '🍓 Curacion,\nbuff o bayas\nraras te esperan.']
      case PlatformEventType.DOJO:
        return ['DOJO', '🥋 Entrena duro.\nElige una mejora\npermanente de stats.']
      case PlatformEventType.PROFESSOR:
        return ['PROFESOR', '🔬 Aprende movimiento,\nevolucion instantanea\no cambio de Pokemon.']
      case PlatformEventType.PORTAL:
        return ['PORTAL EXTRAÑO', '✨ Una dimension\nextraña. Pokemon\nlegendario te aguarda.']
      default:
        return ['???']
    }
  }

  private showNodeTooltip(node: MapNode) {
    this.hideNodeTooltip()
    const lines = this.getNodeTooltipLines(node)

    const boxW = 300
    const boxH = 130

    let bx = node.x + 32
    let by = node.y - boxH - 10
    if (bx + boxW > this.scene.scale.width - 10) bx = node.x - boxW - 32
    if (by < 4) by = node.y + 32

    const container = this.scene.add.container(bx, by)
    container.setDepth(200)

    if (this.scene.textures.exists('cajadialogo')) {
      const bg = this.scene.add.image(0, 0, 'cajadialogo')
        .setOrigin(0, 0)
        .setDisplaySize(boxW, boxH)
      container.add(bg)
    } else {
      const fallback = this.scene.add.graphics()
      fallback.fillStyle(0xffffff, 1)
      fallback.fillRect(0, 0, boxW, boxH)
      fallback.lineStyle(3, 0x000000, 1)
      fallback.strokeRect(0, 0, boxW, boxH)
      container.add(fallback)
    }

    const innerW = boxW - 32

    // Title line
    const title = this.scene.add.text(boxW / 2, 26, lines[0], {
      fontFamily: '"Press Start 2P"',
      fontSize: '13px',
      color: '#000000',
      align: 'center',
      wordWrap: { width: innerW }
    }).setOrigin(0.5, 0)
    container.add(title)

    // Body lines (remaining)
    if (lines.length > 1) {
      const body = this.scene.add.text(boxW / 2, 26 + title.height + 8, lines.slice(1).join('\n'), {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        color: '#000000',
        align: 'center',
        wordWrap: { width: innerW },
        lineSpacing: 4
      }).setOrigin(0.5, 0)
      container.add(body)
    }

    this.tooltip = container
  }

  private hideNodeTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy()
      this.tooltip = undefined
    }
  }

  clearMap() {
    this.hideNodeTooltip()
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

