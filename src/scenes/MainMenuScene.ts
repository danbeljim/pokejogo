import Phaser from 'phaser'
import { REGIONS } from '../data/Regions'

export default class MainMenuScene extends Phaser.Scene {
  private selectedIdx: number = 0

  constructor() {
    super('MainMenuScene')
  }

  create() {
    // Fondo estilo Pokémon Gen 2/3
    const bg = this.add.graphics()
    bg.fillStyle(0x3860d8, 1)
    bg.fillRect(0, 0, 800, 600)
    bg.destroy()

    // Panel superior (info)
    const topPanel = this.add.graphics()
    topPanel.fillStyle(0xe8d8c0, 1)
    topPanel.fillRect(0, 0, 800, 140)
    topPanel.lineStyle(2, 0x000000, 1)
    topPanel.strokeRect(0, 0, 800, 140)

    // Título
    this.add.text(400, 20, 'POKÉMON ROGUELIKE', {
      font: 'bold 20px Arial',
      color: '#000000'
    }).setOrigin(0.5)

    this.add.text(400, 50, 'Selecciona una región para comenzar', {
      font: 'bold 12px Arial',
      color: '#000000'
    }).setOrigin(0.5)

    // Icono/sprite zona izquierda (simulado con rectángulo colorido)
    const iconBg = this.add.graphics()
    iconBg.fillStyle(0xf8d8a8, 1)
    iconBg.fillRoundedRect(20, 160, 140, 380, 4)
    iconBg.lineStyle(2, 0x000000, 1)
    iconBg.strokeRoundedRect(20, 160, 140, 380, 4)

    // Decoración icono (simular un badge o Pokéball)
    const iconDecor = this.add.graphics()
    iconDecor.fillStyle(0xff0000, 1)
    iconDecor.fillCircle(90, 220, 35)
    iconDecor.fillStyle(0xffffff, 1)
    iconDecor.fillCircle(90, 220, 30)
    iconDecor.fillStyle(0x000000, 1)
    iconDecor.fillCircle(90, 220, 25)
    iconDecor.fillStyle(0xffffff, 1)
    iconDecor.fillCircle(90, 220, 20)

    this.add.text(90, 330, 'REGIONES', {
      font: 'bold 10px Arial',
      color: '#000000'
    }).setOrigin(0.5)

    // Panel derecho (lista de regiones)
    const listBg = this.add.graphics()
    listBg.fillStyle(0xf8f0e0, 1)
    listBg.fillRect(180, 160, 600, 380)
    listBg.lineStyle(2, 0x000000, 1)
    listBg.strokeRect(180, 160, 600, 380)

    // Título de lista
    this.add.text(190, 175, 'Disponibles:', {
      font: 'bold 10px Arial',
      color: '#000000'
    })

    // Regiones como items de lista
    REGIONS.forEach((region, i) => {
      const y = 210 + i * 50
      const isSelected = i === this.selectedIdx

      // Fondo selección
      if (isSelected) {
        const selBg = this.add.graphics()
        selBg.fillStyle(0x6888d8, 1)
        selBg.fillRect(185, y - 5, 590, 45)
      }

      // Nombre región
      this.add.text(200, y + 5, region.name, {
        font: `bold ${isSelected ? 12 : 10}px Arial`,
        color: isSelected ? '#ffffff' : '#000000'
      })

      // Cantidad simulada (como si fuera un item)
      this.add.text(750, y + 5, 'x001', {
        font: `${isSelected ? 'bold' : ''} 10px Arial`,
        color: isSelected ? '#ffffff' : '#000000'
      }).setOrigin(1, 0)

      // Zona interactiva
      const zone = this.add.zone(185, y + 17, 590, 45)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })

      zone.on('pointerdown', () => {
        this.selectedIdx = i
        this.scene.restart()
      })

      zone.on('pointerover', () => {
        zone.setScale(1.02)
      })

      zone.on('pointerout', () => {
        zone.setScale(1)
      })
    })

    // Panel inferior (acción)
    const bottomPanel = this.add.graphics()
    bottomPanel.fillStyle(0x3860d8, 1)
    bottomPanel.fillRect(0, 540, 800, 60)

    const startBtn = this.add.text(400, 570, '▶ EMPEZAR AVENTURA', {
      font: 'bold 14px Arial',
      color: '#ffff00',
      backgroundColor: '#000000',
      padding: { x: 20, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    startBtn.on('pointerover', () => startBtn.setColor('#ffffff'))
    startBtn.on('pointerout', () => startBtn.setColor('#ffff00'))
    startBtn.on('pointerdown', () => this.selectRegion(REGIONS[this.selectedIdx].id))
  }

  private selectRegion(regionId: number) {
    this.scene.start('StartScene', { regionId })
  }
}
