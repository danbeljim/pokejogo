import Phaser from 'phaser'
import MainMenuScene from './scenes/MainMenuScene'
import GameScene from './scenes/GameScene'
import BattleScene from './scenes/BattleScene'
import StartScene from './scenes/StartScene'
import ItemPickerScene from './scenes/ItemPickerScene'
import BagScene from './scenes/BagScene'
import TeamOrderScene from './scenes/TeamOrderScene'
import CaptureScene from './scenes/CaptureScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1600,
  height: 1000,
  backgroundColor: '#000000',
  render: {
    pixelArt: true,
    antialias: false,
    powerPreference: 'high-performance'
  },
  fps: { target: 60, forceSetTimeOut: false },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 500 },
      debug: false
    }
  },
  scene: [MainMenuScene, StartScene, GameScene, BattleScene, ItemPickerScene, BagScene, TeamOrderScene, CaptureScene]
}

new Phaser.Game(config)
