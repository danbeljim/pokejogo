import { useEffect, useRef } from 'react'
import GameScene from './scenes/GameScene'
import './App.css'

export default function App() {
  const gameRef = useRef(null)

  useEffect(() => {
    const Phaser = require('phaser')

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
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
  }, [])

  return <div ref={gameRef} />
}
