import Config from '../config'
import DataBus from '../databus'

let instance
let databus = new DataBus()

/**
 * 广告管理器
 * 负责创建、显示和管理广告，以及处理广告奖励
 */
export default class AdManager {
  constructor() {
    if (instance) return instance
    
    instance = this
    
    // 初始化广告状态
    this.doubleScoreActive = false
    this.doubleScoreRemaining = 0
    this.specialItemCooldown = 0
    this.revivesUsed = 0
    
    // 初始化广告组件
    this.initAds()
  }
  
  /**
   * 初始化广告组件
   */
  initAds() {
    // 只有在广告功能开启且在微信环境下才初始化广告
    if (!Config.ads.enabled || !wx || !wx.createRewardedVideoAd) {
      console.log('广告功能未开启或不支持')
      return
    }
    
    try {
      // 创建激励视频广告
      this.videoAd = wx.createRewardedVideoAd({
        adUnitId: Config.adUnitIds.videoAd
      })
      
      // 监听加载事件
      this.videoAd.onLoad(() => {
        console.log('激励视频广告加载成功')
      })
      
      // 监听错误事件
      this.videoAd.onError(err => {
        console.error('激励视频广告出错', err)
      })
      
      // 监听关闭事件
      this.videoAd.onClose(res => {
        // 用户点击了【关闭广告】按钮
        if (res && res.isEnded || res === undefined) {
          // 正常播放结束，发放奖励
          if (this.pendingRewardType) {
            this.handleReward(this.pendingRewardType)
            this.pendingRewardType = null
          }
        } else {
          // 播放中途退出，不发放奖励
          console.log('用户未观看完广告')
          if (this.onAdSkipped) {
            this.onAdSkipped()
            this.onAdSkipped = null
          }
        }
      })
    } catch (error) {
      console.error('初始化广告失败', error)
    }
  }
  
  /**
   * 显示复活广告
   * @param {Function} onRevived 复活成功回调
   * @param {Function} onFailed 复活失败或拒绝回调
   */
  showReviveAd(onRevived, onFailed) {
    // 检查广告是否启用
    if (!Config.ads.enabled || !Config.ads.revive.enabled) {
      if (onFailed) onFailed('广告功能未开启')
      return
    }
    
    // 检查复活次数是否达到上限
    if (this.revivesUsed >= Config.ads.revive.maxRevivesPerGame) {
      if (onFailed) onFailed('已达到最大复活次数')
      return
    }
    
    // 显示广告
    this.showVideoAd('revive', () => {
      this.revivesUsed++
      if (onRevived) onRevived()
    }, onFailed)
  }
  
  /**
   * 显示双倍得分广告
   * @param {Function} onSuccess 成功回调
   * @param {Function} onFailed 失败回调
   */
  showDoubleScoreAd(onSuccess, onFailed) {
    // 检查广告是否启用
    if (!Config.ads.enabled || !Config.ads.doubleScore.enabled) {
      if (onFailed) onFailed('广告功能未开启')
      return
    }
    
    // 显示广告
    this.showVideoAd('doubleScore', onSuccess, onFailed)
  }
  
  /**
   * 显示特殊道具广告
   * @param {Function} onSuccess 成功回调
   * @param {Function} onFailed 失败回调
   */
  showSpecialItemAd(onSuccess, onFailed) {
    // 检查广告是否启用
    if (!Config.ads.enabled || !Config.ads.specialItem.enabled) {
      if (onFailed) onFailed('广告功能未开启')
      return
    }
    
    // 检查冷却时间
    if (this.specialItemCooldown > 0) {
      if (onFailed) onFailed(`特殊道具冷却中，剩余${Math.ceil(this.specialItemCooldown / 60)}秒`)
      return
    }
    
    // 显示广告
    this.showVideoAd('specialItem', onSuccess, onFailed)
  }
  
  /**
   * 显示视频广告
   * @param {String} rewardType 奖励类型
   * @param {Function} onSuccess 成功回调
   * @param {Function} onFailed 失败回调
   */
  showVideoAd(rewardType, onSuccess, onFailed) {
    if (!this.videoAd) {
      if (onFailed) onFailed('广告组件未初始化')
      return
    }
    
    // 保存奖励类型和回调
    this.pendingRewardType = rewardType
    this.onAdSuccess = onSuccess
    this.onAdSkipped = onFailed
    
    // 显示广告
    this.videoAd.show().catch(err => {
      // 失败重试
      this.videoAd.load()
        .then(() => this.videoAd.show())
        .catch(err => {
          console.error('广告显示失败', err)
          if (onFailed) onFailed('广告加载失败')
          this.pendingRewardType = null
          this.onAdSuccess = null
          this.onAdSkipped = null
        })
    })
  }
  
  /**
   * 处理广告奖励
   * @param {String} rewardType 奖励类型
   */
  handleReward(rewardType) {
    switch (rewardType) {
      case 'revive':
        // 处理复活奖励
        databus.gameOver = false
        if (this.onAdSuccess) this.onAdSuccess()
        break
        
      case 'doubleScore':
        // 处理双倍得分奖励
        this.doubleScoreActive = true
        this.doubleScoreRemaining = Config.ads.doubleScore.duration
        if (this.onAdSuccess) this.onAdSuccess()
        break
        
      case 'specialItem':
        // 处理特殊道具奖励
        this.specialItemCooldown = Config.ads.specialItem.cooldown
        if (this.onAdSuccess) this.onAdSuccess()
        break
    }
    
    this.onAdSuccess = null
  }
  
  /**
   * 更新广告状态
   * 在游戏主循环中调用
   */
  update() {
    // 更新双倍得分状态
    if (this.doubleScoreActive && this.doubleScoreRemaining > 0) {
      this.doubleScoreRemaining--
      if (this.doubleScoreRemaining <= 0) {
        this.doubleScoreActive = false
      }
    }
    
    // 更新特殊道具冷却时间
    if (this.specialItemCooldown > 0) {
      this.specialItemCooldown--
    }
  }
  
  /**
   * 重置广告状态
   * 在游戏重新开始时调用
   */
  reset() {
    this.revivesUsed = 0
    // 保留双倍得分和特殊道具的状态，让它们在多局游戏之间持续
  }
  
  /**
   * 获取当前得分倍率
   * @returns {Number} 得分倍率
   */
  getScoreMultiplier() {
    return this.doubleScoreActive ? 2 : 1
  }
  
  /**
   * 创建特殊道具
   * 在观看特殊道具广告后调用
   * @returns {Object} 特殊道具对象
   */
  createSpecialItem() {
    // 这里可以根据游戏需求创建不同类型的特殊道具
    // 例如超级炸弹、无敌星等
    return {
      type: 'superBomb',
      name: '超级炸弹',
      description: '摧毁所有敌机并获得双倍分数'
    }
  }
}
