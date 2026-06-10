import Phaser from 'phaser'

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  preload() {
    // Empty
  }

  async create() {
    // Mundo 2000x2000
    this.physics.world.setBounds(0, 0, 2000, 2000)

    // Fondo
    this.add.rectangle(1000, 1000, 2000, 2000, 0x2d5016)

    // Crear player como rectángulo visible
    this.player = this.add.rectangle(400, 300, 32, 32, 0xff0000)
    this.player.speed = 160

    // Camera sigue player
    this.cameras.main.setBounds(0, 0, 2000, 2000)
    this.cameras.main.startFollow(this.player)

    // Input mouse
    this.targetPos = { x: this.player.x, y: this.player.y }
    this.input.on('pointerdown', (pointer) => {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
      this.targetPos = { x: worldPoint.x, y: worldPoint.y }
      console.log('Click target:', this.targetPos)
    })

    // UI overlay con posición
    this.posText = this.add.text(10, 10, '', {
      fontSize: '16px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 }
    }).setScrollFactor(0)

    // Pokémon wild
    await this.spawnWildPokemon()
  }

  createPlayerTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(0, 0, 32, 32)
    ctx.fillStyle = '#0000ff'
    ctx.fillRect(8, 8, 16, 16)
    this.textures.addCanvas('player', canvas)
  }

  async spawnWildPokemon() {
    try {
      const randomId = Math.floor(Math.random() * 151) + 1
      const pokemonData = await this.fetchPokemon(randomId)
      const spriteUrl = pokemonData.sprites.other['official-artwork']?.front_default

      if (spriteUrl) {
        await this.loadSpriteTexture(randomId, spriteUrl)
        const wildPokemon = this.physics.add.sprite(800, 600, `pokemon-${randomId}`)
        wildPokemon.setScale(2)
        wildPokemon.setData('id', randomId)
        wildPokemon.setData('name', pokemonData.name)
        this.wildPokemon = wildPokemon
      }
    } catch (error) {
      console.error('Error spawning wild pokemon:', error)
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
    if (!this.player || !this.targetPos) return

    const speed = 2
    const dx = this.targetPos.x - this.player.x
    const dy = this.targetPos.y - this.player.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    console.log('Distance:', distance, 'Target:', this.targetPos, 'Player:', { x: this.player.x, y: this.player.y })

    if (distance > speed) {
      const newX = this.player.x + (dx / distance) * speed
      const newY = this.player.y + (dy / distance) * speed

      const clampedX = Phaser.Math.Clamp(newX, 16, 2000 - 16)
      const clampedY = Phaser.Math.Clamp(newY, 16, 2000 - 16)

      this.player.setPosition(clampedX, clampedY)
    }

    // Update UI
    this.posText.setText(`X: ${Math.round(this.player.x)} Y: ${Math.round(this.player.y)}`)
  }
}

export default GameScene
