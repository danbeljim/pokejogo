import Phaser from 'phaser'
import { EventResult } from '../managers/EventManager'

export default class EventPopup {
  private scene: Phaser.Scene
  private container?: Phaser.GameObjects.Container
  private visible: boolean = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  show(result: EventResult, onClose: () => void) {
    if (this.visible) return

    const graphics = this.scene.make.graphics({ add: false })
    graphics.fillStyle(0x000000, 0.8)
    graphics.fillRect(0, 0, 800, 600)
    graphics.generateTexture('popup-bg', 800, 600)
    graphics.destroy()

    const bg = this.scene.add.image(400, 300, 'popup-bg')

    const title = this.scene.add.text(400, 150, result.type.toUpperCase(), {
      font: 'bold 24px Arial',
      color: '#FFD700'
    }).setOrigin(0.5)

    const message = this.scene.add.text(400, 250, result.message, {
      font: '18px Arial',
      color: '#FFFFFF',
      wordWrap: { width: 600 }
    }).setOrigin(0.5)

    const continueText = this.scene.add.text(400, 450, 'Press SPACE to continue', {
      font: '14px Arial',
      color: '#CCCCCC'
    }).setOrigin(0.5)

    this.container = this.scene.add.container(0, 0, [bg, title, message, continueText])
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
