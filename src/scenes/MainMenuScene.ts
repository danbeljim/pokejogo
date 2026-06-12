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
    this.add.text(400, 35, 'POKÉMON', {
      font: 'bold 44px Arial',
      color: '#ffffff',
      stroke: '#cc0000',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.add.text(400, 75, 'ROGUELIKE', {
      font: 'bold 44px Arial',
      color: '#cc0000',
      stroke: '#ffff00',
      strokeThickness: 4
    }).setOrigin(0.5)

    // Subtítulo con wordWrap
    this.add.text(400, 115, 'Selecciona una región para comenzar tu aventura', {
      font: 'bold 12px Arial',
      color: '#333333',
      wordWrap: { width: 600 },
      align: 'center'
    }).setOrigin(0.5)

    // Regiones
    REGIONS.forEach((region, i) => {
      const y = 200 + i * 130

      // Fondo degradado para cada región
      const regionBg = this.add.graphics()
      regionBg.fillStyle(0xffeb3b, 0.15)
      regionBg.fillRoundedRect(20, y - 40, 760, 100, 12)
      regionBg.lineStyle(3, 0xffc107, 1)
      regionBg.strokeRoundedRect(20, y - 40, 760, 100, 12)

      // Borde decorativo
      regionBg.lineStyle(2, 0xff6b00, 1)
      regionBg.strokeRoundedRect(25, y - 35, 750, 90, 10)

      // Badge decorativo (a la izquierda)
      const badge = this.add.graphics()
      badge.fillStyle(0xff6b00, 1)
      badge.fillCircle(50, y, 18)
      badge.fillStyle(0xffffff, 1)
      badge.fillCircle(50, y, 13)
      badge.fillStyle(0xff6b00, 1)
      badge.fillCircle(50, y, 8)

      this.add.text(50, y, '⭐', {
        font: 'bold 14px Arial',
        color: '#ffff00'
      }).setOrigin(0.5)

      // Nombre de región con estilo
      this.add.text(90, y - 15, region.name, {
        font: 'bold 28px Arial',
        color: '#ff6b00'
      })

      // Descripción
      this.add.text(90, y + 8, region.description, {
        font: 'bold 12px Arial',
        color: '#333333',
        wordWrap: { width: 450 }
      })

      // Botón de inicio (a la derecha)
      const btnBg = this.add.graphics()
      btnBg.fillStyle(0xff0000, 1)
      btnBg.fillRoundedRect(680, y - 22, 70, 44, 6)
      btnBg.lineStyle(2, 0xffff00, 1)
      btnBg.strokeRoundedRect(680, y - 22, 70, 44, 6)

      const btn = this.add.text(715, y, 'JUGAR', {
        font: 'bold 12px Arial',
        color: '#ffff00'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      btn.on('pointerover', () => {
        btn.setColor('#ffffff')
        btn.setScale(1.05)
        btnBg.clear()
        btnBg.fillStyle(0xcc0000, 1)
        btnBg.fillRoundedRect(680, y - 22, 70, 44, 6)
        btnBg.lineStyle(3, 0xffff00, 1)
        btnBg.strokeRoundedRect(680, y - 22, 70, 44, 6)
      })

      btn.on('pointerout', () => {
        btn.setColor('#ffff00')
        btn.setScale(1)
        btnBg.clear()
        btnBg.fillStyle(0xff0000, 1)
        btnBg.fillRoundedRect(680, y - 22, 70, 44, 6)
        btnBg.lineStyle(2, 0xffff00, 1)
        btnBg.strokeRoundedRect(680, y - 22, 70, 44, 6)
      })

      btn.on('pointerdown', () => this.selectRegion(region.id))
    })

    // Footer decorativo
    this.add.text(400, 570, '🔴 ⚫ 🔵 Aventura te espera 🔵 ⚫ 🔴', {
      font: 'bold 11px Arial',
      color: '#666666'
    }).setOrigin(0.5)
  }

  private selectRegion(regionId: number) {
    this.scene.start('StartScene', { regionId })
  }
}
