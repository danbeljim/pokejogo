const Phaser = require('phaser')

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  preload() {
    // Preload assets here if needed
  }

  async create() {
    // Fetch first Pokemon data from PokéAPI
    const pokeId = 1 // Bulbasaur
    const pokemonData = await this.fetchPokemon(pokeId)

    // Get sprite
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/pokemon/other/official-artwork/${pokeId}.png`

    // Load sprite dynamically
    this.textures.once('addtexture', () => {
      const pokemon = this.add.image(400, 300, `pokemon-${pokeId}`)
      pokemon.setScale(2)
    })

    this.load.image(`pokemon-${pokeId}`, spriteUrl)
    this.load.start()

    // Display Pokemon info
    this.add.text(50, 50, `Pokémon: ${pokemonData.name}`, {
      fontSize: '20px',
      fill: '#ffffff'
    })
  }

  async fetchPokemon(id) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    return response.json()
  }

  update() {
    // Game loop updates
  }
}

module.exports = GameScene
