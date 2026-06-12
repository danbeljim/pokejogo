import Phaser from 'phaser'
import { REGIONS } from '../data/Regions'

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene')
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a')

    this.add.text(400, 60, 'POKÉMON ROGUELIKE', {
      font: 'bold 36px Arial',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5)

    this.add.text(400, 120, 'Selecciona una región para comenzar', {
      font: '16px Arial',
      color: '#cccccc'
    }).setOrigin(0.5)

    REGIONS.forEach((region, i) => {
      const y = 220 + i * 120

      const bg = this.add.graphics()
      bg.fillStyle(0x1a1a2e, 1)
      bg.lineStyle(2, 0x4488FF, 1)
      bg.fillRoundedRect(150, y, 500, 100, 8)
      bg.strokeRoundedRect(150, y, 500, 100, 8)

      this.add.text(400, y + 15, region.name, {
        font: 'bold 24px Arial',
        color: '#FFD700'
      }).setOrigin(0.5)

      this.add.text(400, y + 50, region.description, {
        font: '14px Arial',
        color: '#aaccff'
      }).setOrigin(0.5)

      const btn = this.add.text(400, y + 85, '[Empezar]', {
        font: 'bold 14px Arial',
        color: '#FFD700',
        backgroundColor: '#222',
        padding: { x: 12, y: 6 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      btn.on('pointerover', () => btn.setColor('#ffffff'))
      btn.on('pointerout', () => btn.setColor('#FFD700'))
      btn.on('pointerdown', () => this.selectRegion(region.id))
    })
  }

  private selectRegion(regionId: number) {
    this.scene.start('StartScene', { regionId })
  }
}
