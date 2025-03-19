import Config from '../config'
import DataBus from '../databus'

const screenWidth  = window.innerWidth
const screenHeight = window.innerHeight

let atlas = new Image()
atlas.src = 'images/Common.png'

// 创建databus实例
let databus = new DataBus()

export default class GameInfo {
  constructor() {
    this.btnArea = {
      startX: screenWidth / 2 - 40,
      startY: screenHeight / 2 - 100 + 180,
      endX  : screenWidth / 2  + 50,
      endY  : screenHeight / 2 - 100 + 255
    }
    
    // 成就按钮区域
    this.achievementBtnArea = {
      startX: screenWidth / 2 - 40,
      startY: screenHeight / 2 - 100 + 270,
      endX  : screenWidth / 2  + 50,
      endY  : screenHeight / 2 - 100 + 345
    }
    
    // 复活按钮区域
    this.reviveBtnArea = null
    
    // 特殊道具按钮区域
    this.specialItemBtnArea = null
    
    // 使用特殊道具按钮区域
    this.useSpecialItemBtnArea = null
  }
  
  /**
   * 渲染游戏分数
   * @param {Object} ctx Canvas上下文
   * @param {Number} score 当前分数
   * @param {Number} highScore 最高分
   * @param {Boolean} doubleScoreActive 是否激活双倍得分
   */
  renderGameScore(ctx, score, highScore, doubleScoreActive = false) {
    ctx.fillStyle = '#ffffff'
    ctx.font      = '20px Arial'
    
    // 绘制分数
    ctx.fillText(
      score,
      10,
      30
    )
    
    // 绘制最高分（移到右上角）
    ctx.textAlign = 'right'
    ctx.fillText(
      `最高分: ${highScore}`,
      screenWidth - 10,
      30
    )
    
    // 如果启用了关卡系统，显示当前关卡（移到右上角，在最高分下面）
    if (Config.levels && Config.levels.enabled) {
      const currentLevel = databus.getCurrentLevel()
      ctx.fillStyle = '#ffffff'
      ctx.fillText(
        `关卡: ${currentLevel.name}`,
        screenWidth - 10,
        60
      )
    }
    ctx.textAlign = 'left'
    
    // 如果激活了双倍得分，显示双倍得分提示
    if (doubleScoreActive) {
      ctx.fillStyle = '#ffff00'  // 黄色
      ctx.fillText(
        '双倍得分!',
        10,
        90
      )
    }
    
    // 渲染关卡提升通知
    this.renderLevelUpNotification(ctx)
  }
  
