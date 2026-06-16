import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'
import { Item, equipItem, applyVitamin, applyConsumable, RELICS } from '../data/Items'
import { spriteKey } from '../entities/PokemonFactory'
import { itemSpriteKey } from '../data/GameAssets'

export interface BagSceneData {
  playerTeam: Pokemon[]
  playerBag: Item[]
  onComplete: () => void
}

export default class BagScene extends Phaser.Scene {
  private payload!: BagSceneData
  private root?: Phaser.GameObjects.Container

  // drag state
  private dragging: { item: Item; idx: number; source: 'bag' | 'pokemon'; pokemonIdx?: number } | null = null
  private ghost?: Phaser.GameObjects.Container
  private pokemonZones: Array<{ zone: Phaser.GameObjects.Zone; idx: number }> = []
  private bagDropZone?: Phaser.GameObjects.Zone

  constructor() { super('BagScene') }

  init(data: BagSceneData) {
    this.payload = data
    this.dragging = null
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a')
    this.render()

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.ghost) {
        this.ghost.setPosition(p.x, p.y)
      }
    })

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.dragging) return
      const hit = this.pokemonZones.find(z => z.zone.getBounds().contains(p.x, p.y))
      if (hit !== undefined) {
        this.dropOnPokemon(hit.idx)
      } else if (this.dragging.source === 'pokemon' && this.bagDropZone?.getBounds().contains(p.x, p.y)) {
        this.unequipToBag(this.dragging.pokemonIdx!)
      } else {
        this.cancelDrag()
        return
      }
      this.endDrag()
    })
  }

  private render() {
    if (this.root) this.root.destroy()
    this.root = this.add.container(0, 0)
    this.pokemonZones = []

    const W = this.scale.width
    const H = this.scale.height
    const leftW = Math.round(W * 0.38)
    const rightX = leftW + 20

    // background panel
    const panel = this.add.graphics()
    panel.fillStyle(0x0a0a1a, 0.96)
    panel.fillRoundedRect(10, 10, W - 20, H - 20, 12)
    panel.lineStyle(2, 0x4488FF, 1)
    panel.strokeRoundedRect(10, 10, W - 20, H - 20, 12)
    this.root.add(panel)

    // title
    this.root.add(this.add.text(W / 2, 36, 'MOCHILA', {
      font: 'bold 20px "Press Start 2P", Arial', color: '#FFD700'
    }).setOrigin(0.5))

    // close
    const closeBtn = this.add.text(W - 30, 36, '[X]', {
      font: 'bold 14px Arial', color: '#ff8888',
      backgroundColor: '#222', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    closeBtn.on('pointerdown', () => this.close())
    this.root.add(closeBtn)

    // ── LEFT: bag items ───────────────────────────────────────────────────────
    this.root.add(this.add.text(30, 64, 'OBJETOS', {
      fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#aaaaaa'
    }))

    // bag drop zone (for unequipping)
    if (this.bagDropZone) this.bagDropZone.destroy()
    const bdz = this.add.zone(10, 80, leftW, H - 100).setOrigin(0, 0)
    this.bagDropZone = bdz

    if (this.payload.playerBag.length === 0) {
      this.root.add(this.add.text(30, 90, '(vacía)', { font: '13px Arial', color: '#666' }))
    }

    this.payload.playerBag.forEach((item, i) => {
      const y = 88 + i * 48
      const bg = this.add.graphics()
      bg.fillStyle(0x1a1a3e, 1)
      bg.lineStyle(2, 0x4488FF, 0.8)
      bg.fillRoundedRect(20, y, leftW - 20, 42, 6)
      bg.strokeRoundedRect(20, y, leftW - 20, 42, 6)
      this.root!.add(bg)

      const iconKey = itemSpriteKey(item.id)
      if (this.textures.exists(iconKey)) {
        const icon = this.add.image(40, y + 21, iconKey).setDisplaySize(28, 28)
        this.root!.add(icon)
      }

      const tagMap: Record<string, [string, string]> = {
        vitamin: ['[V]', '#88ff88'], berry: ['[B]', '#ff88aa'],
        relic: ['[R]', '#ffaa44'], consumable: ['[C]', '#44ddff']
      }
      const [tag, tagColor] = tagMap[item.category] ?? ['[?]', '#ffffff']
      this.root!.add(this.add.text(58, y + 6, `${tag} ${item.name}`, { fontFamily: '"Press Start 2P"', fontSize: '8px', color: tagColor }))
      this.root!.add(this.add.text(58, y + 22, item.description, { fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#cccccc' }))

      if (item.category === 'consumable') {
        const needsTarget = item.id === 'rare_candy' || item.id === 'revive'
        if (!needsTarget) {
          const useBtn = this.add.text(leftW - 10, y + 21, 'USAR', {
            font: 'bold 10px Arial', color: '#001520',
            backgroundColor: '#44ddff', padding: { x: 6, y: 3 }
          }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })
          useBtn.on('pointerdown', () => {
            applyConsumable(item, this.payload.playerTeam)
            this.payload.playerBag.splice(i, 1)
            this.render()
          })
          this.root!.add(useBtn)
        } else {
          // needs target: show per-pokemon use buttons inline
          this.payload.playerTeam.forEach((p, pi) => {
            const canTarget = item.id === 'revive' ? !p.isAlive() : true
            if (!canTarget) return
            const btn = this.add.text(leftW - 10 - pi * 52, y + 21, p.name, {
              font: '9px Arial', color: '#001520',
              backgroundColor: '#44ddff', padding: { x: 4, y: 3 }
            }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })
            btn.on('pointerdown', () => {
              applyConsumable(item, this.payload.playerTeam, pi)
              this.payload.playerBag.splice(i, 1)
              this.render()
            })
            this.root!.add(btn)
          })
        }
      } else {
        const zone = this.add.zone(20, y, leftW - 20, 42).setOrigin(0, 0).setInteractive({ useHandCursor: true })
        zone.on('pointerdown', () => this.startDragFromBag(item, i))
        this.root!.add(zone)
      }
    })

    // ── RIGHT: pokemon team ───────────────────────────────────────────────────
    const px = '"Press Start 2P"'
    this.root.add(this.add.text(rightX, 64, 'EQUIPO', {
      fontFamily: px, fontSize: '9px', color: '#aaaaaa'
    }))

    const slotH = 130
    const slotW = Math.min(280, W - rightX - 20)

    this.payload.playerTeam.forEach((p, i) => {
      const y = 84 + i * (slotH + 10)
      const bg = this.add.graphics()
      bg.fillStyle(0x1a1a3e, 1)
      bg.lineStyle(2, 0x88FF88, 0.8)
      bg.fillRoundedRect(rightX, y, slotW, slotH, 8)
      bg.strokeRoundedRect(rightX, y, slotW, slotH, 8)
      this.root!.add(bg)

      const sKey = spriteKey(p.id, false)
      if (this.textures.exists(sKey)) {
        this.root!.add(this.add.image(rightX + 48, y + slotH / 2, sKey).setDisplaySize(88, 88))
      }

      this.root!.add(this.add.text(rightX + 102, y + 14, `${p.name} Nv.${p.level}`, {
        fontFamily: px, fontSize: '11px', color: '#ffffff'
      }))
      this.root!.add(this.add.text(rightX + 102, y + 40, `HP ${p.hp}/${p.maxHp}`, {
        fontFamily: px, fontSize: '10px', color: '#aaccff'
      }))
      this.root!.add(this.add.text(rightX + 102, y + 62, `Atk ${p.attack}  Def ${p.defense}`, {
        fontFamily: px, fontSize: '10px', color: '#aaccff'
      }))
      this.root!.add(this.add.text(rightX + 102, y + 84, `Spd ${p.speed}`, {
        fontFamily: px, fontSize: '10px', color: '#aaccff'
      }))

      if (p.heldItem) {
        const heldItem = RELICS.find(r => r.id === p.heldItem)
        const iconKey = heldItem ? itemSpriteKey(heldItem.id) : ''
        if (heldItem && this.textures.exists(iconKey)) {
          const icon = this.add.image(rightX + slotW - 24, y + slotH / 2, iconKey).setDisplaySize(40, 40)
          this.root!.add(icon)
          const unzone = this.add.zone(rightX + slotW - 44, y + slotH / 2 - 20, 40, 40).setOrigin(0, 0).setInteractive({ useHandCursor: true })
          unzone.on('pointerdown', () => this.startDragFromPokemon(heldItem, i))
          this.root!.add(unzone)
        }
      }

      // drop zone for this pokemon slot
      const dz = this.add.zone(rightX, y, slotW, slotH).setOrigin(0, 0)
      this.pokemonZones.push({ zone: dz, idx: i })
      this.root!.add(dz)
    })

    // hint text bottom
    this.root.add(this.add.text(W / 2, H - 24, 'Arrastra un objeto encima de un Pokemon para equipar. Arrastra objeto equipado hacia la izquierda para desequipar.', {
      font: '9px Arial', color: '#666666'
    }).setOrigin(0.5))
  }

  private startDragFromBag(item: Item, idx: number) {
    this.dragging = { item, idx, source: 'bag' }
    this.createGhost(item)
  }

  private startDragFromPokemon(item: Item, pokemonIdx: number) {
    this.dragging = { item, idx: -1, source: 'pokemon', pokemonIdx }
    this.createGhost(item)
  }

  private createGhost(item: Item) {
    if (this.ghost) this.ghost.destroy()
    const p = this.input.activePointer
    const bg = this.add.graphics()
    bg.fillStyle(0x445588, 0.9)
    bg.fillRoundedRect(-70, -18, 140, 36, 6)
    bg.lineStyle(2, 0xFFD700, 1)
    bg.strokeRoundedRect(-70, -18, 140, 36, 6)
    const label = this.add.text(0, 0, item.name, {
      font: 'bold 11px Arial', color: '#FFD700'
    }).setOrigin(0.5)
    this.ghost = this.add.container(p.x, p.y, [bg, label])
    this.ghost.setDepth(999)
  }

  private dropOnPokemon(pokemonIdx: number) {
    if (!this.dragging) return
    const { item, idx, source } = this.dragging
    const p = this.payload.playerTeam[pokemonIdx]

    if (item.category === 'vitamin') {
      applyVitamin(p, item)
      if (source === 'bag') this.payload.playerBag.splice(idx, 1)
    } else if (item.category === 'berry') {
      p.heal(Math.floor(p.maxHp * 0.5))
      if (source === 'bag') this.payload.playerBag.splice(idx, 1)
    } else {
      // relic equip
      if (source === 'bag') {
        const old = equipItem(p, item)
        this.payload.playerBag.splice(idx, 1)
        if (old) this.payload.playerBag.push(old)
      } else if (source === 'pokemon' && this.dragging.pokemonIdx !== undefined) {
        // move from one pokemon to another
        const fromP = this.payload.playerTeam[this.dragging.pokemonIdx]
        this.unequipFromPokemon(fromP)
        const old = equipItem(p, item)
        if (old) this.payload.playerBag.push(old)
      }
    }
  }

  private unequipToBag(pokemonIdx: number) {
    const p = this.payload.playerTeam[pokemonIdx]
    this.unequipFromPokemon(p)
  }

  private unequipFromPokemon(p: Pokemon) {
    if (!p.heldItem) return
    const item = RELICS.find(i => i.id === p.heldItem)
    if (!item) return
    const b = item.bonus || {}
    p.attack  -= b.attack  || 0
    p.defense -= b.defense || 0
    p.speed   -= b.speed   || 0
    if (b.hp) { p.maxHp -= b.hp; p.hp = Math.min(p.hp, p.maxHp) }
    p.heldItem = undefined
    this.payload.playerBag.push(item)
  }

  private cancelDrag() {
    // no-op, just end
  }

  private endDrag() {
    this.dragging = null
    if (this.ghost) { this.ghost.destroy(); this.ghost = undefined }
    this.render()
  }

  private close() {
    if (this.ghost) { this.ghost.destroy(); this.ghost = undefined }
    this.payload.onComplete()
    this.scene.resume('GameScene')
    this.scene.stop()
  }
}
