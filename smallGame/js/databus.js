import Pool from './base/pool'
import Config from './config'
import AchievementSystem from './runtime/achievement'

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

    // 初始化成就系统
    if (Config.achievements.enabled) {
      console.log('初始化成就系统')
      this.achievementSystem = new AchievementSystem()
      // 确保成就系统已正确加载数据
      console.log('成就系统初始化完成，已解锁成就数量:', this.achievementSystem.getUnlockedCount())
    }
    
    // 初始化关卡系统
    this.currentLevelId = 1
    this.levelUpNotification = null
    this.levelUpNotificationTime = 0

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
    this.gameOverTime = 0  // 游戏结束的时间戳
    
    // 广告奖励相关状态
    this.adRewardActive = false  // 是否有广告奖励激活
    this.specialItem = null      // 特殊道具
    
    // 游戏统计数据
    this.enemiesDefeated = 0     // 本局击败的敌人数量
    this.itemsCollected = 0      // 本局收集的道具数量
    
    // 重置成就系统当前游戏统计
    if (Config.achievements.enabled && this.achievementSystem) {
      this.achievementSystem.resetCurrentGameStats()
    }
    
    // 重置关卡
    this.currentLevelId = 1
    this.levelUpNotification = null
    this.levelUpNotificationTime = 0
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
   * 记录游戏结束
   * 更新成就和统计数据
   */
  recordGameEnd() {
    // 保存最高分
    this.saveHighScore()
    
    // 更新成就系统
    if (Config.achievements.enabled && this.achievementSystem) {
      console.log('游戏结束，更新成就系统，当前分数:', this.score)
      this.achievementSystem.recordGameEnd(this.score)
    } else {
      console.log('成就系统未启用或未初始化')
    }
  }
  
  /**
   * 获取当前关卡配置
   * @returns {Object} 当前关卡配置
   */
  getCurrentLevel() {
    if (!Config.levels.enabled) {
      // 如果关卡系统未启用，返回默认配置
      return {
        id: 1,
        name: "默认",
        enemySpeed: 6,
        enemySpawnRate: 30,
        powerItemSpawnRate: 300
      }
    }
    
    // 根据当前关卡ID获取配置
    return Config.levels.data.find(level => level.id === this.currentLevelId) || Config.levels.data[0]
  }
  
  /**
   * 检查并更新关卡
   * 根据当前分数判断是否需要升级关卡
   * @returns {Boolean} 是否升级了关卡
   */
  checkAndUpdateLevel() {
    if (!Config.levels.enabled) return false
    
    const currentLevel = this.getCurrentLevel()
    if (currentLevel.scoreToNextLevel === null) return false // 已经是最高关卡
    
    if (this.score >= currentLevel.scoreToNextLevel) {
      // 查找下一关卡
      const nextLevelIndex = Config.levels.data.findIndex(level => level.id === currentLevel.id) + 1
      if (nextLevelIndex < Config.levels.data.length) {
        this.currentLevelId = Config.levels.data[nextLevelIndex].id
        
        // 设置关卡提升通知
        if (Config.levels.showLevelUpNotification) {
          this.setLevelUpNotification(Config.levels.data[nextLevelIndex].name)
          this.levelUpNotificationTime = Date.now()
        }
        
        return true
      }
    }
    
    return false
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
    
    // 检查关卡是否需要更新
    this.checkAndUpdateLevel()
    
    return points
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
   * 记录击败敌人
   */
  recordEnemyDefeated() {
    this.enemiesDefeated++
    
    // 更新成就系统
    if (Config.achievements.enabled && this.achievementSystem) {
      console.log('记录击败敌人，当前局内击败敌人数:', this.enemiesDefeated)
      this.achievementSystem.recordEnemyDefeated()
    }
  }
  
  /**
   * 记录收集道具
   * @param {String} itemType 道具类型
   */
  recordItemCollected(itemType) {
    this.itemsCollected++
    
    // 更新成就系统
    if (Config.achievements.enabled && this.achievementSystem) {
      console.log('记录收集道具:', itemType, '，当前局内收集道具数:', this.itemsCollected)
      this.achievementSystem.recordItemCollected(itemType)
    }
  }
  
  /**
   * 获取当前关卡提升通知
   * @returns {String} 关卡提升通知
   */
  getLevelUpNotification() {
    return this.levelUpNotification
  }
  
  /**
   * 设置关卡提升通知
   * @param {String} notification 关卡提升通知
   */
  setLevelUpNotification(notification) {
    this.levelUpNotification = notification
  }
  
  /**
   * 获取关卡提升通知时间
   * @returns {Number} 关卡提升通知时间
   */
  getLevelUpNotificationTime() {
    return this.levelUpNotificationTime
  }
  
  /**
   * 记录千钧一发事件（在敌人即将撞击时使用炸弹）
   */
  recordNarrowEscape() {
    // 更新成就系统
    if (Config.achievements.enabled && this.achievementSystem) {
      this.achievementSystem.recordNarrowEscape()
    }
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
  
  // 清除所有游戏元素和动画
  clearAllElements() {
    this.bullets    = []
    this.enemys     = []
    this.powerItems = []
    
    // 停止所有动画
    this.animations.forEach(ani => {
      ani.stop()
    })
    this.animations = []
  }
}
