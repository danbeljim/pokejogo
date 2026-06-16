import Phaser from 'phaser'
import MapManager from '../managers/MapManager'
import LevelGenerator from '../managers/LevelGenerator'
import PlatformManager from '../managers/PlatformManager'
import EventManager from '../managers/EventManager'
import EventPopup from '../ui/EventPopup'
import { BerryTreeData } from './BerryTreeScene'
import { DojoSceneData } from './DojoScene'
import { ProfessorSceneData } from './ProfessorScene'
import { createStarterByDexId, POKEMON_LIST, spriteKey, spriteUrl } from '../entities/PokemonFactory'
import { Pokemon } from '../entities/Pokemon'
import { preloadSprites, preloadItemSprites, preloadTrainerSprites, preloadGymLeaderSprites, preloadBadgeSprites } from '../utils/SpriteLoader'
import { MapNode } from '../managers/LevelGenerator'
import { TRAINER_ICON_DEX, itemSpriteKey, BADGE_SPRITES } from '../data/GameAssets'
import { EVOLUTION_TARGET_IDS } from '../data/Evolution'
import { PlatformEventType } from '../types'
import { Item } from '../data/Items'
import { computeActiveSynergy, TeamSynergy, assignRogueTraits } from '../data/RoguelikeData'

export default class GameScene extends Phaser.Scene {
  private mapManager = new MapManager()
  private levelGenerator = new LevelGenerator()
  private platformManager?: PlatformManager
  private eventManager = new EventManager()
  private eventPopup?: EventPopup
  private hudText?: Phaser.GameObjects.Text
  private teamPanel?: Phaser.GameObjects.Container
  private slotZones: Phaser.GameObjects.Zone[] = []
  private dragFromIdx = -1
  private dragGhost?: Phaser.GameObjects.Container
  private playerTeam: Pokemon[] = []
  private playerBag: Item[] = []
  private eventOccurred: boolean = false
  private starterDexId: number = 4

  private statsTooltip?: Phaser.GameObjects.Text
  private uiTooltip?: Phaser.GameObjects.Container
  private badgeContainer?: Phaser.GameObjects.Container
  private synergyText?: Phaser.GameObjects.Text
  private roguelikeMode: boolean = false
  private trainerClass: string | null = null
  private battleSpeed: 2 | 3 = 2
  private playerGold: number = 0
  private teamPanelCollapsed: boolean = false
  private teamToggleBtn?: Phaser.GameObjects.Container

  private get isMobile() { return this.scale.width < 1000 }
  private get PANEL_W() { return 0 }
  private get MAP_W() { return Math.round(this.scale.width * (this.isMobile ? 0.52 : 0.42)) }
  private get MAP_X() { return Math.round((this.scale.width - this.MAP_W) / 2) }
  private get RIGHT_CX() { return this.scale.width - 60 }
  private get SLOT_W() { return 0 }
  private get SLOT_H() { return 0 }
  private get SLOT_X0() { return 0 }
  private get SLOT_Y0() { return 0 }

  constructor() {
    super('GameScene')
  }

  init(data: { starterDexId?: number; newGame?: boolean; gameMode?: string; trainerClass?: string; resumeMapId?: number; resumeMedals?: any[]; resumeTeam?: Pokemon[]; resumeBag?: Item[]; resumeGold?: number }) {
    this.roguelikeMode = (data?.gameMode || this.registry.get('gameMode')) === 'roguelike'
    this.trainerClass = data?.trainerClass || this.registry.get('trainerClass') || null

    if (data?.newGame) {
      this.playerTeam = []
      this.playerBag = []
      this.mapManager = new MapManager()
    } else if (data?.resumeMapId !== undefined) {
      this.mapManager = new MapManager()
      this.mapManager.currentMapId = data.resumeMapId
      this.mapManager.collectedMedals = data.resumeMedals || []
      if (data.resumeTeam) this.playerTeam = data.resumeTeam
      if (data.resumeBag) this.playerBag = data.resumeBag
      if (data.resumeGold !== undefined) this.playerGold = data.resumeGold
    }
    if (data?.starterDexId) {
      this.starterDexId = data.starterDexId
    }
  }

