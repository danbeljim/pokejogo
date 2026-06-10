import Phaser from 'phaser'

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  preload() {
    // Empty - fetch happens in create
  }

  async create() {
    const pokeId = 1

    try {
      const pokemonData = await this.fetchPokemon(pokeId)
      const spriteUrl = pokemonData.sprites.other['official-artwork']?.front_default

      // Display info primero
      this.add.text(50, 50, `Pokémon: ${pokemonData.name.toUpperCase()}`, {
        fontSize: '24px',
        fill: '#ffffff',
        fontStyle: 'bold'
      })

      this.add.text(50, 100, `ID: ${pokeId}`, {
        fontSize: '16px',
        fill: '#ffffff'
      })

      if (spriteUrl) {
        // Load sprite después
        await this.loadSpriteTexture(pokeId, spriteUrl)
        const pokemon = this.add.image(400, 250, `pokemon-${pokeId}`)
        pokemon.setScale(2)
      }
    } catch (error) {
      this.add.text(50, 50, `Error: ${error.message}`, {
        fontSize: '16px',
        fill: '#ff0000'
      })
    }
  }

  async loadSpriteTexture(id, url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        this.textures.addCanvas(`pokemon-${id}`, canvas)
        resolve()
      }
      img.onerror = () => reject(new Error('Failed to load sprite'))
      img.src = url
    })
  }

  async fetchPokemon(id) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    return response.json()
  }

  update() {
    // Game loop
  }
}

export default GameScene
