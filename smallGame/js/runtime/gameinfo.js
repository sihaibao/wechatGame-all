const screenWidth  = window.innerWidth
const screenHeight = window.innerHeight

let atlas = new Image()
atlas.src = 'images/Common.png'

export default class GameInfo {
  renderGameScore(ctx, score, highScore, doubleScoreActive) {
    ctx.fillStyle = "#ffffff"
    ctx.font = "16px Arial"
    
    // 在右上角显示当前分数和最高分，更加紧凑
    ctx.textAlign = "right"
    ctx.fillText(
      '分数: ' + score + (doubleScoreActive ? ' (双倍)' : ''),
      screenWidth - 10,
      25
    )
    
    ctx.font = "14px Arial"
    ctx.fillText(
      '最高: ' + highScore,
      screenWidth - 10,
      45
    )
    
    // 重置文本对齐方式为默认值
    ctx.textAlign = "left"
  }

  renderGameOver(ctx, score, highScore, adsConfig, adManager) {
    ctx.drawImage(atlas, 0, 0, 119, 108, screenWidth / 2 - 150, screenHeight / 2 - 100, 300, 300)

    ctx.fillStyle = "#ffffff"
    ctx.font = "20px Arial"
    ctx.textAlign = "center"

    ctx.fillText(
      '游戏结束',
      screenWidth / 2,
      screenHeight / 2 - 100 + 50
    )

    // 使用更紧凑的布局显示分数
    const isNewRecord = score >= highScore
    
    ctx.font = "18px Arial"
    ctx.fillText(
      '得分: ' + score + (isNewRecord ? ' (新纪录!)' : ''),
      screenWidth / 2,
      screenHeight / 2 - 100 + 90
    )
    
    if (!isNewRecord) {
      ctx.font = "16px Arial"
      ctx.fillText(
        '最高分: ' + highScore,
        screenWidth / 2,
        screenHeight / 2 - 100 + 120
      )
    }

    // 绘制重新开始按钮
    ctx.drawImage(
      atlas,
      120, 6, 39, 24,
      screenWidth / 2 - 60,
      screenHeight / 2 - 100 + 160,
      120, 40
    )

    ctx.font = "16px Arial"
    ctx.fillText(
      '重新开始',
      screenWidth / 2,
      screenHeight / 2 - 100 + 185
    )
    
    // 如果广告功能已启用，绘制广告奖励按钮
    if (adsConfig && adsConfig.enabled) {
      let buttonY = screenHeight / 2 - 100 + 220
      
      // 绘制复活按钮（如果启用且未达到最大复活次数）
      if (adsConfig.revive.enabled && adManager.revivesUsed < adsConfig.revive.maxRevivesPerGame) {
        this.renderAdButton(ctx, '看广告复活', screenWidth / 2, buttonY, 'revive')
        buttonY += 50
      }
      
      // 绘制双倍得分按钮（如果启用）
      if (adsConfig.doubleScore.enabled) {
        this.renderAdButton(ctx, '下局双倍得分', screenWidth / 2, buttonY, 'doubleScore')
        buttonY += 50
      }
      
      // 绘制特殊道具按钮（如果启用且不在冷却中）
      if (adsConfig.specialItem.enabled && adManager.specialItemCooldown <= 0) {
        this.renderAdButton(ctx, '获取特殊道具', screenWidth / 2, buttonY, 'specialItem')
      }
    }

    // 重置文本对齐方式为默认值
    ctx.textAlign = "left"

    /**
     * 重新开始按钮区域
     * 方便简易判断按钮点击
     */
    this.btnArea = {
      startX: screenWidth / 2 - 60,
      startY: screenHeight / 2 - 100 + 160,
      endX  : screenWidth / 2 + 60,
      endY  : screenHeight / 2 - 100 + 200
    }
  }
  
  /**
   * 渲染广告按钮
   * @param {Object} ctx Canvas上下文
   * @param {String} text 按钮文字
   * @param {Number} x 按钮中心x坐标
   * @param {Number} y 按钮中心y坐标
   * @param {String} type 按钮类型
   */
  renderAdButton(ctx, text, x, y, type) {
    const buttonWidth = 140
    const buttonHeight = 40
    
    // 绘制按钮背景
    ctx.fillStyle = '#4CAF50'  // 绿色
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    
    // 圆角矩形
    ctx.beginPath()
    ctx.roundRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 8)
    ctx.fill()
    ctx.stroke()
    
    // 绘制按钮文字
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x, y)
    
    // 保存按钮区域
    if (type === 'revive') {
      this.reviveBtnArea = {
        startX: x - buttonWidth / 2,
        startY: y - buttonHeight / 2,
        endX: x + buttonWidth / 2,
        endY: y + buttonHeight / 2
      }
    } else if (type === 'doubleScore') {
      this.doubleScoreBtnArea = {
        startX: x - buttonWidth / 2,
        startY: y - buttonHeight / 2,
        endX: x + buttonWidth / 2,
        endY: y + buttonHeight / 2
      }
    } else if (type === 'specialItem') {
      this.specialItemBtnArea = {
        startX: x - buttonWidth / 2,
        startY: y - buttonHeight / 2,
        endX: x + buttonWidth / 2,
        endY: y + buttonHeight / 2
      }
    }
  }
  
  /**
   * 渲染特殊道具使用按钮
   * @param {Object} ctx Canvas上下文
   */
  renderSpecialItemButton(ctx) {
    const buttonSize = 60
    const x = 40
    const y = screenHeight - 40
    
    // 绘制按钮背景
    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)'  // 半透明红色
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    
    // 圆形按钮
    ctx.beginPath()
    ctx.arc(x, y, buttonSize / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // 绘制按钮文字
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('使用', x, y - 8)
    ctx.fillText('道具', x, y + 8)
    
    // 保存按钮区域
    this.useSpecialItemBtnArea = {
      startX: x - buttonSize / 2,
      startY: y - buttonSize / 2,
      endX: x + buttonSize / 2,
      endY: y + buttonSize / 2
    }
  }
}
