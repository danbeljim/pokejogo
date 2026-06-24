import './PokedexMenu.css'

export class PokedexMenu {
  private container: HTMLElement
  private onAdventure: () => void
  private onCardMode: () => void

  constructor(onAdventure: () => void, onCardMode: () => void) {
    this.onAdventure = onAdventure
    this.onCardMode = onCardMode
    this.container = document.createElement('div')
    this.container.className = 'pokedex-container'
    this.render()
  }

  private render() {
    this.container.innerHTML = `
      <div class="pokedex">
        <div class="pokedex-title">POKÉMON<br>ROGUELIKE</div>

        <div class="pokedex-menu-center">
          <div class="pokedex-subtitle">Selecciona modo de juego</div>

          <button class="pokedex-menu-btn pokedex-btn-roguelike" id="btn-adventure">
            <span class="btn-icon">⚔️</span>
            <span class="btn-label">MODO AVENTURA</span>
            <span class="btn-desc">Decisiones · Boss</span>
          </button>

          <button class="pokedex-menu-btn pokedex-btn-card" id="btn-cardmode">
            <span class="btn-icon">🃏</span>
            <span class="btn-label">MODO CARTAS</span>
            <span class="btn-desc">Roguelike + Mazo</span>
          </button>
        </div>

        <div class="pokedex-creator">creado por:<br>andrescalzadodev</div>
      </div>
    `

    document.body.appendChild(this.container)
    this.setupButtons()
  }

  private setupButtons() {
    const btnAdventure = this.container.querySelector('#btn-adventure') as HTMLButtonElement
    const btnCard      = this.container.querySelector('#btn-cardmode')  as HTMLButtonElement

    btnAdventure?.addEventListener('click', () => setTimeout(() => this.onAdventure(), 150))
    btnCard?.addEventListener('click',      () => setTimeout(() => this.onCardMode(),  150))
  }

  public remove() {
    this.container.remove()
  }

  public getElement(): HTMLElement {
    return this.container
  }
}
