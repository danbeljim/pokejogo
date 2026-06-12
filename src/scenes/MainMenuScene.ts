import Phaser from 'phaser'
import { REGIONS } from '../data/Regions'

export default class MainMenuScene extends Phaser.Scene {
  private selectedIdx: number = 0

  constructor() {
    super('MainMenuScene')
  }

  create() {
    // Fondo azul Pokémon
    const bg = this.add.graphics()
    bg.fillStyle(0x4878d8, 1)
    bg.fillRect(0, 0, 800, 600)
    bg.destroy()

    // Borde superior con nombre del jugador
    const topBorder = this.add.graphics()
    topBorder.fillStyle(0xe8d0b0, 1)
    topBorder.fillRect(0, 0, 800, 40)
    topBorder.lineStyle(2, 0x000000, 1)
    topBorder.strokeRect(0, 0, 800, 40)

    // Nombre jugador
    this.add.text(15, 10, 'ADVENTURER', {
      font: 'bold 12px Arial',
      color: '#000000'
    })

    // Panel izquierdo con icono
    const leftPanel = this.add.graphics()
    leftPanel.fillStyle(0xe8d0b0, 1)
    leftPanel.fillRect(10, 50, 220, 420)
    leftPanel.lineStyle(2, 0x000000, 1)
    leftPanel.strokeRect(10, 50, 220, 420)
    leftPanel.lineStyle(1, 0xffffff, 1)
    leftPanel.strokeRect(12, 52, 216, 416)

    // Icono region grande (simulado con círculo + texto)
    const icon = this.add.graphics()
    icon.fillStyle(0xd4a860, 1)
    icon.fillCircle(120, 150, 50)
    icon.lineStyle(2, 0x000000, 1)
    icon.strokeCircle(120, 150, 50)
    icon.fillStyle(0xa87828, 1)
    icon.fillRect(100, 130, 40, 40)

    this.add.text(120, 280, 'REGIÓN', {
      font: 'bold 10px Arial',
      color: '#000000'
    }).setOrigin(0.5)

    this.add.text(120, 420, 'Selecciona', {
      font: 'bold 8px Arial',
      color: '#666666'
    }).setOrigin(0.5)

    // Panel derecho con lista
    const rightPanel = this.add.graphics()
    rightPanel.fillStyle(0xf0e8d8, 1)
    rightPanel.fillRect(240, 50, 550, 420)
    rightPanel.lineStyle(2, 0x000000, 1)
    rightPanel.strokeRect(240, 50, 550, 420)
    rightPanel.lineStyle(1, 0xffffff, 1)
    rightPanel.strokeRect(242, 52, 546, 416)

    // Encabezado lista
    const headerBg = this.add.graphics()
    headerBg.fillStyle(0xd0c8b8, 1)
    headerBg.fillRect(242, 52, 546, 25)
    headerBg.lineStyle(1, 0x000000, 1)
    headerBg.lineBetween(242, 77, 788, 77)

    this.add.text(255, 64, 'Región', {
      font: 'bold 10px Arial',
      color: '#000000'
    })

    this.add.text(750, 64, 'Cant', {
      font: 'bold 10px Arial',
      color: '#000000'
    }).setOrigin(1, 0.5)

    // Items/Regiones
    REGIONS.forEach((region, i) => {
      const y = 100 + i * 35
      const isSelected = i === this.selectedIdx

      // Fondo selección
      if (isSelected) {
        const selBg = this.add.graphics()
        selBg.fillStyle(0x6888d8, 1)
        selBg.fillRect(242, y - 8, 546, 30)
      }

      // Nombre
      this.add.text(255, y + 4, region.name, {
        font: `${isSelected ? 'bold' : ''} 10px Arial`,
        color: isSelected ? '#ffffff' : '#000000'
      })

      // Cantidad
      this.add.text(750, y + 4, 'x001', {
        font: `${isSelected ? 'bold' : ''} 10px Arial`,
        color: isSelected ? '#ffffff' : '#000000'
      }).setOrigin(1, 0)

      // Zona interactiva
      const zone = this.add.zone(242, y - 8, 546, 30)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })

      zone.on('pointerdown', () => {
        this.selectedIdx = i
        this.scene.restart()
      })
    })

    // Panel inferior con descripción
    const bottomPanel = this.add.graphics()
    bottomPanel.fillStyle(0x4878d8, 1)
    bottomPanel.fillRect(0, 470, 800, 130)
    bottomPanel.lineStyle(2, 0x000000, 1)
    bottomPanel.strokeRect(0, 470, 800, 130)

    this.add.text(20, 485, REGIONS[this.selectedIdx].name + ' - Región', {
      font: 'bold 11px Arial',
      color: '#ffff00'
    })

    this.add.text(20, 510, REGIONS[this.selectedIdx].description, {
      font: '10px Arial',
      color: '#ffffff',
      wordWrap: { width: 750 }
    })

    this.add.text(20, 560, 'Presiona ENTER o haz clic para seleccionar', {
      font: 'bold 9px Arial',
      color: '#88ff88'
    })

    // Teclado
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.selectRegion(REGIONS[this.selectedIdx].id)
    })

    this.input.keyboard?.on('keydown-UP', () => {
      if (this.selectedIdx > 0) {
        this.selectedIdx--
        this.scene.restart()
      }
    })

    this.input.keyboard?.on('keydown-DOWN', () => {
      if (this.selectedIdx < REGIONS.length - 1) {
        this.selectedIdx++
        this.scene.restart()
      }
    })
  }

  private selectRegion(regionId: number) {
    this.scene.start('StartScene', { regionId })
  }
}
