import PowerItem from './power-item'

// 护盾道具图片
const SHIELD_IMG_SRC = 'images/shield.png'
const SHIELD_WIDTH = 40
const SHIELD_HEIGHT = 40

/**
 * 护盾道具类
 */
export default class Shield extends PowerItem {
  constructor() {
    super(SHIELD_IMG_SRC, SHIELD_WIDTH, SHIELD_HEIGHT, 'shield')
    
    // 护盾持续时间（帧数）
    this.duration = 300  // 约5秒 (60帧/秒)
  }
}