  preload() {
    const ids = [...POKEMON_LIST.map(p => p.dexId), ...EVOLUTION_TARGET_IDS]
    preloadSprites(this, ids, false)
    preloadSprites(this, ids, true)
    preloadItemSprites(this)
    preloadTrainerSprites(this)
    preloadGymLeaderSprites(this)
    preloadBadgeSprites(this)
    this.load.image('cajadialogo', '/assets/trainers/cajadialogo.jpg')
    this.load.image('dojo-bg', '/assets/locations/dojo.png')
    this.load.image('shop-icon', '/assets/locations/shop.png')
    this.load.image('shop-bg', '/assets/locations/shop_int.png')
    this.load.image('moneda-icon', '/assets/locations/moneda.png')
    this.load.image('home-icon', '/assets/locations/home.png')
    this.load.image('makuhita-icon', '/assets/random/Makuhita_icono_HOME.png')
    this.load.image('cientifico-icon', '/assets/random/cientifico.png')
    this.load.image('baya-icon', '/assets/random/baya.png')
    this.load.image('gemelas-icon', '/assets/random/gemelas.png')
    this.load.image('dobles-bg', '/assets/random/dobles.jpg')
    this.load.image('legendarios-icon', '/assets/random/legendarios.jpg')
    this.load.image('celeste-bg', '/assets/random/celeste.png')
    this.load.image('tall-grass', '/assets/trainers/grass.png')
    this.load.image('tall-grass-tile', '/assets/trainers/Zona_de_hierba_alta_XY.png')
    this.load.image('bici', '/assets/trainers/bici.png')

    // Trainer icon
    if (!this.textures.exists(spriteKey(TRAINER_ICON_DEX, false))) {
      this.load.image(spriteKey(TRAINER_ICON_DEX, false), spriteUrl(TRAINER_ICON_DEX, false))
    }

    // Signature pokemon sprites for all gyms (BG + boss icon)
    this.mapManager.maps.forEach(m => {
      const k = spriteKey(m.signaturePokemonDexId, false)
      if (!this.textures.exists(k)) {
        this.load.image(k, spriteUrl(m.signaturePokemonDexId, false))
      }
      const locKey = `location-bg-${m.id}`
      if (!this.textures.exists(locKey)) {
        this.load.image(locKey, m.locationBgUrl)
      }
    })
  }

  create() {
    const currentMap = this.mapManager.getCurrentMap()
    this.cameras.main.setBackgroundColor('#00000000')
    this.createGrassTileFromImage()

    this.drawThemedBackground(currentMap)

    // Configure EventManager for roguelike mode
    this.eventManager.roguelikeMode = this.roguelikeMode
    this.eventManager.trainerClass = this.trainerClass
    this.eventManager.wildPool = currentMap.wildPool
    this.eventManager.currentFloor = this.mapManager.currentMapId

    if (this.playerTeam.length === 0) {
      const starter = createStarterByDexId(this.starterDexId)
      if (this.roguelikeMode) {
        // Starter gets traits too (guaranteed positive)
        assignRogueTraits(starter, true)
        // Luchador: +20% ATK to starter
        if (this.trainerClass === 'luchador') {
          starter.attack = Math.round(starter.attack * 1.20)
        }
      }
      this.playerTeam.push(starter)
    } else {
      this.playerTeam.forEach(p => p.heal(p.maxHp))
    }

    this.platformManager = new PlatformManager(this)
    this.eventPopup = new EventPopup(this)
    const playerMaxLevel = Math.max(...this.playerTeam.map(p => p.level), 5)
    const mapAreaX = this.MAP_X
    const mapAreaW = this.MAP_W
    const map = currentMap.towerMap
      ? this.levelGenerator.generateTower(playerMaxLevel, mapAreaX, mapAreaW)
      : this.levelGenerator.generateLevel(
          currentMap.platformCount,
          currentMap.difficulty,
          playerMaxLevel,
          currentMap.ghostOnly,
          currentMap.wildPool,
          this.mapManager.currentMapId,
          mapAreaX,
          mapAreaW
        )

    // Explorador: convert 2 mid nodes to RANDOM events
    if (this.roguelikeMode && this.trainerClass === 'explorador') {
      const candidates = map.nodes.filter((n: MapNode) =>
        n.row > 1 && n.row < map.rows - 2 &&
        n.eventType !== 'boss' && n.eventType !== 'pokemon_center'
      )
      let converted = 0
      while (converted < 2 && candidates.length > 0) {
        const idx = Math.floor(Math.random() * candidates.length)
        candidates[idx].eventType = 'random' as any
        candidates.splice(idx, 1)
        converted++
      }
    }

    this.platformManager.setMap(map, (node) => this.onNodeClick(node), currentMap.signaturePokemonDexId, currentMap.gymLeaderName)

    this.updateHud()

    this.scale.on('resize', () => this.positionHtmlPanels())

    // Defensive: any resume from sub-scene clears event lock + refreshes UI
    this.events.on('resume', () => {
      this.eventOccurred = false
      this.updateHud()
    })
    this.events.on('shutdown', () => {
      this.scale.off('resize')
      this.events.off('resume')
      this.events.off('shutdown')
      this.clearSidePanels()
    })
  }

