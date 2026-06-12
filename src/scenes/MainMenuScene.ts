import Phaser from 'phaser'
import { REGIONS } from '../data/Regions'

export default class MainMenuScene extends Phaser.Scene {
  private selectedIdx: number = 0
  private selectionBoxes: { bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text[] }[] = []

  constructor() {
    super('MainMenuScene')
  }

  create() {
    // Fondo estilo Pokémon Gen 2/3
    const bg = this.add.graphics()
    bg.fillStyle(0x3860d8, 1)
    bg.fillRect(0, 0, 800, 600)
    bg.destroy()

    // Panel superior beige
    const topPanel = this.add.graphics()
    topPanel.fillStyle(0xd8c8a8, 1)
    topPanel.fillRect(8, 8, 784, 120)
    topPanel.lineStyle(3, 0x000000, 1)
    topPanel.strokeRect(8, 8, 784, 120)

    // Inner border
    topPanel.lineStyle(1, 0xffffff, 1)
    topPanel.strokeRect(10, 10, 780, 116)

    // Título elegante
    this.add.text(20, 20, 'POKÉMON ROGUELIKE', {
      font: 'bold 16px Arial',
      color: '#000000'
    })

    this.add.text(20, 45, 'Elige tu región:', {
      font: 'bold 12px Arial',
      color: '#000000'
    })

    // Subtítulo
    this.add.text(20, 65, 'Pasa para ver las opciones disponibles', {
      font: '9px Arial',
      color: '#333333'
    })

    // Panel izquierdo (icono)
    const iconPanel = this.add.graphics()
    iconPanel.fillStyle(0xe8d0b8, 1)
    iconPanel.fillRect(8, 136, 160, 456)
    iconPanel.lineStyle(3, 0x000000, 1)
    iconPanel.strokeRect(8, 136, 160, 456)
    iconPanel.lineStyle(1, 0xffffff, 1)
    iconPanel.strokeRect(10, 138, 156, 452)

    // Pokéball grande decorativo
    const pokeBall = this.add.graphics()
    pokeBall.fillStyle(0xff0000, 1)
    pokeBall.fillCircle(88, 200, 40)
    pokeBall.fillStyle(0xffffff, 1)
    pokeBall.fillCircle(88, 200, 35)
    pokeBall.fillStyle(0x000000, 1)
    pokeBall.fillCircle(88, 200, 30)
    pokeBall.fillStyle(0xffffff, 1)
    pokeBall.fillCircle(88, 200, 25)
    pokeBall.fillStyle(0xff0000, 1)
    pokeBall.fillCircle(88, 200, 15)

    this.add.text(88, 280, 'REGIONES', {
      font: 'bold 9px Arial',
      color: '#000000',
      align: 'center',
      wordWrap: { width: 140 }
    }).setOrigin(0.5)

    this.add.text(88, 530, 'Roguelike', {
      font: 'bold 10px Arial',
      color: '#000000'
    }).setOrigin(0.5)

    // Panel derecho (lista)
    const listPanel = this.add.graphics()
    listPanel.fillStyle(0xf8ead8, 1)
    listPanel.fillRect(176, 136, 616, 456)
    listPanel.lineStyle(3, 0x000000, 1)
    listPanel.strokeRect(176, 136, 616, 456)
    listPanel.lineStyle(1, 0xffffff, 1)
    listPanel.strokeRect(178, 138, 612, 452)

    // Título lista
    this.add.text(188, 150, '- Regiones -', {
      font: 'bold 11px Arial',
      color: '#000000'
    })

    // Línea separadora
    const sep = this.add.graphics()
    sep.lineStyle(1, 0x000000, 1)
    sep.lineBetween(188, 165, 588, 165)

    // Regiones como items seleccionables
    REGIONS.forEach((region, i) => {
      const y = 185 + i * 60
      const isSelected = i === this.selectedIdx

      // Caja de fondo
      const itemBg = this.add.graphics()
      if (isSelected) {
        itemBg.fillStyle(0x5878d8, 1)
      } else {
        itemBg.fillStyle(0xe8dcc8, 1)
      }
      itemBg.fillRoundedRect(188, y - 8, 400, 50, 2)
      if (isSelected) {
        itemBg.lineStyle(2, 0x000000, 1)
        itemBg.strokeRoundedRect(188, y - 8, 400, 50, 2)
      }

      // Nombre región
      const nameText = this.add.text(200, y + 5, region.name, {
        font: `bold ${isSelected ? 12 : 11}px Arial`,
        color: isSelected ? '#ffffff' : '#000000'
      })

      // Cantidad
      const qtyText = this.add.text(585, y + 5, 'x001', {
        font: `${isSelected ? 'bold' : ''} 10px Arial`,
        color: isSelected ? '#ffffff' : '#000000'
      }).setOrigin(1, 0)

      // Descripción (pequeña)
      const descText = this.add.text(200, y + 20, region.description, {
        font: `${isSelected ? 'bold' : ''} 9px Arial`,
        color: isSelected ? '#e8e8e8' : '#666666'
      })

      // Zona interactiva
      const zone = this.add.zone(188, y + 17, 400, 50)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })

      zone.on('pointerdown', () => {
        this.selectedIdx = i
        this.updateSelection()
      })

      this.selectionBoxes.push({ bg: itemBg, text: [nameText, qtyText, descText] })
    })

    // Panel inferior
    const bottomPanel = this.add.graphics()
    bottomPanel.fillStyle(0x3860d8, 1)
    bottomPanel.fillRect(0, 592, 800, 8)

    // Botón info
    const infoText = this.add.text(400, 555, 'Presiona ENTER o haz clic en una región', {
      font: '9px Arial',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5)

    // Input
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.selectRegion(REGIONS[this.selectedIdx].id)
    })

    this.input.keyboard?.on('keydown-UP', () => {
      if (this.selectedIdx > 0) {
        this.selectedIdx--
        this.updateSelection()
      }
    })

    this.input.keyboard?.on('keydown-DOWN', () => {
      if (this.selectedIdx < REGIONS.length - 1) {
        this.selectedIdx++
        this.updateSelection()
      }
    })
  }

  private updateSelection() {
    this.selectionBoxes.forEach((box, i) => {
      const isSelected = i === this.selectedIdx
      box.bg.clear()
      if (isSelected) {
        box.bg.fillStyle(0x5878d8, 1)
        box.bg.fillRoundedRect(188, 185 + i * 60 - 8, 400, 50, 2)
        box.bg.lineStyle(2, 0x000000, 1)
        box.bg.strokeRoundedRect(188, 185 + i * 60 - 8, 400, 50, 2)

        box.text.forEach(t => {
          if (t.text.includes('x001')) {
            t.setColor('#ffffff')
            t.setFontStyle('bold')
          } else if (t.text === REGIONS[i].name) {
            t.setColor('#ffffff')
            t.setFontSize(12)
            t.setFontStyle('bold')
          } else {
            t.setColor('#e8e8e8')
            t.setFontStyle('bold')
          }
        })
      } else {
        box.bg.fillStyle(0xe8dcc8, 1)
        box.bg.fillRoundedRect(188, 185 + i * 60 - 8, 400, 50, 2)

        box.text.forEach(t => {
          t.setColor(t.text.includes('x') ? '#000000' : (t.text === REGIONS[i].name ? '#000000' : '#666666'))
          t.setFontStyle('normal')
          if (t.text === REGIONS[i].name) {
            t.setFontSize(11)
          }
        })
      }
    })
  }

  private selectRegion(regionId: number) {
    this.scene.start('StartScene', { regionId })
  }
}
