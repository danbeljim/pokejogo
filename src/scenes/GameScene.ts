import Phaser from 'phaser'
import MapManager from '../managers/MapManager'
import LevelGenerator from '../managers/LevelGenerator'
import PlatformManager from '../managers/PlatformManager'
import EventManager from '../managers/EventManager'
import EventPopup from '../ui/EventPopup'
import { createStarterByDexId, POKEMON_LIST } from '../entities/PokemonFactory'
import { Pokemon } from '../entities/Pokemon'
import { preloadSprites } from '../utils/SpriteLoader'
import { MapNode } from '../managers/LevelGenerator'

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
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e')

    if (this.playerTeam.length === 0) {
      this.playerTeam.push(createStarterByDexId(this.starterDexId))
    } else {
      this.playerTeam.forEach(p => p.heal(p.maxHp))
    }

    this.platformManager = new PlatformManager(this)
    this.eventPopup = new EventPopup(this)

    const currentMap = this.mapManager.getCurrentMap()
    const map = this.levelGenerator.generateLevel(
      currentMap.platformCount,
      currentMap.difficulty
    )
    this.platformManager.setMap(map, (node) => this.onNodeClick(node))

    this.updateHud()
    this.drawLegend()
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
