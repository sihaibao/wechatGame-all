import Pool from './base/pool'

let instance

/**
 * 全局状态管理器
 */
export default class DataBus {
  constructor() {
    if ( instance )
      return instance

    instance = this

    this.pool = new Pool()
    
    // 初始化时读取本地存储的最高分
    this.highScore = 0
    this.loadHighScore()

    this.reset()
  }

  reset() {
    this.frame      = 0
    this.score      = 0
    this.bullets    = []
    this.enemys     = []
    this.animations = []
    this.gameOver   = false
  }

  /**
   * 从本地存储加载最高分
   */
  loadHighScore() {
    try {
      const highScore = wx.getStorageSync('highScore')
      if (highScore !== '') {
        this.highScore = highScore
      }
    } catch (e) {
      console.error('读取最高分失败', e)
    }
  }

  /**
   * 保存最高分到本地存储
   */
  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score
      try {
        wx.setStorageSync('highScore', this.highScore)
      } catch (e) {
        console.error('保存最高分失败', e)
      }
    }
  }

  /**
   * 回收敌人，进入对象池
   * 此后不进入帧循环
   */
  removeEnemey(enemy) {
    let temp = this.enemys.shift()

    temp.visible = false

    this.pool.recover('enemy', enemy)
  }

  /**
   * 回收子弹，进入对象池
   * 此后不进入帧循环
   */
  removeBullets(bullet) {
    let temp = this.bullets.shift()

    temp.visible = false

    this.pool.recover('bullet', bullet)
  }
}
