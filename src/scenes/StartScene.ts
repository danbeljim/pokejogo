import Phaser from 'phaser'
import { getStarters, spriteKey, spriteUrl } from '../entities/PokemonFactory'
import { TYPE_COLORS } from '../data/Types'
import { TRAINER_CLASSES, TrainerClass } from '../data/RoguelikeData'

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

  preload() {
    getStarters().forEach(s => {
      this.load.image(spriteKey(s.dexId, false), spriteUrl(s.dexId, false))
    })
    this.load.image('lab-bg', '/assets/locations/laboratorio.png')
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    const cx = W / 2
    this.cameras.main.setBackgroundColor('#0a0a1a')

    if (this.textures.exists('lab-bg')) {
      const bg = this.add.image(cx, H / 2, 'lab-bg')
      bg.setDisplaySize(W, H)
      bg.setAlpha(0.35)
    }

    const titleText = this.gameMode === 'roguelike' ? '◆ PURO ROGUELIKE' : 'POKÉMON ROGUELIKE'
    const titleColor = this.gameMode === 'roguelike' ? '#ff4444' : '#FFD700'

    this.add.text(cx, H * 0.1, titleText, {
      font: `bold ${Math.round(H * 0.06)}px Arial`,
      color: titleColor,
      stroke: '#000',
      strokeThickness: 8
    }).setOrigin(0.5)

    const subtitle = this.gameMode === 'roguelike'
      ? 'Sin red de seguridad. Sin saves. Permadeath real.'
      : '8 Gimnasios. 8 Medallas. Una Partida.'

    this.add.text(cx, H * 0.18, subtitle, {
      font: `${Math.round(H * 0.025)}px Arial`,
      color: this.gameMode === 'roguelike' ? '#ff8888' : '#cccccc'
    }).setOrigin(0.5)

    this.add.text(cx, H * 0.27, 'Elige tu inicial:', {
      font: `${Math.round(H * 0.032)}px Arial`,
      color: '#ffffff'
    }).setOrigin(0.5)

    const starters = getStarters()
    const cardW = Math.round(W * 0.11)
    const cardH = Math.round(H * 0.32)
    const totalSpread = cardW * starters.length + Math.round(W * 0.04) * (starters.length - 1)
    const startX = cx - totalSpread / 2 + cardW / 2
    const gap = cardW + Math.round(W * 0.04)
    const cardCY = H * 0.58

    this.starterCards = []

    starters.forEach((starter, i) => {
      const x = startX + i * gap
      const y = cardCY

      const cardContainer = this.add.container(0, 0)

      const bg = this.add.graphics()
      bg.fillStyle(0x1a1a2e, 1)
      bg.lineStyle(3, parseInt(TYPE_COLORS[starter.type].replace('#', '0x')), 1)
      bg.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 12)
      bg.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 12)
      cardContainer.add(bg)

      const sprite = this.add.image(x, y - cardH * 0.2, spriteKey(starter.dexId, false))
      sprite.setDisplaySize(100, 100)
      cardContainer.add(sprite)

      const nameTxt = this.add.text(x, y + cardH * 0.22, starter.name, {
        font: `bold ${Math.round(H * 0.025)}px Arial`,
        color: '#ffffff'
      }).setOrigin(0.5)
      cardContainer.add(nameTxt)

      const typeTxt = this.add.text(x, y + cardH * 0.32, `[${starter.type.toUpperCase()}]`, {
        font: `${Math.round(H * 0.02)}px Arial`,
        color: TYPE_COLORS[starter.type]
      }).setOrigin(0.5)
      cardContainer.add(typeTxt)

      const btn = this.add.text(x, y + cardH * 0.42, '[Elegir]', {
        font: `bold ${Math.round(H * 0.022)}px Arial`,
        color: '#FFD700',
        backgroundColor: '#222',
        padding: { x: 18, y: 10 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      btn.on('pointerover', () => btn.setColor('#ffffff'))
      btn.on('pointerout', () => btn.setColor('#FFD700'))
      btn.on('pointerdown', () => {
        if (this.gameMode === 'roguelike') {
          this.showClassPicker(starter.dexId)
        } else {
          this.scene.start('GameScene', { starterDexId: starter.dexId, newGame: this.newGame })
        }
      })
      cardContainer.add(btn)

      this.starterCards.push(cardContainer)
    })

    this.add.text(cx, H * 0.93, 'Pulsa los nodos para avanzar. ¡Derrota a 8 líderes para ganar!', {
      font: `${Math.round(H * 0.018)}px Arial`,
      color: '#888888'
    }).setOrigin(0.5)
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
    const cardCY = H * 0.58

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
