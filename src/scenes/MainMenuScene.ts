import Phaser from 'phaser'
import { REGIONS } from '../data/Regions'

export default class MainMenuScene extends Phaser.Scene {
  private selectedIdx: number = 0

  constructor() {
    super('MainMenuScene')
  }

  preload() {
    this.load.image('pokedex_bg', '/assets/pokedex.jpg')
  }

  create() {
    // Fondo imagen Pokédex
    this.add.image(400, 300, 'pokedex_bg').setOrigin(0.5, 0.5)

    // Superponer región seleccionada en el área de lista izquierda
    // (donde están los Pokémon en la imagen)
    const listStartY = 60
    const itemHeight = 45

    REGIONS.forEach((region, i) => {
      const y = listStartY + i * itemHeight
      const isSelected = i === this.selectedIdx

      // Fondo semi-transparente para selección
      if (isSelected) {
        const selBg = this.add.graphics()
        selBg.fillStyle(0x000000, 0.3)
        selBg.fillRoundedRect(20, y, 160, itemHeight - 5, 3)
      }

      // Nombre región (reemplaza nombre Pokémon)
      const nameText = this.add.text(30, y + 12, region.name, {
        font: `${isSelected ? 'bold' : ''} 11px Arial`,
        color: isSelected ? '#ffff00' : '#ffffff',
        stroke: isSelected ? '#000000' : '#333333',
        strokeThickness: 2
      })

      // Número/ID región
      this.add.text(150, y + 12, `Nv. ${region.id}`, {
        font: `${isSelected ? 'bold' : ''} 9px Arial`,
        color: isSelected ? '#ffff00' : '#cccccc',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(1, 0)

      // Zona interactiva
      const zone = this.add.zone(20, y, 160, itemHeight)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })

      zone.on('pointerdown', () => {
        this.selectedIdx = i
        this.scene.restart()
      })
    })

    // Mostrar información región en el área derecha (donde está Pokémon)
    const selectedRegion = REGIONS[this.selectedIdx]

    // Nombre grande
    this.add.text(510, 120, selectedRegion.name, {
      font: 'bold 20px Arial',
      color: '#000000',
      stroke: '#ffffff',
      strokeThickness: 3
    }).setOrigin(0.5)

    // Descripción
    this.add.text(510, 160, selectedRegion.description, {
      font: 'bold 11px Arial',
      color: '#333333',
      stroke: '#ffffff',
      strokeThickness: 1,
      wordWrap: { width: 200 },
      align: 'center'
    }).setOrigin(0.5)

    // Botón confirmar
    const confirmBtn = this.add.text(510, 240, '▶ EMPEZAR', {
      font: 'bold 13px Arial',
      color: '#ffffff',
      backgroundColor: '#ff0000',
      padding: { x: 25, y: 10 }
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
