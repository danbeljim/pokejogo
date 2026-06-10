import Phaser from 'phaser'
import Player from '../entities/Player'
import MapManager from '../managers/MapManager'
import LevelGenerator from '../managers/LevelGenerator'
import PlatformManager from '../managers/PlatformManager'
import EventManager from '../managers/EventManager'
import EventPopup from '../ui/EventPopup'
import { createStarterPokemon } from '../entities/PokemonFactory'
import { Pokemon } from '../entities/Pokemon'

export default class GameScene extends Phaser.Scene {
  private player?: Player
  private mapManager = new MapManager()
  private levelGenerator = new LevelGenerator()
  private platformManager?: PlatformManager
  private eventManager = new EventManager()
  private eventPopup?: EventPopup
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private touchedPlatforms: Set<any> = new Set()
  private eventOccurred: boolean = false
  private hudText?: Phaser.GameObjects.Text
  private playerTeam: Pokemon[] = []

  constructor() {
    super('GameScene')
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e')

    // Initialize team if empty (first map only)
    if (this.playerTeam.length === 0) {
      this.playerTeam.push(createStarterPokemon())
    } else {
      // Heal team between maps
      this.playerTeam.forEach(p => p.heal(p.maxHp))
    }

    this.platformManager = new PlatformManager(this)
    this.eventPopup = new EventPopup(this)

    const currentMap = this.mapManager.getCurrentMap()
    const platforms = this.levelGenerator.generateLevel(
      currentMap.platformCount,
      currentMap.difficulty
    )
    this.platformManager.createPlatforms(platforms)

    this.player = new Player(this, 400, 500)

    this.physics.add.collider(
      this.player,
      this.platformManager.getPlatformsGroup(),
      this.onPlatformCollide,
      undefined,
      this
    )

    this.cursors = this.input.keyboard?.createCursorKeys()

    this.updateHud()
  }

  private updateHud() {
    if (this.hudText) this.hudText.destroy()
    const currentMap = this.mapManager.getCurrentMap()
    const teamSummary = this.playerTeam
      .map(p => `${p.name}(Lv${p.level} ${p.hp}/${p.maxHp})`)
      .join(', ')

    this.hudText = this.add.text(10, 10,
      `Map ${currentMap.id}: ${currentMap.name}\n` +
      `Gym Leader: ${currentMap.gymLeaderName}\n` +
      `Medals: ${this.mapManager.getMedalCount()}/8\n` +
      `Team: ${teamSummary}`, {
      font: '13px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 6, y: 4 }
    }).setScrollFactor(0).setDepth(100)
  }

  onPlatformCollide(_player: any, platform: any) {
    if (this.eventOccurred) return
    if (!this.eventPopup || !this.platformManager) return
    if (this.touchedPlatforms.has(platform)) return

    const platformData = this.platformManager.getPlatformData(platform)
    if (!platformData) return

    this.touchedPlatforms.add(platform)
    this.eventOccurred = true

    const currentMap = this.mapManager.getCurrentMap()
    const result = this.eventManager.handleEvent(
      platformData,
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
        message: 'You lost! Restarting from start...'
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
          (hasNext ? ' Onward to next gym!' : ' YOU WIN THE GAME!')
      }, () => {
        if (hasNext) {
          this.scene.restart()
        } else {
          this.scene.restart()
        }
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

  update() {
    if (!this.player || !this.cursors || this.eventOccurred) return

    if (this.cursors.left?.isDown) {
      this.player.moveLeft()
    } else if (this.cursors.right?.isDown) {
      this.player.moveRight()
    } else {
      this.player.setVelocityX(0)
    }

    if (this.cursors.up?.isDown) {
      this.player.jump()
    }

    if (this.player.y > 600) {
      this.scene.restart()
    }
  }
}
