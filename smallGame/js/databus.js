import Pool from './base/pool'
import Config from './config'

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
    this.powerItems = []  
    this.gameOver   = false
    
    // 广告奖励相关状态
    this.adRewardActive = false  // 是否有广告奖励激活
    this.specialItem = null      // 特殊道具
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

  /**
   * 回收道具，进入对象池
   * 此后不进入帧循环
   */
  removePowerItem(powerItem) {
    const index = this.powerItems.findIndex((item) => item === powerItem)
    
    if (index !== -1) {
      const temp = this.powerItems.splice(index, 1)[0]
      temp.visible = false
      this.pool.recover(powerItem.type, powerItem)
    }
  }
  
  /**
   * 加分方法，考虑广告奖励的得分倍率
   * @param {Number} points 基础得分
   * @returns {Number} 实际得分
   */
  addScore(points) {
    // 检查是否开启了广告功能
    if (Config.ads.enabled && this.adRewardActive) {
      // 如果有双倍得分奖励，分数翻倍
      points *= 2
    }
    
    this.score += points
    return points
  }
  
  /**
   * 设置特殊道具
   * @param {Object} item 特殊道具对象
   */
  setSpecialItem(item) {
    this.specialItem = item
  }
  
  /**
   * 使用特殊道具
   * @returns {Object} 道具使用结果
   */
  useSpecialItem() {
    if (!this.specialItem) {
      return null
    }
    
    const result = this.specialItem.use()
    this.specialItem = null
    return result
  }
}
