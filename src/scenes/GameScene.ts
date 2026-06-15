import Phaser from 'phaser'
import MapManager from '../managers/MapManager'
import LevelGenerator from '../managers/LevelGenerator'
import PlatformManager from '../managers/PlatformManager'
import EventManager from '../managers/EventManager'
import EventPopup from '../ui/EventPopup'
import { BerryTreeData } from './BerryTreeScene'
import { DojoSceneData } from './DojoScene'
import { ProfessorSceneData } from './ProfessorScene'
import { createStarterByDexId, POKEMON_LIST, spriteKey, spriteUrl } from '../entities/PokemonFactory'
import { Pokemon } from '../entities/Pokemon'
import { preloadSprites, preloadItemSprites, preloadTrainerSprites, preloadGymLeaderSprites, preloadBadgeSprites } from '../utils/SpriteLoader'
import { MapNode } from '../managers/LevelGenerator'
import { TRAINER_ICON_DEX, itemSpriteKey, badgeSpriteKey, BADGE_SPRITES } from '../data/GameAssets'
import { EVOLUTION_TARGET_IDS } from '../data/Evolution'
import { Item } from '../data/Items'
import { computeActiveSynergy, TeamSynergy, assignRogueTraits } from '../data/RoguelikeData'

export default class GameScene extends Phaser.Scene {
  private mapManager = new MapManager()
  private levelGenerator = new LevelGenerator()
  private platformManager?: PlatformManager
  private eventManager = new EventManager()
  private eventPopup?: EventPopup
  private hudText?: Phaser.GameObjects.Text
  private teamPanel?: Phaser.GameObjects.Container
  private slotZones: Phaser.GameObjects.Zone[] = []
  private dragFromIdx = -1
  private dragGhost?: Phaser.GameObjects.Container
  private playerTeam: Pokemon[] = []
  private playerBag: Item[] = []
  private eventOccurred: boolean = false
  private starterDexId: number = 4

  private statsTooltip?: Phaser.GameObjects.Text
  private uiTooltip?: Phaser.GameObjects.Container
  private badgeContainer?: Phaser.GameObjects.Container
  private synergyText?: Phaser.GameObjects.Text
  private roguelikeMode: boolean = false
  private trainerClass: string | null = null
  private battleSpeed: 1 | 2 = 1
  private teamPanelCollapsed: boolean = false
  private teamToggleBtn?: Phaser.GameObjects.Container

  private get isMobile() { return this.scale.width < 1000 }
  private get SLOT_W() { return this.isMobile ? 90 : 150 }
  private get SLOT_H() { return this.isMobile ? 82 : 140 }
  private get SLOT_X0() { return 8 }
  private get SLOT_Y0() { return this.isMobile ? 50 : 80 }

  constructor() {
    super('GameScene')
  }

  init(data: { starterDexId?: number; newGame?: boolean; gameMode?: string; trainerClass?: string; resumeMapId?: number; resumeMedals?: any[]; resumeTeam?: Pokemon[]; resumeBag?: Item[] }) {
    this.roguelikeMode = (data?.gameMode || this.registry.get('gameMode')) === 'roguelike'
    this.trainerClass = data?.trainerClass || this.registry.get('trainerClass') || null

    if (data?.newGame) {
      this.playerTeam = []
      this.playerBag = []
      this.mapManager = new MapManager()
    } else if (data?.resumeMapId !== undefined) {
      this.mapManager = new MapManager()
      this.mapManager.currentMapId = data.resumeMapId
      this.mapManager.collectedMedals = data.resumeMedals || []
      if (data.resumeTeam) this.playerTeam = data.resumeTeam
      if (data.resumeBag) this.playerBag = data.resumeBag
    }
    if (data?.starterDexId) {
      this.starterDexId = data.starterDexId
    }
  }

  preload() {
    const ids = [...POKEMON_LIST.map(p => p.dexId), ...EVOLUTION_TARGET_IDS]
    preloadSprites(this, ids, false)
    preloadSprites(this, ids, true)
    preloadItemSprites(this)
    preloadTrainerSprites(this)
    preloadGymLeaderSprites(this)
    preloadBadgeSprites(this)
    this.load.image('cajadialogo', '/assets/trainers/cajadialogo.jpg')
    this.load.image('tall-grass', '/assets/trainers/grass.png')
    this.load.image('tall-grass-tile', '/assets/trainers/Zona_de_hierba_alta_XY.png')
    this.load.image('bici', '/assets/trainers/bici.png')

    // Trainer icon
    if (!this.textures.exists(spriteKey(TRAINER_ICON_DEX, false))) {
      this.load.image(spriteKey(TRAINER_ICON_DEX, false), spriteUrl(TRAINER_ICON_DEX, false))
    }

    // Signature pokemon sprites for all gyms (BG + boss icon)
    this.mapManager.maps.forEach(m => {
      const k = spriteKey(m.signaturePokemonDexId, false)
      if (!this.textures.exists(k)) {
        this.load.image(k, spriteUrl(m.signaturePokemonDexId, false))
      }
      const locKey = `location-bg-${m.id}`
      if (!this.textures.exists(locKey)) {
        this.load.image(locKey, m.locationBgUrl)
      }
    })
  }

