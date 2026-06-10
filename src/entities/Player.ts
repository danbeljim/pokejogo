import Phaser from 'phaser'

export interface PlayerData {
  x: number
  y: number
  team: any[]
  medals: number
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
  team: any[] = []
  currentHealth: number = 100
  maxHealth: number = 100
  canJump: boolean = true

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, '')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Create visual representation
    const graphics = scene.make.graphics({ x, y, add: false })
    graphics.fillStyle(0xff0000, 1)
    graphics.fillRect(-15, -20, 30, 40)
    graphics.generateTexture('player', 30, 40)
    graphics.destroy()

    this.setTexture('player')
    this.setCollideWorldBounds(true)
    this.setBounce(0.1)
    this.setDrag(100)
  }

  moveLeft() {
    this.setVelocityX(-200)
  }

  moveRight() {
    this.setVelocityX(200)
  }

  jump() {
    if (this.body?.touching.down) {
      this.setVelocityY(-400)
    }
  }

  addPokemon(pokemon: any) {
    this.team.push(pokemon)
  }

  getPokemonTeam() {
    return this.team
  }
}
