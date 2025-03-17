import PowerItem from './power-item'

// 炸弹道具图片
const BOMB_IMG_SRC = 'images/bomb.png'
const BOMB_WIDTH = 40
const BOMB_HEIGHT = 40

/**
 * 炸弹道具类
 */
export default class Bomb extends PowerItem {
  constructor() {
    super(BOMB_IMG_SRC, BOMB_WIDTH, BOMB_HEIGHT, 'bomb')
  }
}