  /**
   * 渲染关卡提升通知
   * @param {Object} ctx Canvas上下文
   */
  renderLevelUpNotification(ctx) {
    // 检查关卡系统是否启用
    if (!Config.levels || !Config.levels.enabled) return
    
    // 检查是否有关卡提升通知
    if (!databus.getLevelUpNotification()) return
    
    // 通知显示时间为3秒
    const notificationDuration = 3000
    const elapsedTime = Date.now() - databus.getLevelUpNotificationTime()
    
    if (elapsedTime > notificationDuration) {
      // 通知显示时间已过，清除通知
      databus.setLevelUpNotification(null)
      return
    }
    
    // 计算通知的透明度，实现淡入淡出效果
    let alpha = 1
    if (elapsedTime < 500) {
      // 淡入
      alpha = elapsedTime / 500
    } else if (elapsedTime > notificationDuration - 500) {
      // 淡出
      alpha = (notificationDuration - elapsedTime) / 500
    }
    
    // 设置文本样式
    ctx.save()
    ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`  // 黄色，带透明度
    ctx.font = 'bold 30px Arial'
    ctx.textAlign = 'center'
    
    // 绘制通知文本
    ctx.fillText(
      `升级到 ${databus.getLevelUpNotification()} 难度!`,
      screenWidth / 2,
      screenHeight / 3
    )
    ctx.restore()
  }
  
  /**
   * 渲染游戏结束界面
   * @param {Object} ctx Canvas上下文
   * @param {Number} score 当前分数
   * @param {Number} highScore 最高分
   * @param {Object} adsConfig 广告配置
   * @param {Object} adManager 广告管理器
   */
  renderGameOver(ctx, score, highScore, adsConfig, adManager) {
    ctx.drawImage(atlas, 0, 0, 119, 108, screenWidth / 2 - 60, screenHeight / 2 - 100, 120, 120)

    ctx.fillStyle = '#ffffff'
    ctx.font    = '20px Arial'

    ctx.fillText(
      '游戏结束',
      screenWidth / 2 - 40,
      screenHeight / 2 - 100 + 50
    )

    ctx.fillText(
      `得分: ${score}`,
      screenWidth / 2 - 40,
      screenHeight / 2 - 100 + 130
    )
    
    ctx.fillText(
      `最高分: ${highScore}`,
      screenWidth / 2 - 40,
      screenHeight / 2 - 100 + 160
    )

    ctx.drawImage(
      atlas,
      120, 6, 39, 24,
      screenWidth / 2 - 60,
      screenHeight / 2 - 100 + 180,
      120, 40
    )

    ctx.fillText(
      '重新开始',
      screenWidth / 2 - 40,
      screenHeight / 2 - 100 + 205
    )
    
    // 绘制成就按钮
    ctx.fillStyle = '#4CAF50'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.roundRect(
      screenWidth / 2 - 60,
      screenHeight / 2 - 100 + 270,
      120, 40,
      5
    )
    ctx.fill()
    ctx.stroke()
    
    ctx.fillStyle = '#ffffff'
    ctx.fillText(
      '成就',
      screenWidth / 2 - 20,
      screenHeight / 2 - 100 + 295
    )
    
    // 如果启用了广告，绘制广告按钮
    if (adsConfig) {
      let buttonY = screenHeight / 2 - 100 + 330
      
      // 绘制复活按钮
      if (adsConfig.revive.enabled && adManager.canShowReviveAd()) {
        this.renderAdButton(
          ctx,
          '复活',
          buttonY,
          '#ff9800'
        )
        
        // 保存复活按钮区域
        this.reviveBtnArea = {
          startX: screenWidth / 2 - 60,
          startY: buttonY,
          endX: screenWidth / 2 + 60,
          endY: buttonY + 40
        }
        
        buttonY += 60
      } else {
        this.reviveBtnArea = null
      }
      
      // 绘制特殊道具按钮
      if (adsConfig.specialItem.enabled && adManager.canShowSpecialItemAd()) {
        this.renderAdButton(
          ctx,
          '特殊道具',
          buttonY,
          '#2196F3'
        )
        
        // 保存特殊道具按钮区域
        this.specialItemBtnArea = {
          startX: screenWidth / 2 - 60,
          startY: buttonY,
          endX: screenWidth / 2 + 60,
          endY: buttonY + 40
        }
      } else {
        this.specialItemBtnArea = null
      }
    }
  }
  
  /**
   * 渲染广告按钮
   * @param {Object} ctx Canvas上下文
   * @param {String} text 按钮文本
   * @param {Number} y 按钮Y坐标
   * @param {String} color 按钮颜色
   */
  renderAdButton(ctx, text, y, color) {
    ctx.fillStyle = color
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.roundRect(
      screenWidth / 2 - 60,
      y,
      120, 40,
      5
    )
    ctx.fill()
    ctx.stroke()
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '20px Arial'
    ctx.fillText(
      text,
      screenWidth / 2 - text.length * 10,
      y + 25
    )
  }
  
  /**
   * 渲染特殊道具使用按钮
   * @param {Object} ctx Canvas上下文
   */
  renderSpecialItemButton(ctx) {
    const buttonWidth = 60
    const buttonHeight = 60
    const buttonX = screenWidth - buttonWidth - 20
    const buttonY = screenHeight - buttonHeight - 20
    
    // 绘制按钮背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.arc(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2, buttonWidth / 2, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
    
    // 绘制按钮图标（简单的炸弹图标）
    ctx.fillStyle = '#ff0000'
    ctx.beginPath()
    ctx.arc(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 - 10, 10, 0, 2 * Math.PI)
    ctx.fill()
    
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2)
    ctx.lineTo(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 15)
    ctx.stroke()
    
    // 保存按钮区域
    this.useSpecialItemBtnArea = {
      startX: buttonX,
      startY: buttonY,
      endX: buttonX + buttonWidth,
      endY: buttonY + buttonHeight
    }
  }
}
