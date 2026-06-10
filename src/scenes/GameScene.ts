import Phaser from 'phaser'
import MapManager from '../managers/MapManager'
import LevelGenerator from '../managers/LevelGenerator'
import PlatformManager from '../managers/PlatformManager'
import EventManager from '../managers/EventManager'
import EventPopup from '../ui/EventPopup'
import { createStarterByDexId, POKEMON_LIST, spriteKey, spriteUrl } from '../entities/PokemonFactory'
import { Pokemon } from '../entities/Pokemon'
import { preloadSprites, preloadItemSprites } from '../utils/SpriteLoader'
import { MapNode } from '../managers/LevelGenerator'
import { TRAINER_ICON_DEX } from '../data/GameAssets'

export default class GameScene extends Phaser.Scene {
  private mapManager = new MapManager()
  private levelGenerator = new LevelGenerator()
  private platformManager?: PlatformManager
  private eventManager = new EventManager()
  private eventPopup?: EventPopup
  private hudText?: Phaser.GameObjects.Text
  private playerTeam: Pokemon[] = []
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
    const ids = POKEMON_LIST.map(p => p.dexId)
    preloadSprites(this, ids, false)
    preloadSprites(this, ids, true)
    preloadItemSprites(this)
    this.generateTallGrassTexture()

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

    this.drawThemedBackground(currentMap)

    if (this.playerTeam.length === 0) {
      this.playerTeam.push(createStarterByDexId(this.starterDexId))
    } else {
      this.playerTeam.forEach(p => p.heal(p.maxHp))
    }

    this.platformManager = new PlatformManager(this)
    this.eventPopup = new EventPopup(this)
    const map = this.levelGenerator.generateLevel(
      currentMap.platformCount,
      currentMap.difficulty
    )
    this.platformManager.setMap(map, (node) => this.onNodeClick(node), currentMap.signaturePokemonDexId)

    this.updateHud()
    this.drawLegend()
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
    const w = 800
    const h = 600

    // Gradient overlay using accent color
    const accent = parseInt(currentMap.accentColor.replace('#', '0x'))
    const g = this.add.graphics()
    g.fillGradientStyle(accent, accent, 0x000000, 0x000000, 0.25, 0.25, 0.6, 0.6)
    g.fillRect(0, 0, w, h)
    g.setDepth(0)

    // Giant signature pokemon silhouette in background
    const sigKey = spriteKey(currentMap.signaturePokemonDexId, false)
    if (this.textures.exists(sigKey)) {
      const bg = this.add.image(w / 2, h / 2 + 30, sigKey)
      bg.setScale(7)
      bg.setAlpha(0.12)
      bg.setTint(parseInt(currentMap.accentColor.replace('#', '0x')))
      bg.setDepth(0)
    }

    // Title overlay
    this.add.text(400, 30, currentMap.themeName, {
      font: 'italic bold 16px Arial',
      color: currentMap.accentColor,
      stroke: '#000',
      strokeThickness: 4
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
    items.forEach((item, i) => {
      this.add.text(620, 10 + i * 20, `${item.icon} = ${item.label}`, {
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
    const teamSummary = this.playerTeam
      .map(p => `${p.name}(Lv${p.level} ${p.hp}/${p.maxHp})`)
      .join('\n  ')

    this.hudText = this.add.text(10, 10,
      `Map ${currentMap.id}: ${currentMap.name}\n` +
      `Gym Leader: ${currentMap.gymLeaderName}\n` +
      `Medals: ${this.mapManager.getMedalCount()}/8\n` +
      `Team:\n  ${teamSummary}`, {
      font: '12px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 6, y: 4 }
    }).setScrollFactor(0).setDepth(100)
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
      this.eventPopup.show(result, () => {
        this.scene.pause()
        this.scene.launch('BattleScene', {
          playerTeam: this.playerTeam,
          enemyTeam: result.enemyTeam,
          battleType: result.battleType,
          gymLeaderName: currentMap.gymLeaderName,
          onComplete: (won: boolean) => this.onBattleEnd(won, result.battleType!)
        })
      })
    } else if (result.requiresItemPicker) {
      this.scene.pause()
      this.scene.launch('ItemPickerScene', {
        playerTeam: this.playerTeam,
        onComplete: () => {
          this.eventOccurred = false
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
    this.scene.resume()
    this.eventOccurred = false

    if (!won) {
      this.eventPopup?.show({
        type: 'boss' as any,
        message: 'You lost! Restarting from Map 1...'
      }, () => {
        this.playerTeam = []
        this.mapManager.currentMapId = 0
        this.mapManager.collectedMedals = []
        this.scene.restart()
      })
      return
    }

    const rewardMsg = this.eventManager.applyBattleReward(this.playerTeam, battleType)

    if (battleType === 'boss') {
      this.mapManager.addMedal({
        name: this.mapManager.getCurrentMap().name,
        badgeNumber: this.mapManager.getCurrentMap().id
      })

      const hasNext = this.mapManager.nextMap()
      this.eventPopup?.show({
        type: 'boss' as any,
        message: `Medal #${this.mapManager.getMedalCount()} earned! ${rewardMsg}` +
          (hasNext ? ' Onward to next gym!' : ' YOU WIN!')
      }, () => {
        this.scene.restart()
      })
    } else {
      this.updateHud()
      this.eventPopup?.show({
        type: battleType as any,
        message: `Victory! ${rewardMsg}`
      }, () => {
        this.updateHud()
      })
    }
  }
}
