import Animation from '../base/animation'
import DataBus   from '../databus'

const ENEMY_IMG_SRC = 'images/enemy.png'
const ENEMY_WIDTH   = 72
const ENEMY_HEIGHT  = 43

const __ = {
  speed: Symbol('speed')
}

let databus = new DataBus()

function rnd(start, end){
  return Math.floor(Math.random() * (end - start) + start)
}

export default class Enemy extends Animation {
  constructor() {
    super(ENEMY_IMG_SRC, ENEMY_WIDTH, ENEMY_HEIGHT)

    this.initExplosionAnimation()
  }

  init(speed) {
    this.x = rnd(0, window.innerWidth - ENEMY_WIDTH)
    this.y = -this.height

    this[__.speed] = speed

    this.visible = true
  }

  // 预定义爆炸的帧动画
  initExplosionAnimation() {
    let frames = []

    const EXPLO_IMG_PREFIX  = 'images/explosion'
    const EXPLO_FRAME_COUNT = 19

    for ( let i = 0;i < EXPLO_FRAME_COUNT;i++ ) {
      frames.push(EXPLO_IMG_PREFIX + (i + 1) + '.png')
    }

    this.initFrames(frames)
  }

  // 每一帧更新子弹位置
  update() {
    this.y += this[__.speed]

    // 对象回收
    if ( this.y > window.innerHeight + this.height )
      databus.removeEnemey(this)
  }

  /**
   * 改进的碰撞检测方法
   * 使用更精确的矩形碰撞检测
   * @param {Sprite} sp: 精灵实例
   */
  isCollideWith(sp) {
    // 如果正在播放爆炸动画，则不进行碰撞检测
    if (this.isPlaying) {
      return false
    }

    // 获取敌机的碰撞区域（缩小20%以提高游戏体验）
    const enemyLeft = this.x + this.width * 0.1
    const enemyRight = this.x + this.width * 0.9
    const enemyTop = this.y + this.height * 0.1
    const enemyBottom = this.y + this.height * 0.9

    // 获取另一个精灵的碰撞区域
    const spLeft = sp.x
    const spRight = sp.x + sp.width
    const spTop = sp.y
    const spBottom = sp.y + sp.height

    // 检查两个矩形是否重叠
    if (!this.visible || !sp.visible) {
      return false
    }

    // 矩形碰撞检测
    return !(
      enemyRight < spLeft ||
      enemyLeft > spRight ||
      enemyBottom < spTop ||
      enemyTop > spBottom
    )
  }
}
