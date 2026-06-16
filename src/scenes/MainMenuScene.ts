import Phaser from 'phaser'
import { PokedexMenu } from '../ui/PokedexMenu'

export default class MainMenuScene extends Phaser.Scene {
  private pokedexMenu: PokedexMenu | null = null
  private savePromptContainer: Phaser.GameObjects.Container | null = null

  constructor() {
    super('MainMenuScene')
  }

  preload() {
    if (!this.textures.exists('oak')) {
      this.load.image('oak', '/assets/trainers/oak.webp')
    }
  }

  create() {
    const hasSavedGame = this.registry.get('hasSavedGame') === true

    if (hasSavedGame) {
      this.showSavePrompt()
    } else {
      this.showRegionMenu()
    }
  }

  private showSavePrompt() {
    const W = this.scale.width
    const H = this.scale.height
    const cx = W / 2
    const cy = H / 2

    const bg = this.add.rectangle(cx, cy, W, H, 0x000000, 0.85)

    const subtitle = this.add.text(cx, cy - 60, '¿Qué deseas hacer?', {
      fontFamily: '"Press Start 2P"', fontSize: '20px', color: '#ffffff'
    }).setOrigin(0.5)

    const btnContinue = this.add.text(cx, cy + 20, '▶  Continuar', {
      fontFamily: '"Press Start 2P"', fontSize: '18px', color: '#FFD700',
      backgroundColor: '#1a1a2e', padding: { x: 24, y: 14 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    btnContinue.on('pointerover', () => btnContinue.setColor('#ffffff'))
    btnContinue.on('pointerout', () => btnContinue.setColor('#FFD700'))
    btnContinue.on('pointerdown', () => {
      this.scene.start('GameScene')
    })

    const btnNew = this.add.text(cx, cy + 100, '✦  Nueva partida', {
      fontFamily: '"Press Start 2P"', fontSize: '18px', color: '#ff6666',
      backgroundColor: '#1a1a2e', padding: { x: 24, y: 14 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    btnNew.on('pointerover', () => btnNew.setColor('#ffffff'))
    btnNew.on('pointerout', () => btnNew.setColor('#ff6666'))
    btnNew.on('pointerdown', () => {
      this.registry.set('hasSavedGame', false)
      this.cleanUp()
      this.showRegionMenu()
    })

    const items: Phaser.GameObjects.GameObject[] = [bg, subtitle, btnContinue, btnNew]

    if (this.textures.exists('oak')) {
      const oak = this.add.image(cx * 0.38, cy + 40, 'oak')
      const targetH = H * 0.55
      oak.setDisplaySize((oak.width / oak.height) * targetH, targetH)
      items.push(oak)
    }

    this.savePromptContainer = this.add.container(0, 0, items)
  }

  private showRegionMenu() {
    this.pokedexMenu = new PokedexMenu(
      (regionId) => this.selectRegion(regionId),
      () => this.selectRoguelike()
    )
  }

  private selectRoguelike() {
    if (this.pokedexMenu) {
      this.pokedexMenu.remove()
      this.pokedexMenu = null
    }
    this.registry.set('gameMode', 'roguelike')
    this.scene.start('StartScene', { regionId: 1, newGame: true, gameMode: 'roguelike' })
  }

  private cleanUp() {
    if (this.savePromptContainer) {
      this.savePromptContainer.destroy()
      this.savePromptContainer = null
    }
  }

  shutdown() {
    this.cleanUp()
    if (this.pokedexMenu) {
      this.pokedexMenu.remove()
      this.pokedexMenu = null
    }
    if (this.scene.isActive('WorldMapScene')) {
      this.scene.stop('WorldMapScene')
    }
  }

  private selectRegion(regionId: number) {
    if (this.pokedexMenu) {
      this.pokedexMenu.remove()
      this.pokedexMenu = null
    }
    this.registry.set('gameMode', 'normal')
    this.registry.set('trainerClass', null)
    this.scene.start('StartScene', { regionId, newGame: true, gameMode: 'normal' })
  }
}