  create() {
    const currentMap = this.mapManager.getCurrentMap()
    this.cameras.main.setBackgroundColor(currentMap.bgColor)
    this.createGrassTileFromImage()

    this.drawThemedBackground(currentMap)

    // Configure EventManager for roguelike mode
    this.eventManager.roguelikeMode = this.roguelikeMode
    this.eventManager.trainerClass = this.trainerClass

    if (this.playerTeam.length === 0) {
      const starter = createStarterByDexId(this.starterDexId)
      if (this.roguelikeMode) {
        // Starter gets traits too (guaranteed positive)
        assignRogueTraits(starter, true)
        // Luchador: +20% ATK to starter
        if (this.trainerClass === 'luchador') {
          starter.attack = Math.round(starter.attack * 1.20)
        }
      }
      this.playerTeam.push(starter)
    } else {
      this.playerTeam.forEach(p => p.heal(p.maxHp))
    }

    this.platformManager = new PlatformManager(this)
    this.eventPopup = new EventPopup(this)
    const playerMaxLevel = Math.max(...this.playerTeam.map(p => p.level), 5)
    const map = currentMap.towerMap
      ? this.levelGenerator.generateTower(playerMaxLevel)
      : this.levelGenerator.generateLevel(
          currentMap.platformCount,
          currentMap.difficulty,
          playerMaxLevel,
          currentMap.ghostOnly
        )

    // Explorador: convert 2 mid nodes to RANDOM events
    if (this.roguelikeMode && this.trainerClass === 'explorador') {
      const candidates = map.nodes.filter((n: MapNode) =>
        n.row > 1 && n.row < map.rows - 2 &&
        n.eventType !== 'boss' && n.eventType !== 'pokemon_center'
      )
      let converted = 0
      while (converted < 2 && candidates.length > 0) {
        const idx = Math.floor(Math.random() * candidates.length)
        candidates[idx].eventType = 'random' as any
        candidates.splice(idx, 1)
        converted++
      }
    }

    this.platformManager.setMap(map, (node) => this.onNodeClick(node), currentMap.signaturePokemonDexId, currentMap.gymLeaderName)

    this.updateHud()
    this.drawMenuButtons()
    this.drawSpeedToggle()

    // Defensive: any resume from sub-scene clears event lock + refreshes UI
    this.events.on('resume', () => {
      this.eventOccurred = false
      this.updateHud()
    })
    this.events.on('shutdown', () => {
      this.events.off('resume')
      this.events.off('shutdown')
      this.input.off('dragstart')
      this.input.off('drag')
      this.input.off('dragend')
      this.slotZones.forEach(z => z.destroy())
      this.slotZones = []
      if (this.dragGhost) { this.dragGhost.destroy(); this.dragGhost = undefined }
    })
  }

  private speedToggleContainer?: Phaser.GameObjects.Container

  private drawSpeedToggle() {
    if (this.speedToggleContainer) this.speedToggleContainer.destroy()
    const fast = this.battleSpeed === 2
    const SIZE = 64
    const bx = this.scale.width - 80 - SIZE / 2
    const by = this.scale.height - 80 - 90 - 84 - SIZE / 2
    const container = this.add.container(bx, by).setScrollFactor(0).setDepth(200)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.4)
    bg.fillRoundedRect(3, 3, SIZE, SIZE, 10)
    bg.fillStyle(fast ? 0xFFD700 : 0x1a1a2e, 1)
    bg.fillRoundedRect(0, 0, SIZE, SIZE, 10)
    bg.lineStyle(2, fast ? 0xffffff : 0x555577, 1)
    bg.strokeRoundedRect(0, 0, SIZE, SIZE, 10)
    container.add(bg)

    if (this.textures.exists('bici')) {
      const img = this.add.image(SIZE / 2, SIZE / 2 - 4, 'bici').setDisplaySize(42, 42)
      if (!fast) img.setTint(0xaaaaff)
      container.add(img)
    }

    const badgeBg = this.add.graphics()
    badgeBg.fillStyle(fast ? 0x222222 : 0xFFD700, 1)
    badgeBg.fillRoundedRect(SIZE - 24, SIZE - 18, 26, 18, 4)
    container.add(badgeBg)

