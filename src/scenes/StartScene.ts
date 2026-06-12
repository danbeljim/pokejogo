import Phaser from 'phaser'
import { getStarters, spriteKey, spriteUrl } from '../entities/PokemonFactory'
import { TYPE_COLORS } from '../data/Types'

export default class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene')
  }

  preload() {
    getStarters().forEach(s => {
      this.load.image(spriteKey(s.dexId, false), spriteUrl(s.dexId, false))
    })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a')

    this.add.text(400, 80, 'POKÉMON ROGUELIKE', {
      font: 'bold 36px Arial',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5)

    this.add.text(400, 130, '8 Gimnasios. 8 Medallas. Una Partida.', {
      font: '16px Arial',
      color: '#cccccc'
    }).setOrigin(0.5)

    this.add.text(400, 200, 'Elige tu inicial:', {
      font: '20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5)

    const starters = getStarters()
    starters.forEach((starter, i) => {
      const x = 150 + i * 175
      const y = 340

      const bg = this.add.graphics()
      bg.fillStyle(0x1a1a2e, 1)
      bg.lineStyle(2, parseInt(TYPE_COLORS[starter.type].replace('#', '0x')), 1)
      bg.fillRoundedRect(x - 70, y - 90, 140, 200, 8)
      bg.strokeRoundedRect(x - 70, y - 90, 140, 200, 8)

      const sprite = this.add.image(x, y - 20, spriteKey(starter.dexId, false))
      sprite.setScale(2.5)

      this.add.text(x, y + 60, starter.name, {
        font: 'bold 14px Arial',
        color: '#ffffff'
      }).setOrigin(0.5)

      this.add.text(x, y + 80, `[${starter.type.toUpperCase()}]`, {
        font: '12px Arial',
        color: TYPE_COLORS[starter.type]
      }).setOrigin(0.5)

      const btn = this.add.text(x, y + 130, '[Elegir]', {
        font: 'bold 14px Arial',
        color: '#FFD700',
        backgroundColor: '#222',
        padding: { x: 12, y: 6 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      btn.on('pointerover', () => btn.setColor('#ffffff'))
      btn.on('pointerout', () => btn.setColor('#FFD700'))
      btn.on('pointerdown', () => {
        this.scene.start('GameScene', { starterDexId: starter.dexId })
      })
    })

    this.add.text(400, 560, 'Pulsa los nodos para avanzar. ¡Derrota a 8 líderes para ganar!', {
      font: '13px Arial',
      color: '#888888'
    }).setOrigin(0.5)
  }
}
