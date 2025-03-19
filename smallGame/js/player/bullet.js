import Sprite   from '../base/sprite'
import DataBus  from '../databus'

const BULLET_IMG_SRC = 'images/bullet.png'
const BULLET_WIDTH   = 10
const BULLET_HEIGHT  = 20

const __ = {
  speed: Symbol('speed')
}

let databus = new DataBus()

export default class Bullet extends Sprite {
  constructor() {
    super(BULLET_IMG_SRC, BULLET_WIDTH, BULLET_HEIGHT)
  }

  init(x, y, speed) {
    this.x = x
    this.y = y

    this[__.speed] = speed

    this.visible = true
  }

  // 每一帧更新子弹位置
  update() {
    this.y -= this[__.speed]

    // 超出屏幕外回收自身
    if ( this.y < -this.height )
      databus.removeBullets(this)
  }

  /**
   * 改进的碰撞检测方法
   * 使用更精确的矩形碰撞检测
   * @param {Sprite} sp: 精灵实例
   */
  isCollideWith(sp) {
    // 获取子弹的碰撞区域
    const bulletLeft = this.x
    const bulletRight = this.x + this.width
    const bulletTop = this.y
    const bulletBottom = this.y + this.height

    // 获取敌机的碰撞区域（缩小10%以提高游戏体验）
    const enemyLeft = sp.x + sp.width * 0.05
    const enemyRight = sp.x + sp.width * 0.95
    const enemyTop = sp.y + sp.height * 0.05
    const enemyBottom = sp.y + sp.height * 0.95

    if (!this.visible || !sp.visible) {
      return false
    }

    // 矩形碰撞检测
    return !(
      bulletRight < enemyLeft ||
      bulletLeft > enemyRight ||
      bulletBottom < enemyTop ||
      bulletTop > enemyBottom
    )
  }
}
