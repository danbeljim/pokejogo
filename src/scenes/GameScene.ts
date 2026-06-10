import Phaser from 'phaser'
import Player from '../entities/Player'
import MapManager from '../managers/MapManager'
import LevelGenerator from '../managers/LevelGenerator'
import PlatformManager from '../managers/PlatformManager'
import EventManager from '../managers/EventManager'
import EventPopup from '../ui/EventPopup'

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

  constructor() {
    super('GameScene')
  }

  preload() {
  }

  create() {
    // Background
    this.cameras.main.setBackgroundColor('#1a1a2e')

    // Managers
    this.platformManager = new PlatformManager(this)
    this.eventPopup = new EventPopup(this)

    // Generate level
    const currentMap = this.mapManager.getCurrentMap()
    const platforms = this.levelGenerator.generateLevel(
      currentMap.platformCount,
      currentMap.difficulty
    )
    this.platformManager.createPlatforms(platforms)

    // Player
    this.player = new Player(this, 400, 500)

    // Collisions
    this.physics.add.collider(
      this.player,
      this.platformManager.getPlatformsGroup(),
      this.onPlatformCollide,
      undefined,
      this
    )

    // Input
    this.cursors = this.input.keyboard?.createCursorKeys()

    // UI
    this.add.text(10, 10, `Map ${currentMap.id}: ${currentMap.name}`, {
      font: '16px Arial',
      color: '#ffffff'
    })

    this.add.text(10, 30, `Gym Leader: ${currentMap.gymLeaderName}`, {
      font: '14px Arial',
      color: '#cccccc'
    })

    this.add.text(10, 50, `Team: ${this.player.getPokemonTeam().length}/6`, {
      font: '14px Arial',
      color: '#90EE90'
    })
  }

  onPlatformCollide(player: any, platform: any) {
    if (!this.eventPopup?.isVisible() && !this.eventOccurred && this.platformManager && this.eventManager) {
      const platformData = this.platformManager.getPlatformData(platform)
      if (platformData && !this.touchedPlatforms.has(platform)) {
        this.touchedPlatforms.add(platform)
        this.eventOccurred = true

        const result = this.eventManager.handleEvent(platformData, this.player!.getPokemonTeam())
        this.eventPopup.show(result, () => {
          this.eventOccurred = false
          this.touchedPlatforms.delete(platform)
        })
      }
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

    // Fall off world
    if (this.player.y > 600) {
      this.scene.restart()
    }
  }
}
