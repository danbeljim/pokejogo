import Phaser from 'phaser'
import Player from '../entities/Player'
import MapManager from '../managers/MapManager'
import LevelGenerator from '../managers/LevelGenerator'
import PlatformManager from '../managers/PlatformManager'

export default class GameScene extends Phaser.Scene {
  private player?: Player
  private mapManager = new MapManager()
  private levelGenerator = new LevelGenerator()
  private platformManager?: PlatformManager
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys

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
      this.platformManager.getPlatformsGroup()
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
  }

  update() {
    if (!this.player || !this.cursors) return

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
