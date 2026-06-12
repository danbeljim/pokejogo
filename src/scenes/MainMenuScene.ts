import Phaser from 'phaser'
import { REGIONS } from '../data/Regions'

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene')
  }

  create() {
    // Fondo con degradado Pokéball-inspired
    const graphics = this.make.graphics({ x: 0, y: 0 })
    graphics.fillStyle(0xff0000, 1)
    graphics.fillRect(0, 0, 800, 300)
    graphics.fillStyle(0xffffff, 1)
    graphics.fillRect(0, 300, 800, 600)
    graphics.generateTexture('pokeball_bg', 800, 600)
    graphics.destroy()

    this.add.image(400, 300, 'pokeball_bg').setOrigin(0.5, 0.5)

    // Efecto de brillo decorativo
    const circle1 = this.add.circle(100, 100, 150, 0xff6b6b, 0.1)
    const circle2 = this.add.circle(700, 500, 120, 0x4169e1, 0.1)

    // Título principal
    const title = this.add.text(400, 50, 'POKÉMON', {
      font: 'bold 48px Arial',
      color: '#ffffff',
      stroke: '#cc0000',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.add.text(400, 95, 'ROGUELIKE', {
      font: 'bold 48px Arial',
      color: '#cc0000',
      stroke: '#ffff00',
      strokeThickness: 4
    }).setOrigin(0.5)

    // Subtítulo
    this.add.text(400, 150, 'Selecciona una región para comenzar tu aventura', {
      font: 'bold 14px Arial',
      color: '#333333'
    }).setOrigin(0.5)

    // Regiones
    REGIONS.forEach((region, i) => {
      const y = 250 + i * 140

      // Fondo degradado para cada región
      const regionBg = this.add.graphics()
      regionBg.fillStyle(0xffeb3b, 0.15)
      regionBg.fillRoundedRect(80, y - 50, 640, 120, 12)
      regionBg.lineStyle(3, 0xffc107, 1)
      regionBg.strokeRoundedRect(80, y - 50, 640, 120, 12)

      // Borde decorativo
      regionBg.lineStyle(2, 0xff6b00, 1)
      regionBg.strokeRoundedRect(85, y - 45, 630, 110, 10)

      // Nombre de región con estilo
      const nameText = this.add.text(120, y - 20, region.name, {
        font: 'bold 32px Arial',
        color: '#ff6b00'
      })

      // Badge decorativo
      const badge = this.add.graphics()
      badge.fillStyle(0xff6b00, 1)
      badge.fillCircle(70, y - 20, 20)
      badge.fillStyle(0xffffff, 1)
      badge.fillCircle(70, y - 20, 15)
      badge.fillStyle(0xff6b00, 1)
      badge.fillCircle(70, y - 20, 10)

      this.add.text(70, y - 20, '⭐', {
        font: 'bold 16px Arial',
        color: '#ffff00'
      }).setOrigin(0.5)

      // Descripción
      this.add.text(120, y + 12, region.description, {
        font: 'bold 13px Arial',
        color: '#333333',
        wordWrap: { width: 480 }
      })

      // Botón de inicio
      const btnBg = this.add.graphics()
      btnBg.fillStyle(0xff0000, 1)
      btnBg.fillRoundedRect(580, y - 20, 120, 50, 8)
      btnBg.lineStyle(2, 0xffff00, 1)
      btnBg.strokeRoundedRect(580, y - 20, 120, 50, 8)

      const btn = this.add.text(640, y + 5, '▶ EMPEZAR', {
        font: 'bold 14px Arial',
        color: '#ffff00'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      btn.on('pointerover', () => {
        btn.setColor('#ffffff')
        btn.setScale(1.1)
        btnBg.clear()
        btnBg.fillStyle(0xcc0000, 1)
        btnBg.fillRoundedRect(580, y - 20, 120, 50, 8)
        btnBg.lineStyle(3, 0xffff00, 1)
        btnBg.strokeRoundedRect(580, y - 20, 120, 50, 8)
      })

      btn.on('pointerout', () => {
        btn.setColor('#ffff00')
        btn.setScale(1)
        btnBg.clear()
        btnBg.fillStyle(0xff0000, 1)
        btnBg.fillRoundedRect(580, y - 20, 120, 50, 8)
        btnBg.lineStyle(2, 0xffff00, 1)
        btnBg.strokeRoundedRect(580, y - 20, 120, 50, 8)
      })

      btn.on('pointerdown', () => this.selectRegion(region.id))
    })

    // Footer decorativo
    this.add.text(400, 570, '🔴 ⚫ 🔵 Aventura te espera 🔵 ⚫ 🔴', {
      font: 'bold 12px Arial',
      color: '#666666'
    }).setOrigin(0.5)
  }

  private selectRegion(regionId: number) {
    this.scene.start('StartScene', { regionId })
  }
}
