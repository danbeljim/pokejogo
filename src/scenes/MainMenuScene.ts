import Phaser from 'phaser'
import { PokedexMenu } from '../ui/PokedexMenu'

export default class MainMenuScene extends Phaser.Scene {
  private pokedexMenu: PokedexMenu | null = null

  constructor() {
    super('MainMenuScene')
  }

  create() {
    // Crear menú Pokédex HTML/CSS
    this.pokedexMenu = new PokedexMenu((regionId) => {
      this.selectRegion(regionId)
    })
  }

  shutdown() {
    if (this.pokedexMenu) {
      this.pokedexMenu.remove()
    }
  }

  private selectRegion(regionId: number) {
    if (this.pokedexMenu) {
      this.pokedexMenu.remove()
      this.pokedexMenu = null
    }
    this.scene.start('StartScene', { regionId })
  }
}

