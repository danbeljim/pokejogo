import Phaser from 'phaser'

// Kanto zone as % of image dimensions — adjust these if zone is off
// xPct/yPct = top-left corner, wPct/hPct = size
const KANTO_ZONE = { xPct: 0.61, yPct: 0.38, wPct: 0.09, hPct: 0.12 }

export default class WorldMapScene extends Phaser.Scene {
  private onSelectKanto?: () => void
  private pulseGraphics?: Phaser.GameObjects.Graphics
  private pulseTime = 0

  constructor() {
    super('WorldMapScene')
  }

  init(data: { onSelectKanto?: () => void }) {
    this.onSelectKanto = data?.onSelectKanto
  }

  preload() {
    if (!this.textures.exists('world-map')) {
      this.load.image('world-map', '/assets/locations/mapa.jpeg')
    }
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    const cx = W / 2
    const cy = H / 2

    this.cameras.main.setBackgroundColor('#0a1a2e')

    // Title
    this.add.text(cx, H * 0.04, 'SELECCIONA UNA REGIÓN', {
      fontFamily: '"Press Start 2P"',
      fontSize: `${Math.round(H * 0.028)}px`,
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5)

    if (!this.textures.exists('world-map')) {
      this.add.text(cx, cy, 'Error cargando mapa', {
        fontFamily: '"Press Start 2P"', fontSize: '16px', color: '#ff4444'
      }).setOrigin(0.5)
      return
    }

    // Map image — fill most of screen leaving room for title/hint
    const mapY = H * 0.54
    const mapH = H * 0.84
    const img = this.textures.get('world-map').getSourceImage() as HTMLImageElement
    const imgAspect = img.naturalWidth / img.naturalHeight
    const mapW = mapH * imgAspect

    const mapImg = this.add.image(cx, mapY, 'world-map')
    mapImg.setDisplaySize(mapW, mapH)

    // Compute Kanto zone in screen coords
    const mapLeft = cx - mapW / 2
    const mapTop = mapY - mapH / 2
    const kx = mapLeft + KANTO_ZONE.xPct * mapW
    const ky = mapTop + KANTO_ZONE.yPct * mapH
    const kw = KANTO_ZONE.wPct * mapW
    const kh = KANTO_ZONE.hPct * mapH

    // Pulsing outline graphics
    this.pulseGraphics = this.add.graphics()

    // Invisible interactive zone
    const zone = this.add.zone(kx + kw / 2, ky + kh / 2, kw, kh)
      .setInteractive({ useHandCursor: true })

    // Label
    const label = this.add.text(kx + kw / 2, ky - 14, 'KANTO', {
      fontFamily: '"Press Start 2P"',
      fontSize: `${Math.round(H * 0.02)}px`,
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5, 1)

    let hovered = false

    zone.on('pointerover', () => {
      hovered = true
      label.setColor('#ffffff')
    })

    zone.on('pointerout', () => {
      hovered = false
      label.setColor('#FFD700')
    })

    zone.on('pointerdown', () => {
      this.cameras.main.flash(300, 255, 215, 0, false)
      this.time.delayedCall(300, () => {
        this.scene.stop()
        if (this.onSelectKanto) this.onSelectKanto()
      })
    })

    // Hint text
    this.add.text(cx, H * 0.96, 'Haz clic en una región para comenzar', {
      fontFamily: '"Press Start 2P"',
      fontSize: `${Math.round(H * 0.016)}px`,
      color: '#888888'
    }).setOrigin(0.5)

    // Store zone bounds for update loop
    this.data.set('zone', { x: kx, y: ky, w: kw, h: kh })
    this.data.set('hovered', () => hovered)
    this.pulseTime = 0
  }

  update(time: number, delta: number) {
    if (!this.pulseGraphics) return

    this.pulseTime += delta
    const pulse = 0.5 + 0.5 * Math.sin(this.pulseTime / 400)
    const alpha = 0.4 + 0.6 * pulse
    const zone = this.data.get('zone') as { x: number; y: number; w: number; h: number }
    const hoveredFn = this.data.get('hovered') as () => boolean
    if (!zone) return

    const isHovered = hoveredFn()
    const color = isHovered ? 0xffffff : 0xFFD700
    const lineW = isHovered ? 4 : 2

    this.pulseGraphics.clear()
    this.pulseGraphics.lineStyle(lineW, color, alpha)
    this.pulseGraphics.strokeRect(zone.x, zone.y, zone.w, zone.h)

    // Corner accents
    const cs = 12
    this.pulseGraphics.lineStyle(lineW + 2, color, alpha)
    const corners = [
      [zone.x, zone.y], [zone.x + zone.w, zone.y],
      [zone.x, zone.y + zone.h], [zone.x + zone.w, zone.y + zone.h]
    ]
    corners.forEach(([cx, cy]) => {
      const dx = cx === zone.x ? 1 : -1
      const dy = cy === zone.y ? 1 : -1
      this.pulseGraphics!.beginPath()
      this.pulseGraphics!.moveTo(cx + dx * cs, cy)
      this.pulseGraphics!.lineTo(cx, cy)
      this.pulseGraphics!.lineTo(cx, cy + dy * cs)
      this.pulseGraphics!.strokePath()
    })
  }
}
