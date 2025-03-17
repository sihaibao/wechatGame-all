import PowerItem from './power-item'

// 武器升级道具图片
const WEAPON_IMG_SRC = 'images/weapon.png'
const WEAPON_WIDTH = 40
const WEAPON_HEIGHT = 40

/**
 * 武器升级道具类
 */
export default class Weapon extends PowerItem {
  constructor() {
    super(WEAPON_IMG_SRC, WEAPON_WIDTH, WEAPON_HEIGHT, 'weapon')
    
    // 武器升级持续时间（帧数）
    this.duration = 600  // 约10秒 (60帧/秒)
  }
}
