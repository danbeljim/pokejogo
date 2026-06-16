import Phaser from 'phaser'
import { getStarters, spriteKey, spriteUrl } from '../entities/PokemonFactory'
import { TYPE_COLORS } from '../data/Types'
import { TRAINER_CLASSES, TrainerClass } from '../data/RoguelikeData'
import { StarterMenu } from '../ui/StarterMenu'

export interface StartSceneData {
  regionId: number
  newGame?: boolean
  gameMode?: string
}

export default class StartScene extends Phaser.Scene {
  private newGame: boolean = true
  private gameMode: string = 'normal'
  private starterCards: Phaser.GameObjects.Container[] = []
  private classOverlay?: Phaser.GameObjects.Container
  private starterMenu?: StarterMenu

  constructor() {
    super('StartScene')
  }

  init(data: StartSceneData) {
    this.newGame = data?.newGame !== false
    this.gameMode = data?.gameMode || this.registry.get('gameMode') || 'normal'
    this.registry.set('gameMode', this.gameMode)
    if (this.gameMode !== 'roguelike') {
      this.registry.set('trainerClass', null)
    }
  }

  preload() {}

  create() {
    const starters = getStarters()
    this.starterMenu = new StarterMenu(starters, (dexId) => {
      if (this.starterMenu) { this.starterMenu.remove(); this.starterMenu = undefined }
      if (this.gameMode === 'roguelike') {
        this.showClassPicker(dexId)
      } else {
        this.scene.start('GameScene', { starterDexId: dexId, newGame: this.newGame })
      }
    })
  }

  shutdown() {
    if (this.starterMenu) { this.starterMenu.remove(); this.starterMenu = undefined }
  }

  private showClassPicker(starterDexId: number) {
    const W = this.scale.width
    const H = this.scale.height
    const cx = W / 2

    // Fade out starter cards
    this.starterCards.forEach(c => {
      this.tweens.add({ targets: c, alpha: 0, duration: 250 })
    })

    this.time.delayedCall(260, () => {
      this.starterCards.forEach(c => c.setVisible(false))
      this.renderClassPicker(starterDexId, W, H, cx)
    })
  }

  private renderClassPicker(starterDexId: number, W: number, H: number, cx: number) {
    const overlay = this.add.container(0, 0)
    this.classOverlay = overlay

    overlay.add(this.add.text(cx, H * 0.27, 'Elige tu Clase de Entrenador:', {
      font: `bold ${Math.round(H * 0.032)}px Arial`,
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5))

    const cardW = Math.round(W * 0.17)
    const cardH = Math.round(H * 0.36)
    const totalSpread = cardW * TRAINER_CLASSES.length + Math.round(W * 0.025) * (TRAINER_CLASSES.length - 1)
    const startX = cx - totalSpread / 2 + cardW / 2
    const gap = cardW + Math.round(W * 0.025)
    const cardCY = H * 0.52

    TRAINER_CLASSES.forEach((cls: TrainerClass, i: number) => {
      const x = startX + i * gap
      const y = cardCY

      const bg = this.add.graphics()
      bg.fillStyle(0x0a1a2e, 1)
      bg.lineStyle(3, 0xff4444, 1)
      bg.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 12)
      bg.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 12)
      overlay.add(bg)

      overlay.add(this.add.text(x, y - cardH * 0.35, cls.icon, {
        font: `${Math.round(H * 0.06)}px Arial`
      }).setOrigin(0.5))

      overlay.add(this.add.text(x, y - cardH * 0.12, cls.name, {
        font: `bold ${Math.round(H * 0.025)}px Arial`,
        color: '#ff4444'
      }).setOrigin(0.5))

      overlay.add(this.add.text(x, y + cardH * 0.05, cls.description, {
        font: `${Math.round(H * 0.017)}px Arial`,
        color: '#aaaaaa',
        wordWrap: { width: cardW - 16 },
        align: 'center'
      }).setOrigin(0.5))

      overlay.add(this.add.text(x, y + cardH * 0.28, cls.bonus, {
        font: `${Math.round(H * 0.014)}px Arial`,
        color: '#ffffff',
        wordWrap: { width: cardW - 16 },
        align: 'center'
      }).setOrigin(0.5))

      const btn = this.add.text(x, y + cardH * 0.44, '[Elegir]', {
        font: `bold ${Math.round(H * 0.022)}px Arial`,
        color: '#ff4444',
        backgroundColor: '#1a0000',
        padding: { x: 16, y: 10 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      btn.on('pointerover', () => btn.setColor('#ffffff'))
      btn.on('pointerout', () => btn.setColor('#ff4444'))
      btn.on('pointerdown', () => {
        this.registry.set('trainerClass', cls.id)
        this.scene.start('GameScene', {
          starterDexId,
          newGame: this.newGame,
          gameMode: 'roguelike',
          trainerClass: cls.id
        })
      })
      overlay.add(btn)
    })

    overlay.setAlpha(0)
    this.tweens.add({ targets: overlay, alpha: 1, duration: 300 })
  }
}
