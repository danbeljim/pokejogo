import { useEffect } from 'react'
import Phaser from 'phaser'
import GameScene from './scenes/GameScene'
import './App.css'

export default function App() {
  useEffect(() => {
    setTimeout(() => {
      const config = {
        type: Phaser.CANVAS,
        width: 800,
        height: 600,
        canvas: document.getElementById('game-canvas'),
        scene: GameScene,
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false,
          },
        },
      }

      const game = new Phaser.Game(config)
      return () => game.destroy(true)
    }, 0)
  }, [])

  return <canvas id="game-canvas" style={{ display: 'block' }} />
}
