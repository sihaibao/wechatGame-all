import Config from '../config'
import DataBus from '../databus'

const screenWidth  = window.innerWidth
const screenHeight = window.innerHeight

let atlas = new Image()
atlas.src = 'images/Common.png'

// 创建databus实例
let databus = new DataBus()

// 游戏结束背景图
let gameOverBg = new Image()
gameOverBg.src = 'images/bg.jpg'

// 确保背景图片加载完成
gameOverBg.onload = function() {
  console.log('游戏结束背景图片加载完成')
}

export default class GameInfo {
  constructor() {
    this.btnArea = {
      startX: screenWidth / 2 - 100,
      startY: screenHeight / 2 + 20,
      endX  : screenWidth / 2 + 100,
      endY  : screenHeight / 2 + 80
    }
    
    // 成就按钮区域
    this.achievementBtnArea = {
      startX: screenWidth / 2 - 80,
      startY: screenHeight / 2 + 90,
      endX  : screenWidth / 2 + 80,
      endY  : screenHeight / 2 + 140
    }
    
    // 复活按钮区域
    this.reviveBtnArea = null
    
    // 特殊道具按钮区域
    this.specialItemBtnArea = null
    
    // 使用特殊道具按钮区域
    this.useSpecialItemBtnArea = null
    
    // 游戏结束动画效果
    this.gameOverAnimationStartTime = 0
    this.gameOverAnimationDuration = 1000 // 1秒动画
    this.gameOverAnimationActive = false
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
    // 初始化动画效果
    if (!this.gameOverAnimationActive) {
      this.gameOverAnimationStartTime = Date.now()
      this.gameOverAnimationActive = true
    }
    
    // 计算动画进度 (0-1)
    const animationProgress = Math.min(
      (Date.now() - this.gameOverAnimationStartTime) / this.gameOverAnimationDuration, 
      1
    )
    
    // 使用缓动函数使动画更平滑
    const easeOutProgress = 1 - Math.pow(1 - animationProgress, 3)
    
    // 绘制半透明背景，覆盖整个屏幕
    ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * easeOutProgress})`
    ctx.fillRect(0, 0, screenWidth, screenHeight)
    
    // 绘制背景图片
    try {
      // 计算背景图片的绘制区域，使其居中且适当缩放
      const bgWidth = 350
      const bgHeight = 450
      
      // 应用动画效果 - 从小到大的缩放效果
      const animatedScale = 0.7 + (0.3 * easeOutProgress)
      const scaledWidth = bgWidth * animatedScale
      const scaledHeight = bgHeight * animatedScale
      
      const bgX = screenWidth / 2 - scaledWidth / 2
      const bgY = screenHeight / 2 - scaledHeight / 2
      
      // 绘制背景图片 - 直接绘制，不使用圆角矩形
      ctx.drawImage(
        gameOverBg,
        bgX,
        bgY,
        scaledWidth,
        scaledHeight
      )
      
      // 添加半透明遮罩，使文字更清晰，但不添加边框
      ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * easeOutProgress})`
      ctx.fillRect(
        bgX,
        bgY,
        scaledWidth,
        scaledHeight
      )
    } catch (e) {
      console.error('Failed to draw game over background:', e)
      
      // 如果背景图片加载失败，回退到原来的背景
      ctx.fillStyle = 'rgba(0, 100, 150, 0.8)'
      ctx.fillRect(
        screenWidth / 2 - 150,
        screenHeight / 2 - 200,
        300, 400
      )
      
      // 绘制内部背景框
      ctx.fillStyle = 'rgba(100, 200, 255, 0.3)'
      ctx.fillRect(
        screenWidth / 2 - 130,
        screenHeight / 2 - 180,
        260, 360
      )
    }
    
    // 元素只有在动画进行到一定程度才显示 (50%)
    if (easeOutProgress > 0.5) {
      // 计算元素的透明度
      const elementsOpacity = (easeOutProgress - 0.5) * 2 // 从0.5到1映射为0到1
      
      // 绘制游戏结束标题背景
      // 移除标题背景矩形
      
      // 添加游戏结束标题边框效果
      // 移除标题边框
      
      // 添加发光效果
      ctx.shadowColor = `rgba(255, 0, 0, ${0.8 * elementsOpacity})`  // 更鲜艳的红色光晕
      ctx.shadowBlur = 12
      // 移除发光边框
      ctx.shadowBlur = 0
      
      // 绘制游戏结束文字
      ctx.fillStyle = `rgba(255, 50, 50, ${elementsOpacity})`  // 改为红色
      ctx.font = 'bold 28px Arial'  // 进一步增大字体
      ctx.textAlign = 'center'
      
      // 添加文字阴影效果
      ctx.shadowColor = `rgba(255, 255, 255, ${0.9 * elementsOpacity})`  // 白色阴影
      ctx.shadowBlur = 6
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      
      ctx.fillText(
        '游戏结束',
        screenWidth / 2,
        screenHeight / 2 - 145
      )
      
      // 添加文字描边效果
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * elementsOpacity})`;
      ctx.lineWidth = 1;
      ctx.strokeText(
        '游戏结束',
        screenWidth / 2,
        screenHeight / 2 - 145
      );
      
      // 重置阴影效果
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
  
      // 绘制分数背景
      // 移除分数背景矩形
      
      // 添加分数区域边框
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 * elementsOpacity})`  // 金色边框
      ctx.lineWidth = 2
      // 移除分数区域边框
      
      // 得分和最高分居中显示
      // 得分标题
      ctx.font = 'bold 20px Arial'
      ctx.fillStyle = `rgba(255, 215, 0, ${0.9 * elementsOpacity})`  // 金色
      ctx.textAlign = 'center'
      ctx.fillText(
        '得分',
        screenWidth / 2,
        screenHeight / 2 - 80
      )
      
      // 得分数值
      ctx.font = 'bold 28px Arial'
      ctx.fillStyle = `rgba(255, 255, 255, ${elementsOpacity})`
      ctx.fillText(
        `${score}`,
        screenWidth / 2,
        screenHeight / 2 - 50
      )
      
      // 最高分标题
      ctx.font = 'bold 16px Arial'
      ctx.fillStyle = `rgba(255, 215, 0, ${0.7 * elementsOpacity})`  // 金色，稍微淡一点
      ctx.fillText(
        '最高分',
        screenWidth / 2,
        screenHeight / 2 - 25
      )
      
      // 最高分数值
      ctx.font = '20px Arial'
      ctx.fillStyle = `rgba(255, 255, 255, ${elementsOpacity})`
      ctx.fillText(
        `${highScore}`,
        screenWidth / 2,
        screenHeight / 2
      )
  
      // 重新开始按钮背景 - 增加按钮大小和视觉效果
      ctx.fillStyle = `rgba(0, 120, 180, ${0.9 * elementsOpacity})`
      
      // 获取文本宽度以创建更紧凑的按钮
      ctx.font = 'bold 26px Arial'
      const restartTextWidth = ctx.measureText('重新开始').width
      const restartButtonWidth = restartTextWidth + 30 // 文字两侧各留15px的间距，更紧凑
      const restartButtonHeight = 36 // 更紧凑的高度
      const buttonRadius = 10 // 圆角半径
      
      // 使用圆角矩形
      ctx.fillStyle = `rgba(0, 120, 180, ${0.9 * elementsOpacity})`
      this.drawRoundRect(
        ctx,
        screenWidth / 2 - restartButtonWidth / 2,
        screenHeight / 2 + 30,
        restartButtonWidth,
        restartButtonHeight,
        buttonRadius
      );
      ctx.fill();
      
      // 增强按钮发光效果
      ctx.shadowColor = `rgba(0, 200, 255, ${0.9 * elementsOpacity})`
      ctx.shadowBlur = 15
      ctx.strokeStyle = `rgba(255, 255, 255, ${1.0 * elementsOpacity})`
      ctx.lineWidth = 3
      this.drawRoundRect(
        ctx,
        screenWidth / 2 - restartButtonWidth / 2,
        screenHeight / 2 + 30,
        restartButtonWidth,
        restartButtonHeight,
        buttonRadius
      );
      ctx.stroke();
      ctx.shadowBlur = 0
  
      // 重新开始按钮文字 - 增大字体
      ctx.fillStyle = `rgba(255, 255, 255, ${elementsOpacity})`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle' // 设置文字基线为中间，确保垂直居中
      ctx.fillText(
        '重新开始',
        screenWidth / 2,
        screenHeight / 2 + 30 + restartButtonHeight / 2 // 精确计算垂直中心位置
      )
      
      // 更新重新开始按钮区域，确保与渲染位置一致
      this.btnArea = {
        startX: screenWidth / 2 - restartButtonWidth / 2,
        startY: screenHeight / 2 + 30,
        endX  : screenWidth / 2 + restartButtonWidth / 2,
        endY  : screenHeight / 2 + 30 + restartButtonHeight
      }
      
      // 成就按钮背景
      ctx.fillStyle = `rgba(0, 120, 180, ${0.9 * elementsOpacity})`
      
      // 获取文本宽度以创建更紧凑的按钮
      ctx.font = 'bold 22px Arial'
      const achievementTextWidth = ctx.measureText('成就').width
      const achievementButtonWidth = achievementTextWidth + 30 // 文字两侧各留15px的间距，更紧凑
      const achievementButtonHeight = 32 // 更紧凑的高度
      
      // 使用圆角矩形
      ctx.fillStyle = `rgba(0, 120, 180, ${0.9 * elementsOpacity})`
      this.drawRoundRect(
        ctx,
        screenWidth / 2 - achievementButtonWidth / 2,
        screenHeight / 2 + 90,
        achievementButtonWidth,
        achievementButtonHeight,
        buttonRadius
      );
      ctx.fill();
      
      // 添加按钮发光效果
      ctx.shadowColor = `rgba(0, 200, 255, ${0.8 * elementsOpacity})`
      ctx.shadowBlur = 10
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * elementsOpacity})`
      ctx.lineWidth = 2
      this.drawRoundRect(
        ctx,
        screenWidth / 2 - achievementButtonWidth / 2,
        screenHeight / 2 + 90,
        achievementButtonWidth,
        achievementButtonHeight,
        buttonRadius
      );
      ctx.stroke();
      ctx.shadowBlur = 0
      
      // 成就按钮文字
      ctx.fillStyle = `rgba(255, 255, 255, ${elementsOpacity})`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle' // 设置文字基线为中间，确保垂直居中
      ctx.fillText(
        '成就',
        screenWidth / 2,
        screenHeight / 2 + 90 + achievementButtonHeight / 2 // 精确计算垂直中心位置
      )
      
      // 更新成就按钮区域，确保与渲染位置一致
      this.achievementBtnArea = {
        startX: screenWidth / 2 - achievementButtonWidth / 2,
        startY: screenHeight / 2 + 90,
        endX  : screenWidth / 2 + achievementButtonWidth / 2,
        endY  : screenHeight / 2 + 90 + achievementButtonHeight
      }
      
      // 如果启用了广告，绘制广告按钮
      if (adsConfig) {
        let buttonY = screenHeight / 2 + 160
        
        // 绘制复活按钮
        if (adsConfig.revive.enabled && adManager.canShowReviveAd()) {
          // 复活按钮背景
          ctx.fillStyle = `rgba(255, 150, 0, ${0.9 * elementsOpacity})`
          
          // 获取文本宽度以创建更紧凑的按钮
          ctx.font = 'bold 22px Arial'
          const reviveTextWidth = ctx.measureText('复活').width
          const reviveButtonWidth = reviveTextWidth + 30 // 文字两侧各留15px的间距，更紧凑
          const reviveButtonHeight = 32 // 更紧凑的高度
          
          // 使用圆角矩形
          ctx.fillStyle = `rgba(255, 150, 0, ${0.9 * elementsOpacity})`
          this.drawRoundRect(
            ctx,
            screenWidth / 2 - reviveButtonWidth / 2,
            buttonY,
            reviveButtonWidth,
            reviveButtonHeight,
            buttonRadius
          );
          ctx.fill();
          
          // 添加按钮发光效果
          ctx.shadowColor = `rgba(255, 200, 0, ${0.8 * elementsOpacity})`
          ctx.shadowBlur = 10
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * elementsOpacity})`
          ctx.lineWidth = 2
          this.drawRoundRect(
            ctx,
            screenWidth / 2 - reviveButtonWidth / 2,
            buttonY,
            reviveButtonWidth,
            reviveButtonHeight,
            buttonRadius
          );
          ctx.stroke();
          ctx.shadowBlur = 0
          
          // 复活按钮文字
          ctx.fillStyle = `rgba(255, 255, 255, ${elementsOpacity})`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle' // 设置文字基线为中间，确保垂直居中
          ctx.fillText(
            '复活',
            screenWidth / 2,
            buttonY + reviveButtonHeight / 2 // 精确计算垂直中心位置
          )
          
          // 保存复活按钮区域
          this.reviveBtnArea = {
            startX: screenWidth / 2 - reviveButtonWidth / 2,
            startY: buttonY,
            endX: screenWidth / 2 + reviveButtonWidth / 2,
            endY: buttonY + reviveButtonHeight
          }
          
          buttonY += 60 // 减少按钮之间的间距
        } else {
          this.reviveBtnArea = null
        }
        
        // 绘制特殊道具按钮
        if (adsConfig.specialItem.enabled && adManager.canShowSpecialItemAd()) {
          // 特殊道具按钮背景
          ctx.fillStyle = `rgba(33, 150, 243, ${0.9 * elementsOpacity})`
          
          // 获取文本宽度以创建更紧凑的按钮
          ctx.font = 'bold 22px Arial'
          const specialItemTextWidth = ctx.measureText('特殊道具').width
          const specialItemButtonWidth = specialItemTextWidth + 30 // 文字两侧各留15px的间距，更紧凑
          const specialItemButtonHeight = 32 // 更紧凑的高度
          
          // 使用圆角矩形
          ctx.fillStyle = `rgba(33, 150, 243, ${0.9 * elementsOpacity})`
          this.drawRoundRect(
            ctx,
            screenWidth / 2 - specialItemButtonWidth / 2,
            buttonY,
            specialItemButtonWidth,
            specialItemButtonHeight,
            buttonRadius
          );
          ctx.fill();
          
          // 添加按钮发光效果
          ctx.shadowColor = `rgba(100, 200, 255, ${0.8 * elementsOpacity})`
          ctx.shadowBlur = 10
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * elementsOpacity})`
          ctx.lineWidth = 2
          this.drawRoundRect(
            ctx,
            screenWidth / 2 - specialItemButtonWidth / 2,
            buttonY,
            specialItemButtonWidth,
            specialItemButtonHeight,
            buttonRadius
          );
          ctx.stroke();
          ctx.shadowBlur = 0
          
          // 特殊道具按钮文字
          ctx.fillStyle = `rgba(255, 255, 255, ${elementsOpacity})`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle' // 设置文字基线为中间，确保垂直居中
          ctx.fillText(
            '特殊道具',
            screenWidth / 2,
            buttonY + specialItemButtonHeight / 2 // 精确计算垂直中心位置
          )
          
          // 保存特殊道具按钮区域
          this.specialItemBtnArea = {
            startX: screenWidth / 2 - specialItemButtonWidth / 2,
            startY: buttonY,
            endX: screenWidth / 2 + specialItemButtonWidth / 2,
            endY: buttonY + specialItemButtonHeight
          }
        } else {
          this.specialItemBtnArea = null
        }
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
    // 测量文本宽度以创建更紧凑的按钮
    ctx.font = '20px Arial'
    const textWidth = ctx.measureText(text).width
    const buttonWidth = textWidth + 24 // 文字两侧各留12px的间距，更紧凑
    const buttonHeight = 32 // 更紧凑的高度
    const buttonRadius = 8 // 圆角半径
    
    // 使用圆角矩形
    ctx.fillStyle = color
    this.drawRoundRect(
      ctx,
      screenWidth / 2 - buttonWidth / 2,
      y,
      buttonWidth,
      buttonHeight,
      buttonRadius
    );
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    this.drawRoundRect(
      ctx,
      screenWidth / 2 - buttonWidth / 2,
      y,
      buttonWidth,
      buttonHeight,
      buttonRadius
    );
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle' // 设置文字基线为中间，确保垂直居中
    ctx.fillText(
      text,
      screenWidth / 2,
      y + buttonHeight / 2 // 精确计算垂直中心位置
    )
  }
  
  /**
   * 渲染特殊道具使用按钮
   * @param {Object} ctx Canvas上下文
   */
  renderSpecialItemButton(ctx) {
    // 使用更小的按钮尺寸，更加紧凑
    const buttonWidth = 45
    const buttonHeight = 45
    const buttonX = screenWidth - buttonWidth - 10
    const buttonY = screenHeight - buttonHeight - 10
    
    // 绘制按钮背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.arc(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2, buttonWidth / 2, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
    
    // 绘制炸弹图标
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial' // 稍微减小字体大小
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      '💣',
      buttonX + buttonWidth / 2,
      buttonY + buttonHeight / 2
    )
    
    // 保存按钮区域
    this.useSpecialItemBtnArea = {
      startX: buttonX,
      startY: buttonY,
      endX: buttonX + buttonWidth,
      endY: buttonY + buttonHeight
    }
  }
  
  /**
   * 重置游戏结束动画状态
   */
  resetGameOverAnimation() {
    this.gameOverAnimationActive = false
    this.gameOverAnimationStartTime = 0
  }
  
  /**
   * 自定义圆角矩形绘制方法
   * @param {Object} ctx Canvas上下文
   * @param {Number} x 矩形左上角x坐标
   * @param {Number} y 矩形左上角y坐标
   * @param {Number} width 矩形宽度
   * @param {Number} height 矩形高度
   * @param {Array|Number} radius 圆角半径，可以是数组或单个数值
   */
  drawRoundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'number') {
      radius = [radius, radius, radius, radius];
    }
    
    ctx.beginPath();
    ctx.moveTo(x + radius[0], y);
    ctx.lineTo(x + width - radius[1], y);
    ctx.arcTo(x + width, y, x + width, y + height, radius[1]);
    ctx.lineTo(x + width, y + height - radius[2]);
    ctx.arcTo(x + width, y + height, x, y + height, radius[2]);
    ctx.lineTo(x + radius[3], y + height);
    ctx.arcTo(x, y + height, x, y, radius[3]);
    ctx.lineTo(x, y + radius[0]);
    ctx.arcTo(x, y, x + width, y, radius[0]);
    ctx.closePath();
  }
}