  private speedToggleContainer?: Phaser.GameObjects.Container

  private showUiTooltip(anchorX: number, anchorY: number, title: string, body: string) {
    this.hideUiTooltip()
    const boxW = 240
    const boxH = 100
    let bx = anchorX - boxW - 20
    let by = anchorY - boxH / 2
    if (bx < 4) bx = anchorX + 20
    if (by < 4) by = 4
    if (by + boxH > this.scale.height - 4) by = this.scale.height - boxH - 4

    const container = this.add.container(bx, by).setDepth(300).setScrollFactor(0)

    if (this.textures.exists('cajadialogo')) {
      container.add(this.add.image(0, 0, 'cajadialogo').setOrigin(0, 0).setDisplaySize(boxW, boxH))
    } else {
      const g = this.add.graphics()
      g.fillStyle(0xffffff, 1).fillRect(0, 0, boxW, boxH)
      g.lineStyle(3, 0x000000, 1).strokeRect(0, 0, boxW, boxH)
      container.add(g)
    }

    const innerW = boxW - 32
    const titleTxt = this.add.text(boxW / 2, 22, title, {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#000000',
      align: 'center', wordWrap: { width: innerW }
    }).setOrigin(0.5, 0)
    container.add(titleTxt)

    const bodyTxt = this.add.text(boxW / 2, 22 + titleTxt.height + 8, body, {
      fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#000000',
      align: 'center', wordWrap: { width: innerW }, lineSpacing: 4
    }).setOrigin(0.5, 0)
    container.add(bodyTxt)

    this.uiTooltip = container
  }

  private hideUiTooltip() {
    if (this.uiTooltip) { this.uiTooltip.destroy(); this.uiTooltip = undefined }
  }

  private createGrassTileFromImage() {
    if (this.textures.exists('tall-grass-tile') || !this.textures.exists('tall-grass')) return
    const rt = this.add.renderTexture(0, 0, 100, 100).setVisible(false)
    const src = this.add.image(0, 0, 'tall-grass').setOrigin(0, 0).setVisible(false)
    rt.draw(src, 0, 0)
    rt.saveTexture('tall-grass-tile')
    src.destroy()
    rt.destroy()
  }

  private generateTallGrassTexture() {
    if (this.textures.exists('tall-grass')) return
    const g = this.make.graphics({})
    const size = 32
    const px = 2 // pixel scale (16x16 logical grid)

    // Base ground (dark green)
    g.fillStyle(0x4a8836, 1)
    g.fillRect(0, 0, size, size)

    // Gen 1 style tall grass pattern (16x16 logical tile)
    // 0 = light, 1 = mid, 2 = dark
    const pattern = [
      [2,2,1,2,2,2,2,1,1,2,2,2,2,2,1,2],
      [2,1,0,1,2,2,1,0,0,1,2,2,1,0,1,2],
      [2,1,0,0,1,1,0,0,0,0,1,1,0,0,1,2],
      [2,2,1,0,0,0,0,1,1,0,0,0,0,1,2,2],
      [2,2,2,1,1,0,1,2,2,1,0,1,1,2,2,2],
      [2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [1,2,2,2,2,1,1,2,2,1,1,2,2,2,2,1],
      [0,1,2,2,1,0,0,1,1,0,0,1,2,2,1,0],
      [0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0],
      [1,0,0,0,0,1,1,0,0,1,1,0,0,0,0,1],
      [2,1,1,1,1,2,2,1,1,2,2,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,1,2,2,1,1,2,2,1,1,2,2,1,2,2],
      [2,1,0,1,1,0,0,1,1,0,0,1,1,0,1,2],
      [2,1,0,0,0,0,0,0,0,0,0,0,0,0,1,2]
    ]

    const colors = [0xa8e060, 0x70b048, 0x4a8836]
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        g.fillStyle(colors[pattern[y][x]], 1)
        g.fillRect(x * px, y * px, px, px)
      }
    }

    g.lineStyle(2, 0x1a3d10, 1)
    g.strokeRect(0, 0, size, size)

