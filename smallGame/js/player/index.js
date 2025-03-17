import Sprite   from '../base/sprite'
import Bullet   from './bullet'
import DataBus  from '../databus'

const screenWidth    = window.innerWidth
const screenHeight   = window.innerHeight

// 玩家相关常量设置
const PLAYER_IMG_SRC = 'images/hero.png'
const PLAYER_WIDTH   = 72   // 432/6 让飞机更小
const PLAYER_HEIGHT  = 43   // 256/6 让飞机更小

// 护盾相关常量
const SHIELD_IMG_SRC = 'images/shield-effect.png'
const SHIELD_WIDTH   = 100
const SHIELD_HEIGHT  = 100

let databus = new DataBus()

export default class Player extends Sprite {
  constructor(ctx) {
    super(PLAYER_IMG_SRC, PLAYER_WIDTH, PLAYER_HEIGHT)

    this.ctx = ctx

    // 玩家默认处于屏幕底部居中位置
    this.x = screenWidth / 2 - this.width / 2
    this.y = screenHeight - this.height - 30

    // 用于在手指移动的时候标识手指是否已经在飞机上了
    this.touched = false

    this.bullets = []

    // 道具效果状态
    this.weaponLevel = 1       // 武器等级 (1-3)
    this.hasShield = false     // 是否有护盾
    this.shieldTime = 0        // 护盾剩余时间
    
    // 护盾特效图片
    this.shieldImg = new Image()
    this.shieldImg.src = SHIELD_IMG_SRC

    // 初始化事件监听
    this.initEvent()
  }

  /**
   * 当手指触摸屏幕的时候
   * 判断手指是否在飞机上
   * @param {Number} x: 手指的X轴坐标
   * @param {Number} y: 手指的Y轴坐标
   * @return {Boolean}: 用于标识手指是否在飞机上的布尔值
   */
  checkIsFingerOnAir(x, y) {
    const deviation = 30

    return !!(   x >= this.x - deviation
              && y >= this.y - deviation
              && x <= this.x + this.width + deviation
              && y <= this.y + this.height + deviation  )
  }

  /**
   * 根据手指的位置设置飞机的位置
   * 保证手指处于飞机中间
   * 同时限定飞机的活动范围限制在屏幕中
   */
  setAirPosAcrossFingerPosZ(x, y) {
    let disX = x - this.width / 2
    let disY = y - this.height / 2

    if ( disX < 0 )
      disX = 0

    else if ( disX > screenWidth - this.width )
      disX = screenWidth - this.width

    if ( disY <= 0 )
      disY = 0

    else if ( disY > screenHeight - this.height )
      disY = screenHeight - this.height

    this.x = disX
    this.y = disY
  }

  /**
   * 玩家响应手指的触摸事件
   * 改变战机的位置
   */
  initEvent() {
    canvas.addEventListener('touchstart', ((e) => {
      e.preventDefault()

      let x = e.touches[0].clientX
      let y = e.touches[0].clientY

      //
      if ( this.checkIsFingerOnAir(x, y) ) {
        this.touched = true

        this.setAirPosAcrossFingerPosZ(x, y)
      }

    }).bind(this))

    canvas.addEventListener('touchmove', ((e) => {
      e.preventDefault()

      let x = e.touches[0].clientX
      let y = e.touches[0].clientY

      if ( this.touched )
        this.setAirPosAcrossFingerPosZ(x, y)

    }).bind(this))

    canvas.addEventListener('touchend', ((e) => {
      e.preventDefault()

      this.touched = false
    }).bind(this))
  }

  /**
   * 玩家射击操作
   * 射击时机由外部决定
   */
  shoot() {
    // 根据武器等级决定发射子弹的数量和位置
    if (this.weaponLevel === 1) {
      // 单发子弹
      this.shootBullet(this.x + this.width / 2 - 5, this.y - 10, 10)
    } 
    else if (this.weaponLevel === 2) {
      // 双发子弹
      this.shootBullet(this.x + this.width / 3 - 5, this.y - 10, 10)
      this.shootBullet(this.x + this.width * 2/3 - 5, this.y - 10, 10)
    } 
    else if (this.weaponLevel === 3) {
      // 三发子弹
      this.shootBullet(this.x + this.width / 2 - 5, this.y - 10, 10)
      this.shootBullet(this.x + 10 - 5, this.y, 10)
      this.shootBullet(this.x + this.width - 10 - 5, this.y, 10)
    }
  }

  /**
   * 发射单个子弹
   */
  shootBullet(x, y, speed) {
    let bullet = databus.pool.getItemByClass('bullet', Bullet)
    bullet.init(x, y, speed)
    databus.bullets.push(bullet)
  }

  /**
   * 应用道具效果
   */
  applyPowerItem(powerItem) {
    switch(powerItem.type) {
      case 'weapon':
        // 武器升级，最高3级
        this.weaponLevel = Math.min(this.weaponLevel + 1, 3)
        // 设置武器升级持续时间
        setTimeout(() => {
          this.weaponLevel = Math.max(this.weaponLevel - 1, 1)
        }, powerItem.duration * 1000 / 60)
        break
        
      case 'shield':
        // 激活护盾
        this.hasShield = true
        this.shieldTime = powerItem.duration
        break
        
      case 'bomb':
        // 清除所有敌机
        databus.enemys.forEach((enemy) => {
          enemy.playAnimation()
        })
        // 加分
        databus.score += databus.enemys.length
        // 清空敌机数组
        databus.enemys = []
        break
    }
  }

  /**
   * 更新护盾状态
   */
  updatePowerStatus() {
    // 更新护盾时间
    if (this.hasShield && this.shieldTime > 0) {
      this.shieldTime--
      if (this.shieldTime <= 0) {
        this.hasShield = false
      }
    }
  }

  /**
   * 检测是否与敌机碰撞
   * 如果有护盾，则不会碰撞
   */
  isCollideWith(sp) {
    if (this.hasShield) {
      return false
    }
    
    let spX = sp.x + sp.width / 2
    let spY = sp.y + sp.height / 2

    if ( !this.visible || !sp.visible )
      return false

    return !!(   spX >= this.x
              && spX <= this.x + this.width
              && spY >= this.y
              && spY <= this.y + this.height  )
  }

  /**
   * 绘制到画布上
   */
  drawToCanvas(ctx) {
    if ( !this.visible )
      return

    // 绘制飞机
    ctx.drawImage(
      this.img,
      this.x,
      this.y,
      this.width,
      this.height
    )

    // 如果有护盾，绘制护盾效果
    if (this.hasShield) {
      ctx.drawImage(
        this.shieldImg,
        this.x - (SHIELD_WIDTH - this.width) / 2,
        this.y - (SHIELD_HEIGHT - this.height) / 2,
        SHIELD_WIDTH,
        SHIELD_HEIGHT
      )
    }
  }
}
