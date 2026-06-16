import './PokedexMenu.css'

export class PokedexMenu {
  private container: HTMLElement
  private onSelect: (regionId: number) => void
  private mapScale: number = 1
  private readonly MIN_SCALE = 1
  private readonly MAX_SCALE = 3
  private mapOffsetX: number = 0
  private mapOffsetY: number = 0

  constructor(onSelect: (regionId: number) => void, onRoguelike?: () => void) {
    this.onSelect = onSelect
    this.container = document.createElement('div')
    this.container.className = 'pokedex-container'
    this.render()
  }

  private render() {
    this.container.innerHTML = `
      <div class="pokedex">
        <!-- World map center -->
        <div class="pokedex-map-wrap">
          <div class="pokedex-map-inner">
            <img src="/assets/locations/mapa.jpeg" class="pokedex-map-img" draggable="false" />
            <div class="pokedex-map-zone" id="kanto-zone" title="Kanto"></div>
          </div>
        </div>

        <!-- Title -->
        <div class="pokedex-title">POKÉMON<br>ROGUELIKE</div>

        <!-- Creator -->
        <div class="pokedex-creator">creado por:<br>andrescalzadodev</div>

        <!-- Footer -->
        <div class="pokedex-footer"></div>
      </div>
    `

    this.setupMapZone()
    document.body.appendChild(this.container)
  }

  private setupMapZone() {
    const zone = this.container.querySelector('#kanto-zone') as HTMLElement
    const wrap = this.container.querySelector('.pokedex-map-wrap') as HTMLElement
    const inner = this.container.querySelector('.pokedex-map-inner') as HTMLElement
    if (!zone || !wrap || !inner) return

    zone.addEventListener('click', () => {
      setTimeout(() => this.onSelect(1), 150)
    })

    wrap.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 0.1 : -0.1
      this.mapScale = Math.min(this.MAX_SCALE, Math.max(this.MIN_SCALE, this.mapScale + delta))
      if (this.mapScale === this.MIN_SCALE) { this.mapOffsetX = 0; this.mapOffsetY = 0 }
      this.applyMapTransform(inner)
    }, { passive: false })

    let dragging = false
    let startX = 0, startY = 0

    wrap.addEventListener('mousedown', (e: MouseEvent) => {
      if (this.mapScale <= this.MIN_SCALE) return
      dragging = true
      startX = e.clientX - this.mapOffsetX
      startY = e.clientY - this.mapOffsetY
      wrap.style.cursor = 'grabbing'
    })

    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (!dragging) return
      this.mapOffsetX = e.clientX - startX
      this.mapOffsetY = e.clientY - startY
      this.applyMapTransform(inner)
    })

    window.addEventListener('mouseup', () => {
      dragging = false
      wrap.style.cursor = this.mapScale > this.MIN_SCALE ? 'grab' : 'default'
    })
  }


  private applyMapTransform(inner: HTMLElement) {
    const maxX = (inner.clientWidth * (this.mapScale - 1)) / 2
    const maxY = (inner.clientHeight * (this.mapScale - 1)) / 2
    this.mapOffsetX = Math.min(maxX, Math.max(-maxX, this.mapOffsetX))
    this.mapOffsetY = Math.min(maxY, Math.max(-maxY, this.mapOffsetY))
    inner.style.transformOrigin = 'center center'
    inner.style.transform = `scale(${this.mapScale}) translate(${this.mapOffsetX / this.mapScale}px, ${this.mapOffsetY / this.mapScale}px)`
  }

  public remove() {
    this.container.remove()
  }

  public getElement(): HTMLElement {
    return this.container
  }
}
