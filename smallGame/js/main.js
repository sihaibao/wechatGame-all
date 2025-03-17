import Player from './player/index'
import Enemy from './npc/enemy'
import BackGround from './runtime/background'
import GameInfo from './runtime/gameinfo'
import Music from './runtime/music'
import DataBus from './databus'
// 导入道具类
import Weapon from './power/weapon'
import Shield from './power/shield'
import Bomb from './power/bomb'

let ctx = canvas.getContext('2d')
let databus = new DataBus()

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    // 维护当前requestAnimationFrame的id
    this.aniId = 0

    this.restart()
  }

  restart() {
    databus.reset()

    canvas.removeEventListener(
      'touchstart',
      this.touchHandler
    )

    this.bg = new BackGround(ctx)
    this.player = new Player(ctx)
    this.gameinfo = new GameInfo()
    this.music = new Music()

    this.bindLoop = this.loop.bind(this)
    this.hasEventBind = false

    // 清除上一局的动画
    window.cancelAnimationFrame(this.aniId);

    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }

  /**
   * 随着帧数变化的敌机生成逻辑
   * 帧数取模定义成生成的频率
   */
  enemyGenerate() {
    if (databus.frame % 30 === 0) {
      let enemy = databus.pool.getItemByClass('enemy', Enemy)
      enemy.init(6)
      databus.enemys.push(enemy)
    }
  }

  /**
   * 随着帧数变化的道具生成逻辑
   * 帧数取模定义成生成的频率
   */
  powerItemGenerate() {
    // 每隔300帧（约5秒）生成一个道具
    if (databus.frame % 300 === 0) {
      // 随机决定生成哪种道具
      const random = Math.random()
      let powerItem
      
      if (random < 0.5) {
        // 50%概率生成武器升级
        powerItem = databus.pool.getItemByClass('weapon', Weapon)
      } else if (random < 0.8) {
        // 30%概率生成护盾
        powerItem = databus.pool.getItemByClass('shield', Shield)
      } else {
        // 20%概率生成炸弹
        powerItem = databus.pool.getItemByClass('bomb', Bomb)
      }
      
      databus.powerItems.push(powerItem)
    }
  }

  // 全局碰撞检测
  collisionDetection() {
    let that = this

    databus.bullets.forEach((bullet) => {
      for (let i = 0, il = databus.enemys.length; i < il; i++) {
        let enemy = databus.enemys[i]

        if (!enemy.isPlaying && enemy.isCollideWith(bullet)) {
          enemy.playAnimation()
          that.music.playExplosion()

          bullet.visible = false
          databus.score += 1

          break
        }
      }
    })

    // 道具与玩家的碰撞检测
    for (let i = 0; i < databus.powerItems.length; i++) {
      let powerItem = databus.powerItems[i]
      
      if (powerItem.isCollideWith(this.player)) {
        // 播放获得道具的音效
        that.music.playShoot()
        
        // 应用道具效果
        this.player.applyPowerItem(powerItem)
        
        // 设置道具为不可见
        powerItem.visible = false
        
        // 从数组中移除道具
        databus.powerItems.splice(i, 1)
        i--
      }
    }

    for (let i = 0, il = databus.enemys.length; i < il; i++) {
      let enemy = databus.enemys[i]

      if (this.player.isCollideWith(enemy)) {
        databus.gameOver = true
        
        // 游戏结束时保存最高分
        databus.saveHighScore()

        break
      }
    }
  }

  // 游戏结束后的触摸事件处理逻辑
  touchEventHandler(e) {
    e.preventDefault()

    let x = e.touches[0].clientX
    let y = e.touches[0].clientY

    let area = this.gameinfo.btnArea

    if (x >= area.startX
      && x <= area.endX
      && y >= area.startY
      && y <= area.endY) {
      this.restart()
      
      // 播放按钮音效
      this.music.playShoot()
    }
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    this.bg.render(ctx)

    // 绘制道具
    databus.powerItems.forEach((item) => {
      item.drawToCanvas(ctx)
    })

    databus.bullets
      .concat(databus.enemys)
      .forEach((item) => {
        item.drawToCanvas(ctx)
      })

    this.player.drawToCanvas(ctx)

    databus.animations.forEach((ani) => {
      if (ani.isPlaying) {
        ani.aniRender(ctx)
      }
    })

    // 传入最高分数据
    this.gameinfo.renderGameScore(ctx, databus.score, databus.highScore)

    // 游戏结束停止帧循环
    if (databus.gameOver) {
      // 传入最高分数据
      this.gameinfo.renderGameOver(ctx, databus.score, databus.highScore)

      if (!this.hasEventBind) {
        this.hasEventBind = true
        this.touchHandler = this.touchEventHandler.bind(this)
        canvas.addEventListener('touchstart', this.touchHandler)
      }
    }
  }

  // 游戏逻辑更新主函数
  update() {
    if (databus.gameOver)
      return;

    this.bg.update()

    // 更新道具位置
    databus.powerItems.forEach((item) => {
      item.update()
    })

    // 移除屏幕外的道具
    databus.powerItems = databus.powerItems.filter((item) => item.visible)

    databus.bullets
      .concat(databus.enemys)
      .forEach((item) => {
        item.update()
      })

    // 更新玩家道具状态
    this.player.updatePowerStatus()

    this.enemyGenerate()
    this.powerItemGenerate()

    this.collisionDetection()

    if (databus.frame % 20 === 0) {
      this.player.shoot()
      this.music.playShoot()
    }
  }

  // 实现游戏帧循环
  loop() {
    databus.frame++

    this.update()
    this.render()

    this.aniId = window.requestAnimationFrame(
      this.bindLoop,
      canvas
    )
  }
}