    g.generateTexture('tall-grass', size, size)
    g.destroy()
  }

  private drawThemedBackground(currentMap: any) {
    const w = this.scale.width
    const h = this.scale.height
    const mapX = this.MAP_X
    const mapW = this.MAP_W
    const accent = parseInt(currentMap.accentColor.replace('#', '0x'))
    const locKey = `location-bg-${currentMap.id}`

    // ── Full-canvas sky + grass background (matches CSS gradient) ────────────
    const fullBg = this.add.graphics().setDepth(0)
    const sky1End = Math.round(h * 0.45)
    const sky2End = Math.round(h * 0.55)
    fullBg.fillStyle(0x5DADE2, 1).fillRect(0, 0, w, sky1End)
    fullBg.fillStyle(0x4A90E2, 1).fillRect(0, sky1End, w, sky2End - sky1End)
    fullBg.fillStyle(0x4CAF50, 1).fillRect(0, sky2End, w, h - sky2End)

    // ── Map rectangle bg only ─────────────────────────────────────────────────
    if (this.textures.exists(locKey)) {
      this.add.image(mapX + mapW / 2, h / 2, locKey)
        .setDisplaySize(mapW, h).setDepth(0)
    }

    const mapGrad = this.add.graphics().setDepth(1)
    mapGrad.fillGradientStyle(accent, accent, 0x000000, 0x000000, 0.10, 0.10, 0.30, 0.30)
    mapGrad.fillRect(mapX, 0, mapW, h)

    // Border around portrait map
    const border = this.add.graphics().setDepth(2)
    border.lineStyle(this.isMobile ? 2 : 4, 0x000000, 1)
    border.strokeRect(mapX, 0, mapW, h)
    border.lineStyle(this.isMobile ? 1 : 2, accent, 0.6)
    border.strokeRect(mapX + 2, 2, mapW - 4, h - 4)
  }

  private drawLegend() {
    const items = [
      { icon: 'C', label: 'Capture', color: '#4CAF50' },
      { icon: 'W', label: 'Wild', color: '#FF9800' },
      { icon: 'T', label: 'Trainer', color: '#FF5722' },
      { icon: 'I', label: 'Item', color: '#2196F3' },
      { icon: 'B', label: 'Boss', color: '#FFD700' },
      { icon: '+', label: 'Centro', color: '#FF69B4' },
      { icon: '?', label: 'Random', color: '#AA44FF' }
    ]
    const legendX = this.scale.width - 120
    items.forEach((item, i) => {
      this.add.text(legendX, 10 + i * 20, `${item.icon} = ${item.label}`, {
        font: '12px Arial',
        color: item.color,
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 }
      }).setScrollFactor(0).setDepth(100)
    })
  }

  private getActiveSynergy(): TeamSynergy | null {
    if (!this.roguelikeMode || this.playerTeam.length === 0) return null
    return computeActiveSynergy(this.playerTeam)
  }

  private updateHud() {
    if (this.hudText) { this.hudText.destroy(); this.hudText = undefined }
    if (this.badgeContainer) { this.badgeContainer.destroy(); this.badgeContainer = undefined }
    if (this.synergyText) { this.synergyText.destroy(); this.synergyText = undefined }
    this.renderRightPanel()
    this.drawTeamPanel()
    this.time.delayedCall(50, () => this.positionHtmlPanels())
  }

  private clearSidePanels() {
    const lp = document.getElementById('left-panel')
    const rp = document.getElementById('right-panel')
    if (lp) lp.innerHTML = ''
    if (rp) rp.innerHTML = ''
  }

  private positionHtmlPanels() {
    const canvas = this.game.canvas
    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width / this.scale.width
    const scaleY = rect.height / this.scale.height

    const mapScreenX = rect.left + this.MAP_X * scaleX
    const mapScreenRight = rect.left + (this.MAP_X + this.MAP_W) * scaleX
    const topY = rect.top + 12 * scaleY

    const lp = document.getElementById('left-panel') as HTMLElement
    const rp = document.getElementById('right-panel') as HTMLElement
    if (lp) {
      const lpW = lp.offsetWidth || 140
      lp.style.left = `${mapScreenX - lpW - 8}px`
      lp.style.top = `${topY}px`
      lp.style.right = 'auto'
    }
    if (rp) {
      rp.style.left = `${mapScreenRight + 8}px`
      rp.style.right = 'auto'
      rp.style.top = `${topY}px`
    }
  }

  private drawRightButtons(_cx: number, _startY: number) { /* no-op: HTML */ }

  private drawTeamToggle() { /* no-op: HTML */ }

  private drawTeamPanel() {
    const lp = document.getElementById('left-panel')
    if (!lp) return
    lp.innerHTML = ''

    let dragSrcIdx = -1

    const teamSec = document.createElement('div')
    teamSec.className = 'panel-section'
    teamSec.style.cssText = 'display:flex;flex-direction:column;gap:4px;padding:6px;margin-bottom:0;'
    lp.appendChild(teamSec)

    for (let i = 0; i < 6; i++) {
      const p = this.playerTeam[i]
      const card = document.createElement('div')
      card.className = 'team-card' + (p ? '' : ' empty')
      card.dataset.idx = String(i)

      if (!p) {
        card.textContent = '—'
      } else {
        const hpRatio = Math.max(0, p.hp / p.maxHp)
        const hpColor = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.2 ? '#FFC107' : '#F44336'
        const sUrl = spriteUrl(p.id, false)
        card.innerHTML = `
          <img src="${sUrl}" alt="${p.name}" draggable="false" />
          <div class="slot-info">
            <div class="slot-name">${p.name}</div>
            <div class="slot-level">Nv.${p.level}</div>
            <div class="slot-hp-wrap"><div class="slot-hp-bar" style="width:${Math.round(hpRatio*100)}%;background:${hpColor}"></div></div>
          </div>`
        card.draggable = true
        card.addEventListener('dragstart', (e) => {
          dragSrcIdx = i
          card.style.opacity = '0.4'
          e.dataTransfer!.effectAllowed = 'move'
        })
        card.addEventListener('dragend', () => { card.style.opacity = '' })

        card.addEventListener('mouseenter', (e) => {
          let tip = document.getElementById('team-stats-tip')
          if (!tip) { tip = document.createElement('div'); tip.id = 'team-stats-tip'; document.body.appendChild(tip) }
          tip.style.cssText = `position:fixed;background:#111122ee;border:2px solid #FFD700;padding:10px 14px;color:#fff;font:7px 'Press Start 2P',monospace;pointer-events:none;z-index:9999;white-space:pre;line-height:2`
          const heldLine = (p as any).heldItem ? `\n🎒 ${(p as any).heldItem}` : ''
          tip.textContent = `${p.name} Nv.${p.level}\nPS: ${p.hp}/${p.maxHp}\nATK: ${p.attack}\nDEF: ${p.defense}\nVEL: ${p.speed}${heldLine}`
          tip.style.left = (e.clientX + 14) + 'px'
          tip.style.top = (e.clientY - 10) + 'px'
          tip.style.display = 'block'
        })
        card.addEventListener('mousemove', (e) => {
          const tip = document.getElementById('team-stats-tip')
          if (tip) { tip.style.left = (e.clientX + 14) + 'px'; tip.style.top = (e.clientY - 10) + 'px' }
        })
        card.addEventListener('mouseleave', () => {
          const tip = document.getElementById('team-stats-tip')
          if (tip) tip.style.display = 'none'
        })
      }

      card.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer!.dropEffect = 'move'; card.style.outline = '2px solid #FFD700' })
      card.addEventListener('dragleave', () => { card.style.outline = '' })
      card.addEventListener('drop', (e) => {
        e.preventDefault()
        card.style.outline = ''
        const dstIdx = i
        if (dragSrcIdx === -1 || dragSrcIdx === dstIdx) return
        if (!this.playerTeam[dragSrcIdx] || !this.playerTeam[dstIdx]) return
        const tmp = this.playerTeam[dragSrcIdx]
        this.playerTeam[dragSrcIdx] = this.playerTeam[dstIdx]
        this.playerTeam[dstIdx] = tmp
        dragSrcIdx = -1
        this.drawTeamPanel()
      })

      teamSec.appendChild(card)
    }

    // Badges below team
    const collected = new Set(this.mapManager.collectedMedals.map((m: any) => m.gymLeaderName))
    const badgeSec = document.createElement('div')
    badgeSec.className = 'panel-section'
    badgeSec.innerHTML = `<div class="panel-section-label">MEDALLAS (${this.mapManager.getMedalCount()}/8)</div>`
    const grid = document.createElement('div')
    grid.className = 'badge-grid'
    Object.keys(BADGE_SPRITES).forEach(name => {
      const item = document.createElement('div')
      item.className = 'badge-item'
      item.style.background = collected.has(name) ? '#ffd700' : '#333'
      item.style.opacity = collected.has(name) ? '1' : '0.2'
      const url = BADGE_SPRITES[name]
      if (url) item.innerHTML = `<img src="${url}" alt="${name}" style="width:100%;height:100%;object-fit:contain;" />`
      grid.appendChild(item)
    })
    badgeSec.appendChild(grid)
    lp.appendChild(badgeSec)

    // Map info
    const currentMap = this.mapManager.getCurrentMap()
    const infoSec = document.createElement('div')
    infoSec.className = 'panel-section'
    infoSec.innerHTML = `<div class="panel-section-label">MAPA</div>
      <div class="panel-info">${currentMap.gymLeaderName}<br>${currentMap.themeName}</div>
`
    lp.appendChild(infoSec)

    // Roguelike synergy
    if (this.roguelikeMode) {
      const syn = this.getActiveSynergy()
      const synDiv = document.createElement('div')
      synDiv.className = 'synergy-badge'
      synDiv.style.color = syn ? syn.color : '#ff4444'
      const clsLabel = this.trainerClass ? this.trainerClass.toUpperCase() : ''
      synDiv.textContent = `◆ ROGUELIKE ${clsLabel}${syn ? ' · ' + syn.name : ''}`
      lp.appendChild(synDiv)
    }

    const mkIconBtn = (imgSrc: string, label: string, active = false) => {
      const btn = document.createElement('button')
      btn.className = `panel-btn${active ? ' speed-active' : ''}`
      btn.innerHTML = `<img src="${imgSrc}" style="width:28px;height:28px;image-rendering:pixelated;vertical-align:middle;margin-right:6px;">${label}`
      return btn
    }

    const btnSec = document.createElement('div')
    btnSec.className = 'panel-section'
    btnSec.style.cssText = 'display:flex;flex-direction:column;gap:4px;padding:6px;'
    lp.appendChild(btnSec)

    const speedBtn = mkIconBtn('/assets/trainers/bici.png', this.battleSpeed === 3 ? 'x2 RAPIDO' : 'x1 NORMAL', this.battleSpeed === 3)
    speedBtn.onclick = () => { this.battleSpeed = this.battleSpeed === 3 ? 2 : 3; this.drawTeamPanel() }
    btnSec.appendChild(speedBtn)

    const goldBtn = mkIconBtn('/assets/locations/moneda.png', `${this.playerGold} MONEDAS`)
    goldBtn.style.cssText += 'color:#000000;'
    btnSec.appendChild(goldBtn)

    const bagBtn = mkIconBtn('/assets/Mochila_DP_(chico).png', 'MOCHILA')
    bagBtn.onclick = () => {
      if (this.eventOccurred) return
      this.setSceneUiVisible(false)
      this.scene.pause()
      this.scene.launch('BagScene', { playerTeam: this.playerTeam, playerBag: this.playerBag, onComplete: () => { this.setSceneUiVisible(true); this.updateHud() } })
    }
    btnSec.appendChild(bagBtn)

    const menuBtn = mkIconBtn('/assets/80px-Cuerda_huida_EP.png', 'MENU')
    menuBtn.onclick = () => { if (!this.roguelikeMode) this.registry.set('hasSavedGame', true); this.scene.start('MainMenuScene') }
    btnSec.appendChild(menuBtn)
  }

  private renderRightPanel() {
    const rp = document.getElementById('right-panel')
    if (rp) rp.innerHTML = ''
  }

  private setupSlotDrag() { /* drag moved to HTML panel */ }

  private onNodeClick(node: MapNode) {
    if (this.eventOccurred) return
    if (!this.platformManager || !this.eventPopup) return

    this.eventOccurred = true
    this.setSceneUiVisible(false)
    this.platformManager.setCurrentNode(node.id)

    const currentMap = this.mapManager.getCurrentMap()
    const result = this.eventManager.handleEvent(
      node as any,
      this.playerTeam,
      currentMap.difficulty,
      currentMap.gymLeaderName,
      currentMap.bossMaxLevel,
      currentMap.wildMinLevel,
      currentMap.wildMaxLevel,
      currentMap.ghostOnly,
      this.mapManager.currentMapId
    )

    if (result.requiresBattle && result.enemyTeam && result.battleType) {
      this.scene.pause()
      const syn = this.getActiveSynergy()
      this.scene.launch('BattleScene', {
        playerTeam: this.playerTeam,
        enemyTeam: result.enemyTeam,
        battleType: result.battleType,
        gymLeaderName: currentMap.gymLeaderName,
        playerBag: this.playerBag,
        synergyBonuses: syn ? { atk: syn.atkBonus, def: syn.defBonus, spd: syn.spdBonus } : undefined,
        battleSpeed: this.battleSpeed,
        backgroundKey: result.isDouble ? 'dobles-bg' : undefined,
        isDouble: result.isDouble ?? false,
        onComplete: (won: boolean) => this.onBattleEnd(won, result.battleType!, result.isDouble ?? false)
      })
    } else if (result.requiresItemPicker) {
      this.scene.pause()
      this.scene.launch('ItemPickerScene', {
        playerTeam: this.playerTeam,
        playerBag: this.playerBag,
        onComplete: (picked?: Item) => {
          this.setSceneUiVisible(true)
          this.eventOccurred = false
          if (picked) this.showToast(`¡${picked.name} añadido a la mochila!`)
          this.updateHud()
        }
      })
    } else if (result.requiresCapturePicker && result.captureOptions) {
      this.scene.pause()
      this.scene.launch('CaptureScene', {
        playerTeam: this.playerTeam,
        options: result.captureOptions,
        onComplete: (caught?: Pokemon) => {
          this.setSceneUiVisible(true)
          this.eventOccurred = false
          if (caught) this.showToast(`¡${caught.name} capturado!`)
          this.updateHud()
        }
      })
    } else if (result.requiresRandomPicker) {
      this.scene.pause()
      this.scene.launch('RandomPickerScene', {
        playerTeam: this.playerTeam,
        difficulty: currentMap.difficulty,
        onComplete: (captureOptions?: Pokemon[]) => {
          this.eventOccurred = false
          if (!captureOptions || captureOptions.length === 0) {
            this.setSceneUiVisible(true)
            this.updateHud()
            return
          }
          this.scene.pause()
          this.scene.launch('CaptureScene', {
            playerTeam: this.playerTeam,
            options: captureOptions,
            onComplete: (caught?: Pokemon) => {
              this.setSceneUiVisible(true)
              this.eventOccurred = false
              if (caught) this.showToast(`¡${caught.name} capturado!`)
              this.updateHud()
            }
          })
        }
      })
    } else if (result.requiresBerryTree) {
      this.scene.pause()
      const data: BerryTreeData = {
        playerTeam: this.playerTeam,
        playerBag: this.playerBag,
        onComplete: () => {
          this.setSceneUiVisible(true)
          this.eventOccurred = false
          this.showToast('🍓 ¡Recompensa de Árbol de Bayas obtenida!')
          this.updateHud()
        }
      }
      this.scene.launch('BerryTreeScene', data)
    } else if (result.requiresDojo) {
      this.scene.pause()
      const data: DojoSceneData = {
        playerTeam: this.playerTeam,
        onComplete: () => {
          this.setSceneUiVisible(true)
          this.eventOccurred = false
          this.showToast('🥋 ¡Entrenamiento completado! Stats mejorados.')
          this.updateHud()
        }
      }
      this.scene.launch('DojoScene', data)
    } else if (result.requiresProfessor) {
      this.scene.pause()
      const data: ProfessorSceneData = {
        playerTeam: this.playerTeam,
        difficulty: currentMap.difficulty,
        onComplete: (newTeam: Pokemon[]) => {
          this.setSceneUiVisible(true)
          this.playerTeam = newTeam
          this.eventOccurred = false
          this.showToast('🔬 ¡El Profesor te ayudó!')
          this.updateHud()
        }
      }
      this.scene.launch('ProfessorScene', data)
    } else if (result.requiresPortal && result.portalPokemon) {
      const legendary = result.portalPokemon
      this.showToast(`✨ ¡Portal! ${legendary.name} Nv.${legendary.level} aparece...`)
      this.time.delayedCall(1000, () => {
        this.scene.pause()
        const syn = this.getActiveSynergy()
        this.scene.launch('BattleScene', {
          playerTeam: this.playerTeam,
          enemyTeam: [legendary],
          battleType: 'wild',
          gymLeaderName: currentMap.gymLeaderName,
          playerBag: this.playerBag,
          synergyBonuses: syn ? { atk: syn.atkBonus, def: syn.defBonus, spd: syn.spdBonus } : undefined,
          battleSpeed: this.battleSpeed,
          backgroundKey: 'celeste-bg',
          onComplete: (won: boolean) => {
            if (won) {
              this.scene.pause()
              this.scene.launch('CaptureScene', {
                playerTeam: this.playerTeam,
                options: [legendary],
                onComplete: (caught?: Pokemon) => {
                  this.setSceneUiVisible(true)
                  this.eventOccurred = false
                  if (caught) this.showToast(`✨ ¡${caught.name} legendario capturado!`)
                  this.updateHud()
                }
              })
            } else {
              this.onBattleEnd(false, 'wild')
            }
          }
        })
      })
    } else if (result.requiresMerchant) {
      this.scene.pause()
      this.setSceneUiVisible(false)
      this.scene.launch('MerchantScene', {
        playerTeam: this.playerTeam,
        playerBag: this.playerBag,
        playerGold: this.playerGold,
        onComplete: (gold: number) => {
          this.playerGold = gold
          this.setSceneUiVisible(true)
          this.eventOccurred = false
          this.updateHud()
        }
      })
    } else if (result.type === 'pokemon_center') {
      this.setSceneUiVisible(true)
      this.showToast('¡Centro Pokémon! Equipo curado al completo.')
      this.eventOccurred = false
      this.updateHud()
    } else if (result.type === 'memorial' || result.type === 'narrative') {
      this.setSceneUiVisible(true)
      this.showToast(result.message)
      this.eventOccurred = false
      this.updateHud()
    } else {
      this.setSceneUiVisible(true)
      this.eventPopup.show(result, () => {
        this.eventOccurred = false
        this.updateHud()
      })
    }
  }

  private setSceneUiVisible(visible: boolean) {
    this.cameras.main.setVisible(visible)
    const display = visible ? '' : 'none'
    const lp = document.getElementById('left-panel')
    const rp = document.getElementById('right-panel')
    if (lp) lp.style.display = display
    if (rp) rp.style.display = display
  }

  private onBattleEnd(won: boolean, battleType: 'wild' | 'trainer' | 'boss', isDouble: boolean = false) {
    this.setSceneUiVisible(true)
    this.eventOccurred = false

    if (!won) {
      this.playerTeam = []
      this.playerGold = 0
      this.mapManager.currentMapId = 0
      this.mapManager.collectedMedals = []
      this.registry.set('hasSavedGame', false)
      const msg = this.roguelikeMode
        ? '¡Run terminada! El roguelike no perdona...'
        : '¡Has perdido! Volviendo al menú...'
      this.showToast(msg)
      this.time.delayedCall(1200, () => this.scene.start('MainMenuScene'))
      return
    }

    const { message: rewardMsg, pendingEvolutions } = this.eventManager.applyBattleReward(this.playerTeam, battleType, isDouble)

    // Award gold: 2 per trainer/double, 3 per boss
    if (battleType === 'trainer' || isDouble) { this.playerGold += 2; this.showToast(`+2 monedas de oro! Total: ${this.playerGold} G`) }
    else if (battleType === 'boss') { this.playerGold += 3; this.showToast(`+3 monedas de oro! Total: ${this.playerGold} G`) }

    if (battleType === 'boss') {
      const currentMap = this.mapManager.getCurrentMap()

      if (currentMap.isSpecialZone) {
        // Lavender Town / special zones: no medal, apply ghost blessing
        this.playerTeam.forEach(p => {
          if (!p.traits.includes('espectral')) {
            p.traits.push('espectral')
            p.attack = Math.round(p.attack * 1.15)
            p.speed = Math.round(p.speed * 1.15)
          }
        })
        const hasNext = this.mapManager.nextMap()
        this.showToast(`¡Espíritu liberado! Equipo recibe Rasgo Espectral. ${hasNext ? 'Adelante...' : '¡HAS GANADO!'}`)
        const nextMapId = this.mapManager.currentMapId
        const medals = [...this.mapManager.collectedMedals]
        const team = this.playerTeam
        const bag = this.playerBag
        this.time.delayedCall(1000, () => this.scene.start('GameScene', {
          resumeMapId: nextMapId,
          resumeMedals: medals,
          resumeTeam: team,
          resumeBag: bag,
          resumeGold: this.playerGold,
          gameMode: this.roguelikeMode ? 'roguelike' : 'normal',
          trainerClass: this.trainerClass
        }))
        return
      }

      this.mapManager.addMedal({
        name: currentMap.name,
        badgeNumber: currentMap.id,
        gymLeaderName: currentMap.gymLeaderName
      })

      const hasNext = this.mapManager.nextMap()
      this.showToast(`¡Medalla nº${this.mapManager.getMedalCount()}! ${hasNext ? 'Siguiente gimnasio...' : '¡HAS GANADO!'}`)
      const nextMapId = this.mapManager.currentMapId
      const medals = [...this.mapManager.collectedMedals]
      const team = this.playerTeam
      const bag = this.playerBag
      this.time.delayedCall(1000, () => this.scene.start('GameScene', {
        resumeMapId: nextMapId,
        resumeMedals: medals,
        resumeTeam: team,
        resumeBag: bag,
        resumeGold: this.playerGold,
        gameMode: this.roguelikeMode ? 'roguelike' : 'normal',
        trainerClass: this.trainerClass
      }))
    } else {
      this.updateHud()
      this.showToast(`¡Victoria! ${rewardMsg}`)
    }

    if (pendingEvolutions.length > 0) {
      this.time.delayedCall(600, () => {
        this.scene.pause()
        this.scene.launch('EvoPickerScene', {
          pokemon: pendingEvolutions[0],
          onComplete: () => {
            this.scene.resume('GameScene')
            this.updateHud()
          }
        })
      })
    }
  }

  private showToast(msg: string) {
    const t = this.add.text(this.scale.width / 2, 60, msg, {
      font: 'bold 14px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setDepth(300).setScrollFactor(0)
    this.tweens.add({
      targets: t, alpha: 0, duration: 600, delay: 1200,
      onComplete: () => t.destroy()
    })
  }
}