    const badge = this.add.text(SIZE - 11, SIZE - 9, fast ? 'x2' : 'x1', {
      font: 'bold 12px Arial',
      color: fast ? '#FFD700' : '#222222'
    }).setOrigin(0.5, 0.5)
    container.add(badge)

    container.setSize(SIZE, SIZE).setInteractive({ useHandCursor: true })
    container.on('pointerover', () => {
      bg.setAlpha(0.85)
      this.showUiTooltip(bx, by + SIZE / 2, 'VELOCIDAD', fast ? 'Combate rapido\nactivo (x2).' : 'Combate lento\nactivo (x1).')
    })
    container.on('pointerout', () => { bg.setAlpha(1); this.hideUiTooltip() })
    container.on('pointerdown', () => {
      this.battleSpeed = fast ? 1 : 2
      this.hideUiTooltip()
      this.drawSpeedToggle()
    })
    this.speedToggleContainer = container
  }

  private drawMenuButtons() {
    const bagX = this.scale.width - 80
    const bagY = this.scale.height - 80
    const yBag     = bagY - 16
    const yRope    = bagY - 90
    const menuBtnKey = itemSpriteKey('menuBtn')
    if (this.textures.exists(menuBtnKey)) {
      const menuImg = this.add.image(bagX, yRope, menuBtnKey)
        .setScale(1).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true })
      menuImg.on('pointerover', () => { menuImg.setScale(1.15); this.showUiTooltip(bagX, yRope, 'CUERDA HUIDA', 'Volver al\nmenu principal.') })
      menuImg.on('pointerout', () => { menuImg.setScale(1); this.hideUiTooltip() })
      menuImg.on('pointerdown', () => {
        if (!this.roguelikeMode) this.registry.set('hasSavedGame', true)
        this.scene.start('MainMenuScene')
      })
    } else {
      this.add.text(bagX, yRope, '← Menú', {
        font: 'bold 16px Arial', color: '#FFD700',
        backgroundColor: '#333', padding: { x: 12, y: 8 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          if (!this.roguelikeMode) this.registry.set('hasSavedGame', true)
          this.scene.start('MainMenuScene')
        })
    }

    const openBag = () => {
      if (this.eventOccurred) return
      this.scene.pause()
      this.scene.launch('BagScene', {
        playerTeam: this.playerTeam,
        playerBag: this.playerBag,
        onComplete: () => this.updateHud()
      })
    }

    const bagKey = itemSpriteKey('bag')

    if (this.textures.exists(bagKey)) {
      const bagImg = this.add.image(bagX, yBag, bagKey)
        .setScale(1.2).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true })
      bagImg.on('pointerover', () => { bagImg.setScale(1.4); this.showUiTooltip(bagX, yBag, 'MOCHILA', 'Ver y usar\ntus objetos.') })
      bagImg.on('pointerout', () => { bagImg.setScale(1.2); this.hideUiTooltip() })
      bagImg.on('pointerdown', openBag)
    } else {
      this.add.text(bagX, bagY, '🎒', {
        font: 'bold 28px Arial',
        backgroundColor: '#222', padding: { x: 10, y: 6 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true })
        .on('pointerdown', openBag)
    }
  }

  private showUiTooltip(anchorX: number, anchorY: number, title: string, body: string) {
    this.hideUiTooltip()
    const boxW = 240
    const boxH = 100
    let bx = anchorX - boxW - 20
    let by = anchorY - boxH / 2
    if (bx < 4) bx = anchorX + 20
    if (by < 4) by = 4
    if (by + boxH > this.scale.height - 4) by = this.scale.height - boxH - 4

    const container = this.add.container(bx, by).setDepth(300).setScrollFactor(0)

    if (this.textures.exists('cajadialogo')) {
      container.add(this.add.image(0, 0, 'cajadialogo').setOrigin(0, 0).setDisplaySize(boxW, boxH))
    } else {
      const g = this.add.graphics()
      g.fillStyle(0xffffff, 1).fillRect(0, 0, boxW, boxH)
      g.lineStyle(3, 0x000000, 1).strokeRect(0, 0, boxW, boxH)
      container.add(g)
    }

    const innerW = boxW - 32
    const titleTxt = this.add.text(boxW / 2, 22, title, {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#000000',
      align: 'center', wordWrap: { width: innerW }
    }).setOrigin(0.5, 0)
    container.add(titleTxt)

    const bodyTxt = this.add.text(boxW / 2, 22 + titleTxt.height + 8, body, {
      fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#000000',
      align: 'center', wordWrap: { width: innerW }, lineSpacing: 4
    }).setOrigin(0.5, 0)
    container.add(bodyTxt)

    this.uiTooltip = container
  }

  private hideUiTooltip() {
    if (this.uiTooltip) { this.uiTooltip.destroy(); this.uiTooltip = undefined }
  }

  private createGrassTileFromImage() {
    if (this.textures.exists('tall-grass-tile') || !this.textures.exists('tall-grass')) return
    const rt = this.add.renderTexture(0, 0, 100, 100).setVisible(false)
    const src = this.add.image(0, 0, 'tall-grass').setOrigin(0, 0).setVisible(false)
    rt.draw(src, 0, 0)
    rt.saveTexture('tall-grass-tile')
    src.destroy()
    rt.destroy()
  }

  private generateTallGrassTexture() {
    if (this.textures.exists('tall-grass')) return
    const g = this.make.graphics({})
    const size = 32
    const px = 2 // pixel scale (16x16 logical grid)

    // Base ground (dark green)
    g.fillStyle(0x4a8836, 1)
    g.fillRect(0, 0, size, size)

    // Gen 1 style tall grass pattern (16x16 logical tile)
    // 0 = light, 1 = mid, 2 = dark
    const pattern = [
      [2,2,1,2,2,2,2,1,1,2,2,2,2,2,1,2],
      [2,1,0,1,2,2,1,0,0,1,2,2,1,0,1,2],
      [2,1,0,0,1,1,0,0,0,0,1,1,0,0,1,2],
      [2,2,1,0,0,0,0,1,1,0,0,0,0,1,2,2],
      [2,2,2,1,1,0,1,2,2,1,0,1,1,2,2,2],
      [2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [1,2,2,2,2,1,1,2,2,1,1,2,2,2,2,1],
      [0,1,2,2,1,0,0,1,1,0,0,1,2,2,1,0],
      [0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0],
      [1,0,0,0,0,1,1,0,0,1,1,0,0,0,0,1],
      [2,1,1,1,1,2,2,1,1,2,2,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,1,2,2,1,1,2,2,1,1,2,2,1,2,2],
      [2,1,0,1,1,0,0,1,1,0,0,1,1,0,1,2],
      [2,1,0,0,0,0,0,0,0,0,0,0,0,0,1,2]
    ]

    const colors = [0xa8e060, 0x70b048, 0x4a8836]
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        g.fillStyle(colors[pattern[y][x]], 1)
        g.fillRect(x * px, y * px, px, px)
      }
    }

    g.lineStyle(2, 0x1a3d10, 1)
    g.strokeRect(0, 0, size, size)

    g.generateTexture('tall-grass', size, size)
    g.destroy()
  }

  private drawThemedBackground(currentMap: any) {
    const w = this.scale.width
    const h = this.scale.height

    // Location map background from Bulbapedia
    const locKey = `location-bg-${currentMap.id}`
    if (this.textures.exists(locKey)) {
      const locBg = this.add.image(w / 2, h / 2, locKey)
      locBg.setDisplaySize(w, h)
      locBg.setAlpha(0.18)
      locBg.setDepth(0)
    }

    // Gradient overlay using accent color
    const accent = parseInt(currentMap.accentColor.replace('#', '0x'))
    const g = this.add.graphics()
    g.fillGradientStyle(accent, accent, 0x000000, 0x000000, 0.25, 0.25, 0.6, 0.6)
    g.fillRect(0, 0, w, h)
    g.setDepth(0)

    // Title overlay
    const titleFontSize = this.scale.width < 1000 ? 16 : 32
    this.add.text(w / 2, this.scale.width < 1000 ? 30 : 60, `${currentMap.routeName}  ·  ${currentMap.themeName}`, {
      font: `italic bold ${titleFontSize}px Arial`,
      color: currentMap.accentColor,
      stroke: '#000',
      strokeThickness: this.scale.width < 1000 ? 3 : 6
    }).setOrigin(0.5).setDepth(0).setAlpha(0.7)
  }

  private drawLegend() {
    const items = [
      { icon: 'C', label: 'Capture', color: '#4CAF50' },
      { icon: 'W', label: 'Wild', color: '#FF9800' },
      { icon: 'T', label: 'Trainer', color: '#FF5722' },
      { icon: 'I', label: 'Item', color: '#2196F3' },
      { icon: 'B', label: 'Boss', color: '#FFD700' },
      { icon: '+', label: 'Centro', color: '#FF69B4' },
      { icon: '?', label: 'Random', color: '#AA44FF' }
    ]
    const legendX = this.scale.width - 120
    items.forEach((item, i) => {
      this.add.text(legendX, 10 + i * 20, `${item.icon} = ${item.label}`, {
        font: '12px Arial',
        color: item.color,
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 }
      }).setScrollFactor(0).setDepth(100)
    })
  }

  private getActiveSynergy(): TeamSynergy | null {
    if (!this.roguelikeMode || this.playerTeam.length === 0) return null
    return computeActiveSynergy(this.playerTeam)
  }

  private updateHud() {
    if (this.hudText) this.hudText.destroy()
    if (this.badgeContainer) this.badgeContainer.destroy()
    if (this.synergyText) { this.synergyText.destroy(); this.synergyText = undefined }
    const currentMap = this.mapManager.getCurrentMap()

    const hudFontSize = this.isMobile ? 11 : 20
    const hudText = this.isMobile
      ? `${currentMap.name} · ${this.mapManager.getMedalCount()}/8🏅`
      : `Mapa ${currentMap.id}: ${currentMap.name}\n${currentMap.routeName} → ${currentMap.gymLeaderName}\nMedallas: ${this.mapManager.getMedalCount()}/8`
    this.hudText = this.add.text(this.scale.width - 10, 6, hudText, {
      font: `${hudFontSize}px Arial`,
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: this.isMobile ? 6 : 12, y: this.isMobile ? 4 : 8 },
      align: 'right'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100)

    // Draw collected badge sprites
    const leaders = Object.keys(BADGE_SPRITES)
    const collected = new Set(this.mapManager.collectedMedals.map((m: any) => m.gymLeaderName))
    const badgeSize = this.isMobile ? 16 : 28
    const gap = this.isMobile ? 2 : 4
    const totalW = leaders.length * (badgeSize + gap) - gap
    const bx = this.scale.width - 10 - totalW
    const by = this.isMobile ? 32 : 110
    this.badgeContainer = this.add.container(0, 0).setDepth(100).setScrollFactor(0)
    leaders.forEach((name, i) => {
      const key = badgeSpriteKey(name)
      const x = bx + i * (badgeSize + gap)
      const y = by
      const alpha = collected.has(name) ? 1 : 0.25
      const g = this.add.graphics().setScrollFactor(0)
      g.fillStyle(collected.has(name) ? 0xffd700 : 0x444444, alpha)
      g.fillCircle(x + badgeSize / 2, y + badgeSize / 2, badgeSize / 2)
      this.badgeContainer!.add(g)
      if (this.textures.exists(key)) {
        const img = this.add.image(x + badgeSize / 2, y + badgeSize / 2, key)
          .setDisplaySize(badgeSize, badgeSize).setAlpha(alpha).setScrollFactor(0)
        this.badgeContainer!.add(img)
      } else {
        console.warn('[Badge] texture missing:', key)
      }
    })

    // Roguelike mode indicator + active synergy
    if (this.roguelikeMode) {
      const syn = this.getActiveSynergy()
      const clsLabel = this.trainerClass ? ` · ${this.trainerClass.toUpperCase()}` : ''
      const synLabel = syn ? `\n◈ ${syn.name}` : ''
      this.synergyText = this.add.text(this.scale.width - 20, 155,
        `◆ PURO ROGUELIKE${clsLabel}${synLabel}`, {
        font: '14px Arial',
        color: syn ? syn.color : '#ff4444',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 },
        align: 'right'
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(100)
    }

    this.drawTeamToggle()
    this.drawTeamPanel()
  }

  private drawTeamToggle() {
    if (this.teamToggleBtn) this.teamToggleBtn.destroy()
    if (!this.isMobile) return

    const x0 = this.SLOT_X0
    const size = 36
    const btn = this.add.container(x0 + size / 2, 10).setDepth(200).setScrollFactor(0)
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.75)
    bg.fillRoundedRect(-size / 2, 0, size, size, 6)
    bg.lineStyle(1, 0xffd700, 1)
    bg.strokeRoundedRect(-size / 2, 0, size, size, 6)
    btn.add(bg)
    const label = this.add.text(0, size / 2, this.teamPanelCollapsed ? '▶' : '◀', {
      font: 'bold 14px Arial', color: '#ffffff'
    }).setOrigin(0.5)
    btn.add(label)
    btn.setSize(size, size).setInteractive({ useHandCursor: true })
    btn.on('pointerdown', () => {
      this.teamPanelCollapsed = !this.teamPanelCollapsed
      this.updateHud()
    })
    this.teamToggleBtn = btn
  }

  private drawTeamPanel() {
    this.slotZones.forEach(z => z.destroy())
    this.slotZones = []
    this.statsTooltip?.destroy()
    this.statsTooltip = undefined
    if (this.teamPanel) this.teamPanel.destroy()

    if (this.isMobile && this.teamPanelCollapsed) return

    const slots = 6
    const slotH = this.SLOT_H
    const slotW = this.SLOT_W
    const x0 = this.SLOT_X0
    const y0 = this.isMobile ? 50 : this.SLOT_Y0
    const container = this.add.container(0, 0).setDepth(100).setScrollFactor(0)

    for (let i = 0; i < slots; i++) {
      const y = y0 + i * slotH
      const bg = this.add.graphics()
      bg.fillStyle(0x000000, 0.75)
      bg.fillRoundedRect(x0, y, slotW, slotH - 8, 12)
      bg.lineStyle(1, 0x444444, 1)
      bg.strokeRoundedRect(x0, y, slotW, slotH - 8, 12)
      container.add(bg)

      const p = this.playerTeam[i]
      if (!p) {
        const empty = this.add.text(x0 + slotW / 2, y + (slotH - 8) / 2, '—', {
          font: '24px Arial', color: '#555555'
        }).setOrigin(0.5)
        container.add(empty)
      } else {
        const sKey = spriteKey(p.id, false)
        const spriteSize = this.isMobile ? 42 : 68
        const spriteOffX = this.isMobile ? 22 : 36
        const spriteOffY = this.isMobile ? 34 : 54
        if (this.textures.exists(sKey)) {
          const img = this.add.image(x0 + spriteOffX, y + spriteOffY, sKey).setDisplaySize(spriteSize, spriteSize)
          container.add(img)
        }

        const infoX = this.isMobile ? x0 + 48 : x0 + 76
        const info = this.add.text(infoX, y + 8, `${p.name}\nNv.${p.level}`, {
          font: `${this.isMobile ? 9 : 12}px Arial`, color: '#ffffff'
        })
        container.add(info)

        if (p.heldItem) {
          const iKey = itemSpriteKey(p.heldItem)
          if (this.textures.exists(iKey)) {
            const itemImg = this.add.image(x0 + slotW - 10, y + 10, iKey).setDisplaySize(18, 18)
            container.add(itemImg)
          }
        }

        const hpRatio = Math.max(0, p.hp / p.maxHp)
        const hpBar = this.add.graphics()
        const barX = x0 + 5
        const barY = y + slotH - 12
        const barW = slotW - 10
        hpBar.fillStyle(0x222222, 1)
        hpBar.fillRect(barX, barY, barW, 6)
        const hpColor = hpRatio > 0.5 ? 0x4CAF50 : hpRatio > 0.2 ? 0xFFC107 : 0xF44336
        hpBar.fillStyle(hpColor, 1)
        hpBar.fillRect(barX, barY, barW * hpRatio, 6)
        container.add(hpBar)
      }

      // Drag zone (scene-level, not inside container)
      const zone = this.add.zone(x0 + slotW / 2, y + (slotH - 8) / 2, slotW, slotH - 8)
        .setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: this.playerTeam[i] !== undefined })
      this.input.setDraggable(zone)
      zone.setData('idx', i)
      if (p) {
        zone.on('pointerover', () => {
          this.statsTooltip?.destroy()
          const lines = [
            `PS: ${p.hp}/${p.maxHp}`,
            `Atq: ${p.attack}`,
            `Def: ${p.defense}`,
            `Vel: ${p.speed}`,
            `Exp: ${p.experience}/${p.level * 20}`,
          ]
          if (p.heldItem) lines.push(`Item: ${p.heldItem}`)
          if (p.traits.length > 0) lines.push(`◆ ${p.traits.join(', ')}`)
          const tx = x0 + slotW + 6
          const ty = y
          this.statsTooltip = this.add.text(tx, ty, lines.join('\n'), {
            font: '11px Arial', color: '#ffffff',
            backgroundColor: '#111111',
            padding: { x: 6, y: 4 }
          }).setDepth(300).setScrollFactor(0)
        })
        zone.on('pointerout', () => {
          this.statsTooltip?.destroy()
          this.statsTooltip = undefined
        })
      }
      this.slotZones.push(zone)
    }

    this.setupSlotDrag()
    this.teamPanel = container
  }

  private setupSlotDrag() {
    this.input.off('dragstart')
    this.input.off('drag')
    this.input.off('dragend')

    this.input.on('dragstart', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Zone) => {
      const idx = gameObject.getData('idx') as number
      if (this.playerTeam[idx] === undefined) return
      this.dragFromIdx = idx

      const p = this.playerTeam[idx]
      const ghost = this.add.container(0, 0).setDepth(200).setScrollFactor(0)
      const bg = this.add.graphics()
      bg.fillStyle(0x333366, 0.92)
      bg.fillRoundedRect(-58, -44, 116, 88, 10)
      bg.lineStyle(2, 0xFFD700, 1)
      bg.strokeRoundedRect(-58, -44, 116, 88, 10)
      ghost.add(bg)
      const sKey = spriteKey(p.id, false)
      if (this.textures.exists(sKey)) {
        ghost.add(this.add.image(0, 0, sKey).setDisplaySize(60, 60))
      }
      this.dragGhost = ghost
    })

    this.input.on('drag', (pointer: Phaser.Input.Pointer) => {
      if (this.dragGhost) this.dragGhost.setPosition(pointer.x, pointer.y)
    })

    this.input.on('dragend', (pointer: Phaser.Input.Pointer) => {
      if (this.dragGhost) { this.dragGhost.destroy(); this.dragGhost = undefined }
      const from = this.dragFromIdx
      this.dragFromIdx = -1
      if (from < 0) return

      const to = this.slotZones.findIndex(z => {
        const b = z.getBounds()
        return b.contains(pointer.x, pointer.y)
      })
      if (to >= 0 && to !== from && this.playerTeam[from] && this.playerTeam[to]) {
        const tmp = this.playerTeam[from]
        this.playerTeam[from] = this.playerTeam[to]
        this.playerTeam[to] = tmp
        this.drawTeamPanel()
      }
    })
  }

  private onNodeClick(node: MapNode) {
    if (this.eventOccurred) return
    if (!this.platformManager || !this.eventPopup) return

    this.eventOccurred = true
    this.platformManager.setCurrentNode(node.id)

    const currentMap = this.mapManager.getCurrentMap()
    const result = this.eventManager.handleEvent(
      node as any,
      this.playerTeam,
      currentMap.difficulty,
      currentMap.gymLeaderName,
      currentMap.bossMaxLevel,
      currentMap.wildMinLevel,
      currentMap.wildMaxLevel,
      currentMap.ghostOnly
    )

    if (result.requiresBattle && result.enemyTeam && result.battleType) {
      this.scene.pause()
      const syn = this.getActiveSynergy()
      this.scene.launch('BattleScene', {
        playerTeam: this.playerTeam,
        enemyTeam: result.enemyTeam,
        battleType: result.battleType,
        gymLeaderName: currentMap.gymLeaderName,
        playerBag: this.playerBag,
        synergyBonuses: syn ? { atk: syn.atkBonus, def: syn.defBonus, spd: syn.spdBonus } : undefined,
        battleSpeed: this.battleSpeed,
        onComplete: (won: boolean) => this.onBattleEnd(won, result.battleType!)
      })
    } else if (result.requiresItemPicker) {
      this.scene.pause()
      this.scene.launch('ItemPickerScene', {
        playerTeam: this.playerTeam,
        playerBag: this.playerBag,
        onComplete: (picked?: Item) => {
          this.eventOccurred = false
          if (picked) this.showToast(`¡${picked.name} añadido a la mochila!`)
          this.updateHud()
        }
      })
    } else if (result.requiresCapturePicker && result.captureOptions) {
      this.scene.pause()
      this.scene.launch('CaptureScene', {
        playerTeam: this.playerTeam,
        options: result.captureOptions,
        onComplete: (caught?: Pokemon) => {
          this.eventOccurred = false
          if (caught) this.showToast(`¡${caught.name} capturado!`)
          this.updateHud()
        }
      })
    } else if (result.requiresRandomPicker) {
      this.scene.pause()
      this.scene.launch('RandomPickerScene', {
        playerTeam: this.playerTeam,
        difficulty: currentMap.difficulty,
        onComplete: (captureOptions?: Pokemon[]) => {
          this.eventOccurred = false
          if (!captureOptions || captureOptions.length === 0) {
            this.updateHud()
            return
          }
          this.scene.pause()
          this.scene.launch('CaptureScene', {
            playerTeam: this.playerTeam,
            options: captureOptions,
            onComplete: (caught?: Pokemon) => {
              this.eventOccurred = false
              if (caught) this.showToast(`¡${caught.name} capturado!`)
              this.updateHud()
            }
          })
        }
      })
    } else if (result.requiresBerryTree) {
      this.scene.pause()
      const data: BerryTreeData = {
        playerTeam: this.playerTeam,
        playerBag: this.playerBag,
        onComplete: () => {
          this.eventOccurred = false
          this.showToast('🍓 ¡Recompensa de Árbol de Bayas obtenida!')
          this.updateHud()
        }
      }
      this.scene.launch('BerryTreeScene', data)
    } else if (result.requiresDojo) {
      this.scene.pause()
      const data: DojoSceneData = {
        playerTeam: this.playerTeam,
        onComplete: () => {
          this.eventOccurred = false
          this.showToast('🥋 ¡Entrenamiento completado! Stats mejorados.')
          this.updateHud()
        }
      }
      this.scene.launch('DojoScene', data)
    } else if (result.requiresProfessor) {
      this.scene.pause()
      const data: ProfessorSceneData = {
        playerTeam: this.playerTeam,
        difficulty: currentMap.difficulty,
        onComplete: (newTeam: Pokemon[]) => {
          this.playerTeam = newTeam
          this.eventOccurred = false
          this.showToast('🔬 ¡El Profesor te ayudó!')
          this.updateHud()
        }
      }
      this.scene.launch('ProfessorScene', data)
    } else if (result.requiresPortal && result.portalPokemon) {
      const legendary = result.portalPokemon
      this.showToast(`✨ ¡Portal! ${legendary.name} Nv.${legendary.level} aparece...`)
      this.time.delayedCall(1000, () => {
        this.scene.pause()
        const syn = this.getActiveSynergy()
        this.scene.launch('BattleScene', {
          playerTeam: this.playerTeam,
          enemyTeam: [legendary],
          battleType: 'wild',
          gymLeaderName: currentMap.gymLeaderName,
          playerBag: this.playerBag,
          synergyBonuses: syn ? { atk: syn.atkBonus, def: syn.defBonus, spd: syn.spdBonus } : undefined,
          battleSpeed: this.battleSpeed,
          onComplete: (won: boolean) => {
            if (won) {
              this.scene.pause()
              this.scene.launch('CaptureScene', {
                playerTeam: this.playerTeam,
                options: [legendary],
                onComplete: (caught?: Pokemon) => {
                  this.eventOccurred = false
                  if (caught) this.showToast(`✨ ¡${caught.name} legendario capturado!`)
                  this.updateHud()
                }
              })
            } else {
              this.onBattleEnd(false, 'wild')
            }
          }
        })
      })
    } else if (result.type === 'pokemon_center') {
      this.showToast('¡Centro Pokémon! Equipo curado al completo.')
      this.eventOccurred = false
      this.updateHud()
    } else if (result.type === 'memorial' || result.type === 'narrative') {
      this.showToast(result.message)
      this.eventOccurred = false
      this.updateHud()
    } else {
      this.eventPopup.show(result, () => {
        this.eventOccurred = false
        this.updateHud()
      })
    }
  }

  private onBattleEnd(won: boolean, battleType: 'wild' | 'trainer' | 'boss') {
    this.eventOccurred = false

    if (!won) {
      this.playerTeam = []
      this.mapManager.currentMapId = 0
      this.mapManager.collectedMedals = []
      this.registry.set('hasSavedGame', false)
      const msg = this.roguelikeMode
        ? '¡Run terminada! El roguelike no perdona...'
        : '¡Has perdido! Volviendo al menú...'
      this.showToast(msg)
      this.time.delayedCall(1200, () => this.scene.start('MainMenuScene'))
      return
    }

    const rewardMsg = this.eventManager.applyBattleReward(this.playerTeam, battleType)

    if (battleType === 'boss') {
      const currentMap = this.mapManager.getCurrentMap()

      if (currentMap.isSpecialZone) {
        // Lavender Town / special zones: no medal, apply ghost blessing
        this.playerTeam.forEach(p => {
          if (!p.traits.includes('espectral')) {
            p.traits.push('espectral')
            p.attack = Math.round(p.attack * 1.15)
            p.speed = Math.round(p.speed * 1.15)
          }
        })
        const hasNext = this.mapManager.nextMap()
        this.showToast(`¡Espíritu liberado! Equipo recibe Rasgo Espectral. ${hasNext ? 'Adelante...' : '¡HAS GANADO!'}`)
        const nextMapId = this.mapManager.currentMapId
        const medals = [...this.mapManager.collectedMedals]
        const team = this.playerTeam
        const bag = this.playerBag
        this.time.delayedCall(1000, () => this.scene.start('GameScene', {
          resumeMapId: nextMapId,
          resumeMedals: medals,
          resumeTeam: team,
          resumeBag: bag,
          gameMode: this.roguelikeMode ? 'roguelike' : 'normal',
          trainerClass: this.trainerClass
        }))
        return
      }

      this.mapManager.addMedal({
        name: currentMap.name,
        badgeNumber: currentMap.id,
        gymLeaderName: currentMap.gymLeaderName
      })

      const hasNext = this.mapManager.nextMap()
      this.showToast(`¡Medalla nº${this.mapManager.getMedalCount()}! ${hasNext ? 'Siguiente gimnasio...' : '¡HAS GANADO!'}`)
      const nextMapId = this.mapManager.currentMapId
      const medals = [...this.mapManager.collectedMedals]
      const team = this.playerTeam
      const bag = this.playerBag
      this.time.delayedCall(1000, () => this.scene.start('GameScene', {
        resumeMapId: nextMapId,
        resumeMedals: medals,
        resumeTeam: team,
        resumeBag: bag,
        gameMode: this.roguelikeMode ? 'roguelike' : 'normal',
        trainerClass: this.trainerClass
      }))
    } else {
      this.updateHud()
      this.showToast(`¡Victoria! ${rewardMsg}`)
    }
  }

  private showToast(msg: string) {
    const t = this.add.text(this.scale.width / 2, 60, msg, {
      font: 'bold 14px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setDepth(300).setScrollFactor(0)
    this.tweens.add({
      targets: t, alpha: 0, duration: 600, delay: 1200,
      onComplete: () => t.destroy()
    })
  }
}

