import Sprite from '../base/sprite'
import DataBus from '../databus'

const SUPER_BOMB_IMG_SRC = 'images/super-bomb.png'
const SUPER_BOMB_WIDTH = 40
const SUPER_BOMB_HEIGHT = 40

const screenWidth = window.innerWidth
const screenHeight = window.innerHeight

let databus = new DataBus()

/**
 * 超级炸弹道具类
 * 通过观看广告获得的特殊道具
 */
export default class SuperBomb extends Sprite {
  constructor() {
    super(SUPER_BOMB_IMG_SRC, SUPER_BOMB_WIDTH, SUPER_BOMB_HEIGHT)
  }

  init() {
    this.x = screenWidth / 2 - this.width / 2
    this.y = screenHeight / 2 - this.height / 2
    
    // 设置道具可见
    this.visible = true
    
    // 设置道具类型
    this.type = 'superBomb'
    
    // 设置道具效果
    this.effect = {
      destroyAllEnemies: true,  // 摧毁所有敌机
      doubleScore: true         // 获得双倍分数
    }
    
    // 设置动画效果
    this.animationTimer = 0
    this.scale = 1
    this.rotation = 0
  }

  /**
   * 道具更新逻辑
   */
  update() {
    // 道具动画效果
    this.animationTimer++
    this.scale = 1 + Math.sin(this.animationTimer / 10) * 0.1
    this.rotation = this.animationTimer % 360
    
    // 道具位置不变，保持在屏幕中央
  }

  /**
   * 绘制到画布上
   */
  drawToCanvas(ctx) {
    if (!this.visible) return
    
    ctx.save()
    
    // 设置旋转中心点
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2)
    
    // 旋转
    ctx.rotate(this.rotation * Math.PI / 180)
    
    // 缩放
    ctx.scale(this.scale, this.scale)
    
    // 绘制图像
    ctx.drawImage(
      this.img,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    )
    
    ctx.restore()
  }
  
  /**
   * 使用超级炸弹
   * 摧毁所有敌机并获得双倍分数
   */
  use() {
    // 摧毁所有敌机
    const enemyCount = databus.enemys.length
    
    databus.enemys.forEach((enemy) => {
      enemy.playAnimation()
    })
    
    // 加分（双倍）
    databus.score += enemyCount * 2
    
    // 清空敌机数组
    databus.enemys = []
    
    // 设置为不可见
    this.visible = false
    
    return {
      enemiesDestroyed: enemyCount,
      scoreGained: enemyCount * 2
    }
  }
}
