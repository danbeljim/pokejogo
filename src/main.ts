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
  game.canvas.style.transform = `rotate(-90deg) scale(${k})`;
  // updateBounds re-reads getBoundingClientRect (now rotated AABB) so
  // transformPointer's fakePageX/Y math aligns with actual canvasBounds.
  // Does NOT fire RESIZE — no loop.
  (game.scale as any).updateBounds()
}

function removeCSSTransform() {
  game.canvas.style.transform = ''
  game.canvas.style.transformOrigin = '';
  (game.scale as any).updateBounds()
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
    // Always call orig for bookkeeping (isDown, event ref, button state, etc.)
    orig(pointer, pageX, pageY, wasMove)
    if (!isPortrait) return

    const vw = window.innerWidth
    const vh = window.innerHeight
    const S = getPortraitScale(vw, vh)

    // Undo canvas rotate(-90deg): screen touch → game coords
    const gx = (vh / 2 - pageY) / S + GAME_W / 2
    const gy = (pageX - vw / 2) / S + GAME_H / 2

    // Overwrite whatever orig set — only position/world matter for hit testing
    pointer.position.x = gx
    pointer.position.y = gy
    pointer.worldX = gx
    pointer.worldY = gy
    if (wasMove) {
      pointer.midPoint.x = gx
      pointer.midPoint.y = gy
    }
  }

  window.addEventListener('resize', () => setTimeout(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const portrait = vh > vw
    isPortrait = portrait
    if (portrait) applyPortraitCSS(vw, vh)
    else removeCSSTransform()
  }, 100))
  window.addEventListener('orientationchange', () => setTimeout(checkOrientation, 200))
  checkOrientation()
})
