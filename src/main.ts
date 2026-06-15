import Phaser from 'phaser'
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

const isMobile = window.innerWidth < 1024 || window.innerHeight < 600
export const GAME_W = isMobile ? 800 : 1600
export const GAME_H = isMobile ? 500 : 1000

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H,
  },
  render: {
    pixelArt: true,
    antialias: false,
    powerPreference: 'high-performance'
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
  scene: [MainMenuScene, StartScene, GameScene, BattleScene, ItemPickerScene, BagScene, TeamOrderScene, CaptureScene, RandomPickerScene, BerryTreeScene, DojoScene, ProfessorScene, EvoPickerScene]
}

new Phaser.Game(config)
