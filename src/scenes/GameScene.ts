import Phaser from 'phaser'
import MapManager from '../managers/MapManager'
import LevelGenerator from '../managers/LevelGenerator'
import PlatformManager from '../managers/PlatformManager'
import EventManager from '../managers/EventManager'
import EventPopup from '../ui/EventPopup'
import { createStarterByDexId, POKEMON_LIST, spriteKey, spriteUrl } from '../entities/PokemonFactory'
import { Pokemon } from '../entities/Pokemon'
import { preloadSprites, preloadItemSprites, preloadTrainerSprites, preloadGymLeaderSprites } from '../utils/SpriteLoader'
import { MapNode } from '../managers/LevelGenerator'
import { TRAINER_ICON_DEX, gymLeaderSpriteKey } from '../data/GameAssets'
import { EVOLUTION_TARGET_IDS } from '../data/Evolution'
import { Item } from '../data/Items'

export default class GameScene extends Phaser.Scene {
  private mapManager = new MapManager()
  private levelGenerator = new LevelGenerator()
  private platformManager?: PlatformManager
  private eventManager = new EventManager()
  private eventPopup?: EventPopup
  private hudText?: Phaser.GameObjects.Text
  private teamPanel?: Phaser.GameObjects.Container
  private playerTeam: Pokemon[] = []
  private playerBag: Item[] = []
  private eventOccurred: boolean = false
  private starterDexId: number = 4

  constructor() {
    super('GameScene')
  }

