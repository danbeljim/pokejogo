import Phaser from 'phaser'
import GameScene from './scenes/GameScene'
import BattleScene from './scenes/BattleScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 500 },
      debug: false
    }
  },
  scene: [GameScene, BattleScene]
}

new Phaser.Game(config)
