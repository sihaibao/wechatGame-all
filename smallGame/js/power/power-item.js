import Sprite from '../base/sprite'

const screenWidth = window.innerWidth
const screenHeight = window.innerHeight

/**
 * 道具基类
 */
export default class PowerItem extends Sprite {
  constructor(imgSrc, width, height, type) {
    super(imgSrc, width, height)

    // 道具类型: 'weapon', 'shield', 'bomb'
    this.type = type
    
    // 道具移动速度
    this.speed = 2
    
    // 道具是否可见
    this.visible = true
    
    // 初始化道具位置
    this.init()
  }

  init() {
    // 随机位置从屏幕上方出现
    this.x = Math.random() * (screenWidth - this.width)
    this.y = -this.height
  }

  // 道具每一帧的更新
  update() {
    if (!this.visible)
      return

    // 道具向下移动
    this.y += this.speed

    // 超出屏幕底部后设为不可见
    if (this.y > screenHeight)
      this.visible = false
  }

  // 检测道具是否与玩家碰撞
  isCollideWith(player) {
    if (!this.visible || !player.visible)
      return false

    // 获取道具的碰撞区域
    const itemLeft = this.x
    const itemRight = this.x + this.width
    const itemTop = this.y
    const itemBottom = this.y + this.height

    // 获取玩家的碰撞区域
    const playerLeft = player.x
    const playerRight = player.x + player.width
    const playerTop = player.y
    const playerBottom = player.y + player.height

    // 矩形碰撞检测
    return !(
      itemRight < playerLeft ||
      itemLeft > playerRight ||
      itemBottom < playerTop ||
      itemTop > playerBottom
    )
  }
}