  init(data: { starterDexId?: number }) {
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
    this.load.image('tall-grass', '/assets/hierba.jpg')

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
    })
  }

  create() {
    const currentMap = this.mapManager.getCurrentMap()
    this.cameras.main.setBackgroundColor(currentMap.bgColor)
    this.createGrassTileFromImage()

    this.drawThemedBackground(currentMap)

    if (this.playerTeam.length === 0) {
      this.playerTeam.push(createStarterByDexId(this.starterDexId))
    } else {
      this.playerTeam.forEach(p => p.heal(p.maxHp))
    }

    this.platformManager = new PlatformManager(this)
    this.eventPopup = new EventPopup(this)
    const playerMaxLevel = Math.max(...this.playerTeam.map(p => p.level), 5)
    const map = this.levelGenerator.generateLevel(
      currentMap.platformCount,
      currentMap.difficulty,
      playerMaxLevel
    )
    this.platformManager.setMap(map, (node) => this.onNodeClick(node), currentMap.signaturePokemonDexId, currentMap.gymLeaderName)

    this.updateHud()
    this.drawMenuButtons()

    // Defensive: any resume from sub-scene clears event lock + refreshes UI
    this.events.on('resume', () => {
      this.eventOccurred = false
      this.updateHud()
    })
    this.events.on('shutdown', () => {
      this.events.off('resume')
      this.events.off('shutdown')
    })
  }

  private drawMenuButtons() {
    const btnX = 140
    const btnY = this.scale.height - 90

    const bagBtn = this.add.text(btnX, btnY, '🎒 Mochila', {
      font: 'bold 18px Arial', color: '#FFD700',
      backgroundColor: '#222', padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true })
    bagBtn.on('pointerdown', () => {
      if (this.eventOccurred) return
      this.scene.pause()
      this.scene.launch('BagScene', {
        playerTeam: this.playerTeam,
        playerBag: this.playerBag,
        onComplete: () => this.updateHud()
      })
    })

    const orderBtn = this.add.text(btnX, btnY + 55, '⇅ Orden', {
      font: 'bold 18px Arial', color: '#FFD700',
      backgroundColor: '#222', padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true })
    orderBtn.on('pointerdown', () => {
      if (this.eventOccurred) return
      this.scene.pause()
      this.scene.launch('TeamOrderScene', {
        playerTeam: this.playerTeam,
        onComplete: () => this.updateHud()
      })
    })
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

    // Gradient overlay using accent color
    const accent = parseInt(currentMap.accentColor.replace('#', '0x'))
    const g = this.add.graphics()
    g.fillGradientStyle(accent, accent, 0x000000, 0x000000, 0.25, 0.25, 0.6, 0.6)
    g.fillRect(0, 0, w, h)
    g.setDepth(0)

    // Giant gym leader silhouette in background
    const leaderKey = gymLeaderSpriteKey(currentMap.gymLeaderName)
    const sigKey = spriteKey(currentMap.signaturePokemonDexId, false)
    const bgKey = this.textures.exists(leaderKey) ? leaderKey : sigKey
    if (this.textures.exists(bgKey)) {
      const bg = this.add.image(w / 2, h / 2 + 30, bgKey)
      bg.setScale(bgKey === leaderKey ? 5 : 7)
      bg.setAlpha(0.15)
      bg.setTint(parseInt(currentMap.accentColor.replace('#', '0x')))
      bg.setDepth(0)
    }

    // Title overlay
    this.add.text(w / 2, 60, currentMap.themeName, {
      font: 'italic bold 32px Arial',
      color: currentMap.accentColor,
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(0).setAlpha(0.7)
  }

  private drawLegend() {
    const items = [
      { icon: 'C', label: 'Capture', color: '#4CAF50' },
      { icon: 'W', label: 'Wild', color: '#FF9800' },
      { icon: 'T', label: 'Trainer', color: '#FF5722' },
      { icon: 'I', label: 'Item', color: '#2196F3' },
      { icon: 'B', label: 'Boss', color: '#FFD700' }
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

  private updateHud() {
    if (this.hudText) this.hudText.destroy()
    const currentMap = this.mapManager.getCurrentMap()

    this.hudText = this.add.text(20, 20,
      `Mapa ${currentMap.id}: ${currentMap.name}\n` +
      `Líder de Gimnasio: ${currentMap.gymLeaderName}\n` +
      `Medallas: ${this.mapManager.getMedalCount()}/8`, {
      font: '20px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 12, y: 8 }
    }).setScrollFactor(0).setDepth(100)

    this.drawTeamPanel()
  }

  private drawTeamPanel() {
    if (this.teamPanel) this.teamPanel.destroy()
    const slots = 6
    const slotH = 100
    const slotW = 120
    const x0 = 12
    const y0 = 180
    const container = this.add.container(0, 0).setDepth(100).setScrollFactor(0)

    const title = this.add.text(x0 + slotW / 2, y0 - 32, 'EQUIPO', {
      font: 'bold 17px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5)
    container.add(title)

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
        continue
      }

      const sKey = spriteKey(p.id, false)
      if (this.textures.exists(sKey)) {
        const img = this.add.image(x0 + 30, y + 40, sKey)
        img.setScale(1)
        container.add(img)
      }

      const info = this.add.text(x0 + 64, y + 8, `${p.name}\nNv.${p.level}`, {
        font: '11px Arial', color: '#ffffff'
      })
      container.add(info)

      // HP bar
      const hpRatio = Math.max(0, p.hp / p.maxHp)
      const hpBar = this.add.graphics()
      const barX = x0 + 5
      const barY = y + slotH - 15
      const barW = slotW - 10
      hpBar.fillStyle(0x222222, 1)
      hpBar.fillRect(barX, barY, barW, 8)
      const hpColor = hpRatio > 0.5 ? 0x4CAF50 : hpRatio > 0.2 ? 0xFFC107 : 0xF44336
      hpBar.fillStyle(hpColor, 1)
      hpBar.fillRect(barX, barY, barW * hpRatio, 8)
      container.add(hpBar)
    }

    this.teamPanel = container
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
      currentMap.gymLeaderName
    )

    if (result.requiresBattle && result.enemyTeam && result.battleType) {
      this.scene.pause()
      this.scene.launch('BattleScene', {
        playerTeam: this.playerTeam,
        enemyTeam: result.enemyTeam,
        battleType: result.battleType,
        gymLeaderName: currentMap.gymLeaderName,
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
      this.showToast('¡Has perdido! Reiniciando...')
      this.time.delayedCall(800, () => this.scene.restart())
      return
    }

    const rewardMsg = this.eventManager.applyBattleReward(this.playerTeam, battleType)

    if (battleType === 'boss') {
      this.mapManager.addMedal({
        name: this.mapManager.getCurrentMap().name,
        badgeNumber: this.mapManager.getCurrentMap().id
      })

      const hasNext = this.mapManager.nextMap()
      this.showToast(`¡Medalla nº${this.mapManager.getMedalCount()}! ${hasNext ? 'Siguiente gimnasio...' : '¡HAS GANADO!'}`)
      this.time.delayedCall(1000, () => this.scene.restart())
    } else {
      this.updateHud()
      this.showToast(`¡Victoria! ${rewardMsg}`)
    }
  }

  private showToast(msg: string) {
    const t = this.add.text(400, 60, msg, {
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

