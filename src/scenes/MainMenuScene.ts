import Phaser from 'phaser'
import { REGIONS } from '../data/Regions'

export default class MainMenuScene extends Phaser.Scene {
  private selectedIdx: number = 0

  constructor() {
    super('MainMenuScene')
  }

  create() {
    // Fondo: rojo izquierda, blanco/gris derecha
    const bgLeft = this.add.graphics()
    bgLeft.fillStyle(0xff1a2e, 1)
    bgLeft.fillRect(0, 0, 400, 600)

    const bgRight = this.add.graphics()
    bgRight.fillStyle(0xe8f0f8, 1)
    bgRight.fillRect(400, 0, 400, 600)

    // Diagonal decorativa
    const diag = this.add.graphics()
    diag.fillStyle(0xff1a2e, 0.3)
    diag.beginPath()
    diag.moveTo(350, 0)
    diag.lineTo(450, 0)
    diag.lineTo(400, 600)
    diag.lineTo(300, 600)
    diag.closePath()
    diag.fillPath()

    // Logo/Título
    this.add.text(30, 20, '🎮 REGIONES', {
      font: 'bold 24px Arial',
      color: '#ffffff'
    })

    // Contador región
    this.add.text(30, 55, `${this.selectedIdx + 1}/${REGIONS.length}`, {
      font: 'bold 14px Arial',
      color: '#ffffff'
    })

    // Lista de regiones (lado izquierdo)
    REGIONS.forEach((region, i) => {
      const y = 100 + i * 70
      const isSelected = i === this.selectedIdx

      // Caja región
      const boxBg = this.add.graphics()
      if (isSelected) {
        boxBg.fillStyle(0x000000, 1)
        boxBg.fillRoundedRect(20, y, 360, 60, 8)
      } else {
        boxBg.fillStyle(0xffffff, 1)
        boxBg.fillRoundedRect(20, y, 360, 60, 8)
        boxBg.lineStyle(2, 0x000000, 1)
        boxBg.strokeRoundedRect(20, y, 360, 60, 8)
      }

      // Nombre
      this.add.text(35, y + 10, region.name, {
        font: `bold 14px Arial`,
        color: isSelected ? '#ffff00' : '#000000'
      })

      // Badge/círculo color (simulado)
      const badge = this.add.graphics()
      badge.fillStyle(0x4488ff, 1)
      badge.fillCircle(350, y + 30, 8)

      // Número
      this.add.text(35, y + 35, `Nv. ${region.id}`, {
        font: 'bold 11px Arial',
        color: isSelected ? '#ffffff' : '#666666'
      })

      // Zona interactiva
      const zone = this.add.zone(20, y, 360, 60)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })

      zone.on('pointerdown', () => {
        this.selectedIdx = i
        this.scene.restart()
      })
    })

    // Panel derecho: información región
    const infoBg = this.add.graphics()
    infoBg.fillStyle(0xffffff, 1)
    infoBg.fillRoundedRect(420, 80, 360, 240, 10)
    infoBg.lineStyle(3, 0x000000, 1)
    infoBg.strokeRoundedRect(420, 80, 360, 240, 10)

    // Ilustración (simulada con degradado)
    const illBg = this.add.graphics()
    illBg.fillStyle(0xb8d8e8, 1)
    illBg.fillCircle(600, 150, 60)
    illBg.fillStyle(0x88c8e8, 1)
    illBg.fillCircle(620, 170, 40)

    // Nombre región grande
    this.add.text(600, 230, REGIONS[this.selectedIdx].name, {
      font: 'bold 18px Arial',
      color: '#000000'
    }).setOrigin(0.5)

    // Descripción
    this.add.text(440, 260, REGIONS[this.selectedIdx].description, {
      font: '11px Arial',
      color: '#333333',
      wordWrap: { width: 320 }
    })

    // Panel inferior: botones
    const btnBg = this.add.graphics()
    btnBg.fillStyle(0xffffff, 1)
    btnBg.fillRect(420, 340, 360, 240)
    btnBg.lineStyle(3, 0x000000, 1)
    btnBg.strokeRect(420, 340, 360, 240)

    // Botón Confirmar
    const confirmBtn = this.add.text(600, 380, '✓ Confirmar', {
      font: 'bold 14px Arial',
      color: '#ffffff',
      backgroundColor: '#ff1a2e',
      padding: { x: 30, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    confirmBtn.on('pointerdown', () => {
      this.selectRegion(REGIONS[this.selectedIdx].id)
    })

    confirmBtn.on('pointerover', () => {
      confirmBtn.setScale(1.1)
    })

    confirmBtn.on('pointerout', () => {
      confirmBtn.setScale(1)
    })

    // Info botones
    this.add.text(600, 470, '↑ ↓ Navegar / ENTER Confirmar', {
      font: 'bold 10px Arial',
      color: '#666666',
      align: 'center'
    }).setOrigin(0.5)

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
