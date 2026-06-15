import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'
import { BRANCH_EVOLUTIONS, EvolutionTarget } from '../data/Evolution'
import { spriteKey } from '../entities/PokemonFactory'
import { TYPE_COLORS } from '../data/Types'

export interface EvoPickerSceneData {
  pokemon: Pokemon
  onComplete: () => void
}

export default class EvoPickerScene extends Phaser.Scene {
  private payload!: EvoPickerSceneData

  constructor() { super('EvoPickerScene') }

  init(data: EvoPickerSceneData) {
    this.payload = data
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a2a')
    const { pokemon } = this.payload
    const branch = BRANCH_EVOLUTIONS[pokemon.id]
    if (!branch) { this.finish(); return }

    const W = this.scale.width
    const H = this.scale.height
    const cx = W / 2

    this.add.text(cx, H * 0.07, `¡${pokemon.name} quiere evolucionar!`, {
      font: `bold ${Math.round(H * 0.034)}px Arial`,
      color: '#FFD700'
    }).setOrigin(0.5)

    this.add.text(cx, H * 0.14, 'Elige su evolución:', {
      font: `${Math.round(H * 0.024)}px Arial`,
      color: '#ffffff'
    }).setOrigin(0.5)

    const options = branch.options
    const cardW = Math.min(W * 0.27, 180)
    const gap = (W - options.length * cardW) / (options.length + 1)

    options.forEach((evo, i) => {
      const x = gap + cardW / 2 + i * (cardW + gap)
      const y = H * 0.52
      this.createEvoCard(x, y, cardW, evo, pokemon)
    })
  }

  private createEvoCard(cx: number, cy: number, cardW: number, evo: EvolutionTarget, fromPokemon: Pokemon) {
    const H = this.scale.height
    const cardH = cardW * 1.5
    const color = TYPE_COLORS[evo.toType] || '#555555'
    const numColor = parseInt(color.replace('#', ''), 16)

    const bg = this.add.rectangle(cx, cy, cardW, cardH, numColor, 0.4)
      .setInteractive({ useHandCursor: true })
    this.add.rectangle(cx, cy, cardW, cardH).setStrokeStyle(2, numColor)

    const sprKey = spriteKey(evo.toDexId, false)
    if (this.textures.exists(sprKey)) {
      const img = this.add.image(cx, cy - cardH * 0.12, sprKey)
      const scale = Math.min((cardW * 0.75) / img.width, (cardH * 0.5) / img.height)
      img.setScale(scale)
    }

    this.add.text(cx, cy + cardH * 0.32, evo.toName, {
      font: `bold ${Math.round(H * 0.025)}px Arial`,
      color: '#ffffff'
    }).setOrigin(0.5)

    this.add.text(cx, cy + cardH * 0.44, evo.toType.toUpperCase(), {
      font: `${Math.round(H * 0.018)}px Arial`,
      color: color
    }).setOrigin(0.5)

    bg.on('pointerover', () => bg.setAlpha(0.7))
    bg.on('pointerout', () => bg.setAlpha(0.4))
    bg.on('pointerdown', () => {
      const prevName = fromPokemon.applyEvoChoice(evo.toDexId, evo.toName, evo.toType)
      console.log(`${prevName} evolucionó a ${evo.toName}!`)
      this.finish()
    })
  }

  private finish() {
    this.scene.stop()
    this.payload.onComplete()
  }
}
