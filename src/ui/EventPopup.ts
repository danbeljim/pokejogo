import Phaser from 'phaser'
import { EventResult } from '../managers/EventManager'
import { spriteKey } from '../entities/PokemonFactory'

export default class EventPopup {
  private scene: Phaser.Scene
  private container?: Phaser.GameObjects.Container
  private visible: boolean = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  show(result: EventResult, onClose: () => void) {
    if (this.visible) return

    const graphics = this.scene.make.graphics({})
    graphics.fillStyle(0x000000, 0.8)
    graphics.fillRect(0, 0, 800, 600)
    graphics.generateTexture('popup-bg', 800, 600)
    graphics.destroy()

    const bg = this.scene.add.image(400, 300, 'popup-bg')

    const typeLabel: Record<string, string> = {
      capture: 'CAPTURA',
      trainer: 'ENTRENADOR',
      wild: 'SALVAJE',
      item: 'OBJETO',
      boss: 'LÍDER DE GIMNASIO'
    }
    const title = this.scene.add.text(400, 150, typeLabel[result.type] || result.type.toUpperCase(), {
      font: 'bold 24px Arial',
      color: '#FFD700'
    }).setOrigin(0.5)

    const message = this.scene.add.text(400, 250, result.message, {
      font: '18px Arial',
      color: '#FFFFFF',
      wordWrap: { width: 600 }
    }).setOrigin(0.5)

    const continueText = this.scene.add.text(400, 450, 'Pulsa ESPACIO para continuar', {
      font: '14px Arial',
      color: '#CCCCCC'
    }).setOrigin(0.5)

    const items: Phaser.GameObjects.GameObject[] = [bg, title, message, continueText]

    // Show sprite for caught or enemy pokemon
    const dexId = result.pokemonCaught?.id || result.enemyTeam?.[0]?.id
    if (dexId) {
      const key = spriteKey(dexId, false)
      if (this.scene.textures.exists(key)) {
        const sprite = this.scene.add.image(400, 350, key)
        sprite.setDisplaySize(120, 120)
        items.push(sprite)
      }
    }

    this.container = this.scene.add.container(0, 0, items)
    this.visible = true

    const spaceKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    const handler = () => {
      this.close()
      spaceKey?.removeListener('down', handler)
      onClose()
    }
    spaceKey?.on('down', handler)
  }

  close() {
    if (this.container) {
      this.container.destroy()
    }
    this.visible = false
  }

  isVisible(): boolean {
    return this.visible
  }
}
