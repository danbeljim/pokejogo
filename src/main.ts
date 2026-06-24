import Phaser from 'phaser'
import { loadAllBaseStats } from './data/StatLoader'
import { POKEMON_LIST } from './entities/PokemonFactory'
import MainMenuScene from './scenes/MainMenuScene'
import GameScene from './scenes/GameScene'
import BattleScene from './scenes/BattleScene'
import StartScene from './scenes/StartScene'
import ItemPickerScene from './scenes/ItemPickerScene'
import BagScene from './scenes/BagScene'
import TeamOrderScene from './scenes/TeamOrderScene'
import CaptureScene from './scenes/CaptureScene'
import RandomPickerScene from './scenes/RandomPickerScene'
import BerryTreeScene from './scenes/BerryTreeScene'
import DojoScene from './scenes/DojoScene'
import ProfessorScene from './scenes/ProfessorScene'
import EvoPickerScene from './scenes/EvoPickerScene'
import WorldMapScene from './scenes/WorldMapScene'
import MerchantScene from './scenes/MerchantScene'
import CardMenuScene from './scenes/card/CardMenuScene'
import CardMapScene from './scenes/card/CardMapScene'
import CardActTransitionScene from './scenes/card/CardActTransitionScene'
import SafariMapScene from './scenes/card/SafariMapScene'
import CardBattleScene from './scenes/card/CardBattleScene'
import CardRewardScene from './scenes/card/CardRewardScene'
import CardShopScene from './scenes/card/CardShopScene'
import CardRestScene from './scenes/card/CardRestScene'
import CardEventScene from './scenes/card/CardEventScene'
import CardDeathScene from './scenes/card/CardDeathScene'
import CardDeckEditorScene from './scenes/card/CardDeckEditorScene'

const isMobile = window.innerWidth < 1024 || window.innerHeight < 600
export const GAME_W = isMobile ? 800 : 1600
export const GAME_H = isMobile ? 500 : 1000

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#5DADE2',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container',
    width: GAME_W,
    height: GAME_H,
  },
  render: {
    pixelArt: true,
    antialias: false,
    powerPreference: 'high-performance',
    willReadFrequently: true
  },
  fps: { target: 60, forceSetTimeOut: false },
  input: {
    touch: { capture: false }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 500 },
      debug: false
    }
  },
  scene: [MainMenuScene, WorldMapScene, StartScene, GameScene, BattleScene, ItemPickerScene, BagScene, TeamOrderScene, CaptureScene, RandomPickerScene, BerryTreeScene, DojoScene, ProfessorScene, EvoPickerScene, MerchantScene, CardMenuScene, CardMapScene, SafariMapScene, CardActTransitionScene, CardBattleScene, CardRewardScene, CardShopScene, CardRestScene, CardEventScene, CardDeathScene, CardDeckEditorScene]
}

new Phaser.Game(config)

const BG = 'linear-gradient(180deg,#5DADE2 0%,#5DADE2 45%,#4A90E2 45%,#4A90E2 55%,#4CAF50 55%,#4CAF50 100%)'
// Inject a gradient div INSIDE game-container so it sits behind the canvas
// regardless of what Phaser sets as background-color on game-container itself
const _bgDiv = document.createElement('div')
_bgDiv.style.cssText = `position:absolute;inset:0;background:${BG};z-index:-1;pointer-events:none;`
const _gc = document.getElementById('game-container')
if (_gc) {
  _gc.style.position = 'relative'
  _gc.prepend(_bgDiv)
}

// Fire-and-forget: fetch real base stats from PokéAPI in background.
// Falls back to hardcoded values until fetch completes (no blocking).
loadAllBaseStats(POKEMON_LIST.map(p => p.dexId))
