import Phaser from 'phaser'
import { REGIONS } from '../data/Regions'

export default class MainMenuScene extends Phaser.Scene {
  private selectedIdx: number = 0

  constructor() {
    super('MainMenuScene')
  }

  create() {
    // Fondo gris claro
    const bg = this.add.graphics()
    bg.fillStyle(0xd0d0d0, 1)
    bg.fillRect(0, 0, 800, 600)
    bg.destroy()

    // Panel superior con logo
    const topBar = this.add.graphics()
    topBar.fillStyle(0xf8a830, 1)
    topBar.fillRect(0, 0, 800, 35)
    topBar.lineStyle(2, 0x000000, 1)
    topBar.strokeRect(0, 0, 800, 35)

    // Logo
    this.add.text(15, 8, '🔵 REGIONES', {
      font: 'bold 16px Arial',
      color: '#000000'
    })

    // Panel principal izquierda (lista)
    const leftPanel = this.add.graphics()
    leftPanel.fillStyle(0xf0e8d8, 1)
    leftPanel.fillRect(10, 45, 340, 450)
    leftPanel.lineStyle(2, 0x000000, 1)
    leftPanel.strokeRect(10, 45, 340, 450)

    // Encabezado lista
    const headerBg = this.add.graphics()
    headerBg.fillStyle(0xd0c8b8, 1)
    headerBg.fillRect(10, 45, 340, 25)
    headerBg.lineStyle(1, 0x000000, 1)
    headerBg.lineBetween(10, 70, 350, 70)

    this.add.text(20, 52, 'Región', {
      font: 'bold 10px Arial',
      color: '#000000'
    })

    // Lista regiones
    REGIONS.forEach((region, i) => {
      const y = 80 + i * 45
      const isSelected = i === this.selectedIdx

      // Fondo selección
      if (isSelected) {
        const selBg = this.add.graphics()
        selBg.fillStyle(0x4878d8, 1)
        selBg.fillRect(12, y - 3, 336, 40)
      }

      // Nombre región
      this.add.text(25, y + 5, region.name, {
        font: `${isSelected ? 'bold' : ''} 11px Arial`,
        color: isSelected ? '#ffffff' : '#000000'
      })

      // Icono tipo (círculo pequeño)
      const icon = this.add.graphics()
      icon.fillStyle(0x4488ff, 1)
      icon.fillCircle(305, y + 10, 6)

      // Número
      this.add.text(315, y + 5, `Nv. ${region.id}`, {
        font: `${isSelected ? 'bold' : ''} 9px Arial`,
        color: isSelected ? '#ffffff' : '#666666'
      })

      // Línea separadora
      const line = this.add.graphics()
      line.lineStyle(1, isSelected ? 0x3860d8 : 0xcccccc, 1)
      line.lineBetween(12, y + 40, 346, y + 40)

      // Zona interactiva
      const zone = this.add.zone(12, y - 3, 336, 40)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })

      zone.on('pointerdown', () => {
        this.selectedIdx = i
        this.scene.restart()
      })
    })

    // Panel derecho (información)
    const rightPanel = this.add.graphics()
    rightPanel.fillStyle(0xf0f8f8, 1)
    rightPanel.fillRect(360, 45, 430, 450)
    rightPanel.lineStyle(2, 0x000000, 1)
    rightPanel.strokeRect(360, 45, 430, 450)

    // Área ilustración (azul claro)
    const illuArea = this.add.graphics()
    illuArea.fillStyle(0xd8e8f8, 1)
    illuArea.fillRect(375, 65, 400, 180)
    illuArea.lineStyle(1, 0xcccccc, 1)
    illuArea.strokeRect(375, 65, 400, 180)

    // Ilustración simulada (círculos)
    const ill1 = this.add.graphics()
    ill1.fillStyle(0x88cc88, 1)
    ill1.fillCircle(520, 130, 45)
    ill1.fillStyle(0x88bb88, 1)
    ill1.fillCircle(535, 150, 30)

    // Nombre región grande
    this.add.text(575, 265, REGIONS[this.selectedIdx].name, {
      font: 'bold 18px Arial',
      color: '#000000'
    }).setOrigin(0.5)

    // Descripción
    this.add.text(380, 295, REGIONS[this.selectedIdx].description, {
      font: 'bold 10px Arial',
      color: '#333333',
      wordWrap: { width: 400 },
      align: 'center'
    })

    // Botones inferiores
    const btnArea = this.add.graphics()
    btnArea.fillStyle(0xf0f8f8, 1)
    btnArea.fillRect(360, 500, 430, 95)
    btnArea.lineStyle(2, 0x000000, 1)
    btnArea.strokeRect(360, 500, 430, 95)

    // Botón Confirmar
    const confirmBtn = this.add.text(575, 525, '✓ Confirmar', {
      font: 'bold 12px Arial',
      color: '#ffffff',
      backgroundColor: '#ff6b00',
      padding: { x: 20, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    confirmBtn.on('pointerdown', () => {
      this.selectRegion(REGIONS[this.selectedIdx].id)
    })

    confirmBtn.on('pointerover', () => {
      confirmBtn.setScale(1.08)
    })

    confirmBtn.on('pointerout', () => {
      confirmBtn.setScale(1)
    })

    // Instrucciones
    this.add.text(375, 560, 'A: Confirmar  ↑↓: Seleccionar', {
      font: '9px Arial',
      color: '#666666'
    })

    // Teclado
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

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.selectRegion(REGIONS[this.selectedIdx].id)
    })
  }

  private selectRegion(regionId: number) {
    this.scene.start('StartScene', { regionId })
  }
}
