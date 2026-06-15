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
  scene: [MainMenuScene, StartScene, GameScene, BattleScene, ItemPickerScene, BagScene, TeamOrderScene, CaptureScene, RandomPickerScene]
}

const game = new Phaser.Game(config)

// --- Portrait mode: rotate canvas -90deg so landscape game fills portrait screen ---

let isPortrait = false

function getPortraitScale(vw: number, vh: number): number {
  return Math.min(vw / GAME_H, vh / GAME_W)
}

function applyPortraitCSS(vw: number, vh: number) {
  const P = Math.min(vw / GAME_W, vh / GAME_H) // Phaser FIT scale
  const S = getPortraitScale(vw, vh)             // target combined scale
  const k = S / P
  game.canvas.style.transformOrigin = 'center center'
  game.canvas.style.transform = `rotate(-90deg) scale(${k})`
  game.scale.refresh()
}

function removeCSSTransform() {
  game.canvas.style.transform = ''
  game.canvas.style.transformOrigin = ''
  game.scale.refresh()
}

function checkOrientation() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const portrait = vh > vw
  if (portrait === isPortrait) return
  isPortrait = portrait
  if (portrait) applyPortraitCSS(vw, vh)
  else removeCSSTransform()
}

game.events.once(Phaser.Core.Events.READY, () => {
  // Patch InputManager.transformPointer to remap touch coords when rotated
  const im = game.input as any
  const orig: Function = im.transformPointer.bind(im)

  im.transformPointer = function (pointer: any, pageX: number, pageY: number, wasMove: boolean) {
    if (!isPortrait) return orig(pointer, pageX, pageY, wasMove)

    const vw = window.innerWidth
    const vh = window.innerHeight
    const S = getPortraitScale(vw, vh)
    const P = Math.min(vw / GAME_W, vh / GAME_H)

    // Rotate +90° to invert the canvas -90° rotation, then scale to game coords
    const gx = (vh / 2 - pageY) / S + GAME_W / 2
    const gy = (pageX - vw / 2) / S + GAME_H / 2

    // Convert game coords back to fake page coords that Phaser's normal transform maps correctly
    // Phaser: pos = (page - aabbCorner) * displayScale
    // aabbLeft = vw/2 - S*GAME_H/2, aabbTop = vh/2 - S*GAME_W/2, displayScale = 1/P
    const aabbLeft = vw / 2 - S * GAME_H / 2
    const aabbTop = vh / 2 - S * GAME_W / 2
    const fakePageX = gx * P + aabbLeft
    const fakePageY = gy * P + aabbTop

    return orig(pointer, fakePageX, fakePageY, wasMove)
  }

  // Reapply CSS after Phaser resizes canvas (e.g. window resize in portrait)
  game.scale.on(Phaser.Scale.Events.RESIZE, () => {
    if (isPortrait) applyPortraitCSS(window.innerWidth, window.innerHeight)
  })

  window.addEventListener('resize', () => setTimeout(checkOrientation, 100))
  window.addEventListener('orientationchange', () => setTimeout(checkOrientation, 200))
  checkOrientation()
})
