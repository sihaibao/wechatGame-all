/**
 * 成就系统
 * 管理游戏中的各种成就，包括解锁条件、显示和奖励
 */

import Config from '../config'

let instance

export default class AchievementSystem {
  constructor() {
    if (instance) return instance
    
    instance = this
    
    this.achievements = []
    this.isShowingScreen = false
    this.isShowingNotification = false
    this.notificationQueue = []
    this.notificationDuration = 120 // 帧数
    this.notificationTimer = 0
    
    // 成就界面滚动相关
    this.scrollY = 0
    this.maxScrollY = 0
    this.touchStartY = 0
    this.isTouching = false
    
    // 初始化成就列表
    this.achievements = [
      {
        id: 'firstGame',
        name: '初次启航',
        description: '完成第一局游戏',
        icon: 'images/achievements/first_game.png',
        unlocked: false,
        secret: false,
        progress: 0,
        target: 1,
        reward: null
      },
      {
        id: 'score100',
        name: '小试牛刀',
        description: '在一局游戏中得分达到100分',
        icon: 'images/achievements/score_100.png',
        unlocked: false,
        secret: false,
        progress: 0,
        target: 100,
        reward: null
      },
      {
        id: 'score500',
        name: '身手不凡',
        description: '在一局游戏中得分达到500分',
        icon: 'images/achievements/score_500.png',
        unlocked: false,
        secret: false,
        progress: 0,
        target: 500,
        reward: null
      },
      {
        id: 'score1000',
        name: '战斗大师',
        description: '在一局游戏中得分达到1000分',
        icon: 'images/achievements/score_1000.png',
        unlocked: false,
        secret: false,
        progress: 0,
        target: 1000,
        reward: null
      },
      {
        id: 'enemy10',
        name: '初级猎人',
        description: '在一局游戏中击败10个敌人',
        icon: 'images/achievements/enemy_10.png',
        unlocked: false,
        secret: false,
        progress: 0,
        target: 10,
        reward: null
      },
      {
        id: 'enemy50',
        name: '老练猎手',
        description: '在一局游戏中击败50个敌人',
        icon: 'images/achievements/enemy_50.png',
        unlocked: false,
        secret: false,
        progress: 0,
        target: 50,
        reward: null
      },
      {
        id: 'enemy100',
        name: '终极猎人',
        description: '在一局游戏中击败100个敌人',
        icon: 'images/achievements/enemy_100.png',
        unlocked: false,
        secret: false,
        progress: 0,
        target: 100,
        reward: null
      },
      {
        id: 'item10',
        name: '收集者',
        description: '累计收集10个道具',
        icon: 'images/achievements/item_10.png',
        unlocked: false,
        secret: false,
        progress: 0,
        target: 10,
        reward: null
      },
      {
        id: 'item50',
        name: '囤积者',
        description: '累计收集50个道具',
        icon: 'images/achievements/item_50.png',
        unlocked: false,
        secret: false,
        progress: 0,
        target: 50,
        reward: null
      },
      {
        id: 'narrowEscape',
        name: '千钧一发',
        description: '在敌人即将撞击时使用炸弹逃脱',
        icon: 'images/achievements/narrow_escape.png',
        unlocked: false,
        secret: true,
        progress: 0,
        target: 1,
        reward: null
      }
    ]
    
    // 初始化成就通知队列
    this.notificationQueue = []
    
    // 加载已解锁的成就
    this.loadAchievements()
    
    // 成就统计数据
    this.stats = {
      totalGamesPlayed: 0,
      totalEnemiesDefeated: 0,
      totalItemsCollected: 0,
      highestScore: 0,
      totalPlayTime: 0,
      currentGameEnemiesDefeated: 0
    }
    
    // 加载统计数据
    this.loadStats()
  }
  
  /**
   * 从本地存储加载已解锁的成就
   */
  loadAchievements() {
    try {
      const savedAchievements = wx.getStorageSync('achievements')
      if (savedAchievements) {
        const parsed = JSON.parse(savedAchievements)
        
        // 更新成就状态
        this.achievements.forEach((achievement, index) => {
          if (parsed[achievement.id]) {
            this.achievements[index] = {
              ...achievement,
              ...parsed[achievement.id]
            }
          }
        })
      }
    } catch (e) {
      console.error('读取成就数据失败', e)
    }
  }
  
  /**
   * 保存成就到本地存储
   */
  saveAchievements() {
    try {
      const achievementsToSave = {}
      
      this.achievements.forEach(achievement => {
        achievementsToSave[achievement.id] = {
          unlocked: achievement.unlocked,
          progress: achievement.progress
        }
      })
      
      wx.setStorageSync('achievements', JSON.stringify(achievementsToSave))
    } catch (e) {
      console.error('保存成就数据失败', e)
    }
  }
  
  /**
   * 从本地存储加载统计数据
   */
  loadStats() {
    try {
      const savedStats = wx.getStorageSync('achievementStats')
      if (savedStats) {
        this.stats = {
          ...this.stats,
          ...JSON.parse(savedStats)
        }
      }
    } catch (e) {
      console.error('读取成就统计数据失败', e)
    }
  }
  
  /**
   * 保存统计数据到本地存储
   */
  saveStats() {
    try {
      wx.setStorageSync('achievementStats', JSON.stringify(this.stats))
    } catch (e) {
      console.error('保存成就统计数据失败', e)
    }
  }
  
  /**
   * 重置当前游戏的统计数据
   */
  resetCurrentGameStats() {
    this.stats.currentGameEnemiesDefeated = 0
  }
  
  /**
   * 更新成就进度
   * @param {String} id 成就ID
   * @param {Number} progress 进度值
   * @param {Boolean} absolute 是否为绝对值（默认为累加）
   */
  updateAchievement(id, progress, absolute = false) {
    const achievementIndex = this.achievements.findIndex(a => a.id === id)
    
    if (achievementIndex === -1) return
    
    const achievement = this.achievements[achievementIndex]
    
    // 如果已解锁，不再更新
    if (achievement.unlocked) return
    
    // 更新进度
    if (absolute) {
      achievement.progress = progress
    } else {
      achievement.progress += progress
    }
    
    // 检查是否达成
    if (achievement.progress >= achievement.target) {
      achievement.progress = achievement.target
      achievement.unlocked = true
      
      // 添加到通知队列
      this.notificationQueue.push(achievement)
      
      // 如果当前没有显示通知，开始显示
      if (!this.isShowingNotification) {
        this.showNextNotification()
      }
    }
    
    // 保存成就状态
    this.saveAchievements()
  }
  
  /**
   * 显示下一个成就通知
   */
  showNextNotification() {
    if (this.notificationQueue.length === 0) {
      this.isShowingNotification = false
      return
    }
    
    this.isShowingNotification = true
    const achievement = this.notificationQueue.shift()
    
    // 创建通知元素
    if (typeof wx.createToast === 'function') {
      wx.createToast({
        title: `成就解锁：${achievement.name}`,
        icon: 'success',
        duration: 2000,
        success: () => {
          // 延迟显示下一个通知
          setTimeout(() => {
            this.showNextNotification()
          }, 2500)
        }
      })
    } else {
      // 如果不支持原生toast，延迟显示下一个
      setTimeout(() => {
        this.showNextNotification()
      }, 2000)
    }
  }
  
  /**
   * 记录游戏结束
   * @param {Number} score 本局得分
   */
  recordGameEnd(score) {
    // 更新统计数据
    this.stats.totalGamesPlayed++
    
    if (score > this.stats.highestScore) {
      this.stats.highestScore = score
    }
    
    // 保存统计数据
    this.saveStats()
    
    // 更新成就进度
    this.updateAchievement('firstGame', 1)
    
    // 检查分数相关成就
    if (score >= 100) {
      this.updateAchievement('score100', score, true)
    }
    
    if (score >= 500) {
      this.updateAchievement('score500', score, true)
    }
    
    if (score >= 1000) {
      this.updateAchievement('score1000', score, true)
    }
    
    // 检查敌人击败数相关成就
    if (this.stats.currentGameEnemiesDefeated >= 10) {
      this.updateAchievement('enemy10', this.stats.currentGameEnemiesDefeated, true)
    }
    
    if (this.stats.currentGameEnemiesDefeated >= 50) {
      this.updateAchievement('enemy50', this.stats.currentGameEnemiesDefeated, true)
    }
    
    if (this.stats.currentGameEnemiesDefeated >= 100) {
      this.updateAchievement('enemy100', this.stats.currentGameEnemiesDefeated, true)
    }
  }
  
  /**
   * 记录击败敌人
   */
  recordEnemyDefeated() {
    this.stats.totalEnemiesDefeated++
    this.stats.currentGameEnemiesDefeated++
  }
  
  /**
   * 记录收集道具
   * @param {String} itemType 道具类型
   */
  recordItemCollected(itemType) {
    this.stats.totalItemsCollected++
    
    // 更新道具收集成就
    this.updateAchievement('item10', 1)
    this.updateAchievement('item50', 1)
    
    // 保存统计数据
    this.saveStats()
  }
  
  /**
   * 记录千钧一发事件（在敌人即将撞击时使用炸弹）
   */
  recordNarrowEscape() {
    this.updateAchievement('narrowEscape', 1)
  }
  
  /**
   * 获取所有成就
   * @param {Boolean} includeSecret 是否包含未解锁的隐藏成就
   * @returns {Array} 成就列表
   */
  getAchievements(includeSecret = false) {
    return this.achievements.filter(achievement => {
      if (achievement.secret && !achievement.unlocked && !includeSecret) {
        return false
      }
      return true
    })
  }
  
  /**
   * 获取已解锁的成就数量
   * @returns {Number} 已解锁成就数量
   */
  getUnlockedCount() {
    return this.achievements.filter(achievement => achievement.unlocked).length
  }
  
  /**
   * 获取成就总数
   * @returns {Number} 成就总数
   */
  getTotalCount() {
    return this.achievements.length
  }
  
  /**
   * 处理触摸事件
   * @param {Number} x 触摸点x坐标
   * @param {Number} y 触摸点y坐标
   * @param {String} type 事件类型：touchstart, touchmove, touchend
   */
  handleTouch(x, y, type) {
    if (!this.isShowingScreen) {
      return false
    }
    
    // 处理返回按钮点击
    if (type === 'touchend' && this.backButtonArea && 
        x >= this.backButtonArea.startX && x <= this.backButtonArea.endX &&
        y >= this.backButtonArea.startY && y <= this.backButtonArea.endY) {
      this.hideScreen()
      return true
    }
    
    // 处理滚动
    if (type === 'touchstart') {
      this.touchStartY = y
      this.isTouching = true
      return true
    } else if (type === 'touchmove' && this.isTouching) {
      const deltaY = y - this.touchStartY
      this.scrollY -= deltaY
      
      // 限制滚动范围
      if (this.scrollY < 0) {
        this.scrollY = 0
      } else if (this.scrollY > this.maxScrollY) {
        this.scrollY = this.maxScrollY
      }
      
      this.touchStartY = y
      return true
    } else if (type === 'touchend') {
      this.isTouching = false
      return true
    }
    
    return false
  }
  
  /**
   * 显示成就界面
   */
  showScreen() {
    this.isShowingScreen = true
    this.scrollY = 0 // 重置滚动位置
  }
  
  /**
   * 隐藏成就界面
   */
  hideScreen() {
    this.isShowingScreen = false
  }
  
  /**
   * 渲染成就界面
   * @param {Object} ctx Canvas上下文
   */
  renderAchievementScreen(ctx) {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // 绘制半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(0, 0, screenWidth, screenHeight)
    
    // 绘制标题
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('成就', screenWidth / 2, 40)
    
    // 绘制解锁进度
    const unlockedCount = this.getUnlockedCount()
    const totalCount = this.getTotalCount()
    ctx.font = '16px Arial'
    ctx.fillText(`已解锁: ${unlockedCount}/${totalCount}`, screenWidth / 2, 70)
    
    // 获取要显示的成就列表
    const achievements = this.getAchievements(true)
    
    // 定义网格布局参数
    const itemWidth = screenWidth * 0.4
    const itemHeight = 120  // 增加高度以适应多行文本
    const itemsPerRow = 2
    const padding = 10
    const startX = (screenWidth - (itemWidth * itemsPerRow + padding * (itemsPerRow - 1))) / 2
    const startY = 100
    
    // 计算内容总高度和最大滚动范围
    const rowCount = Math.ceil(achievements.length / itemsPerRow)
    const contentHeight = startY + rowCount * (itemHeight + padding) + 70 // 加上底部按钮的空间
    this.maxScrollY = Math.max(0, contentHeight - screenHeight)
    
    // 创建裁剪区域，防止内容超出屏幕
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, startY, screenWidth, screenHeight - startY - 70) // 减去底部按钮的空间
    ctx.clip()
    
    // 绘制成就列表
    achievements.forEach((achievement, index) => {
      const row = Math.floor(index / itemsPerRow)
      const col = index % itemsPerRow
      
      const x = startX + col * (itemWidth + padding)
      const y = startY + row * (itemHeight + padding) - this.scrollY
      
      // 只绘制可见区域内的成就项
      if (y + itemHeight < startY || y > screenHeight - 70) {
        return // 跳过不可见的成就项
      }
      
      // 绘制成就项背景
      ctx.fillStyle = achievement.unlocked ? 'rgba(50, 150, 50, 0.7)' : 'rgba(100, 100, 100, 0.7)'
      ctx.strokeStyle = achievement.unlocked ? '#ffcc00' : '#666666'
      ctx.lineWidth = 2
      
      ctx.beginPath()
      ctx.rect(x, y, itemWidth, itemHeight)
      ctx.fill()
      ctx.stroke()
      
      // 绘制成就名称
      ctx.fillStyle = '#ffffff'
      ctx.font = '14px Arial'
      ctx.textAlign = 'left'
      
      // 如果是隐藏成就且未解锁，显示为???
      const name = (achievement.secret && !achievement.unlocked) ? '???' : achievement.name
      
      // 绘制多行文本（限制最大高度）
      const maxWidth = itemWidth - 20 // 左右各留10px的边距
      const nameMaxHeight = 30 // 名称最大高度
      this.drawWrappedText(ctx, name, x + 10, y + 20, maxWidth, 16, nameMaxHeight)
      
      // 绘制成就描述
      ctx.font = '12px Arial'
      const description = (achievement.secret && !achievement.unlocked) ? '隐藏成就' : achievement.description
      const descMaxHeight = 40 // 描述最大高度
      this.drawWrappedText(ctx, description, x + 10, y + 50, maxWidth, 14, descMaxHeight)
      
      // 绘制进度条
      const progressBarWidth = itemWidth - 20
      const progressBarHeight = 10
      const progressX = x + 10
      const progressY = y + itemHeight - 20 // 将进度条移到底部
      
      // 背景
      ctx.fillStyle = '#333333'
      ctx.beginPath()
      ctx.rect(progressX, progressY, progressBarWidth, progressBarHeight)
      ctx.fill()
      
      // 进度
      if (achievement.progress > 0) {
        const progressWidth = (achievement.progress / achievement.target) * progressBarWidth
        ctx.fillStyle = achievement.unlocked ? '#00ff00' : '#ffcc00'
        ctx.beginPath()
        ctx.rect(progressX, progressY, progressWidth, progressBarHeight)
        ctx.fill()
      }
      
      // 进度文本
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `${achievement.progress}/${achievement.target}`,
        progressX + progressBarWidth / 2,
        progressY + progressBarHeight + 10
      )
    })
    
    // 恢复裁剪区域
    ctx.restore()
    
    // 绘制滚动指示器（如果有滚动）
    if (this.maxScrollY > 0) {
      const indicatorHeight = 30
      const indicatorWidth = 5
      const indicatorX = screenWidth - 10
      const indicatorY = startY + 10
      
      // 背景轨道
      ctx.fillStyle = 'rgba(100, 100, 100, 0.5)'
      ctx.beginPath()
      ctx.rect(indicatorX, indicatorY, indicatorWidth, screenHeight - startY - 90)
      ctx.fill()
      
      // 滚动条
      const scrollRatio = this.scrollY / this.maxScrollY
      const scrollBarHeight = Math.max(30, (screenHeight - startY - 90) * (screenHeight - startY - 90) / contentHeight)
      const scrollBarY = indicatorY + scrollRatio * (screenHeight - startY - 90 - scrollBarHeight)
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.beginPath()
      ctx.rect(indicatorX, scrollBarY, indicatorWidth, scrollBarHeight)
      ctx.fill()
    }
    
    // 绘制返回按钮
    const buttonWidth = 100
    const buttonHeight = 40
    const buttonX = screenWidth / 2 - buttonWidth / 2
    const buttonY = screenHeight - 60
    
    ctx.fillStyle = '#4CAF50'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.rect(buttonX, buttonY, buttonWidth, buttonHeight)
    ctx.fill()
    ctx.stroke()
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('返回', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5)
    
    // 保存返回按钮区域
    this.backButtonArea = {
      startX: buttonX,
      startY: buttonY,
      endX: buttonX + buttonWidth,
      endY: buttonY + buttonHeight
    }
  }
  
  /**
   * 渲染成就通知
   * @param {Object} ctx Canvas上下文
   */
  renderAchievementNotification(ctx) {
    // 如果当前没有显示通知，直接返回
    if (!this.isShowingNotification || this.notificationQueue.length === 0) {
      return
    }
    
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // 绘制通知背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.strokeStyle = '#ffcc00'
    ctx.lineWidth = 2
    
    // 圆角矩形
    const notificationWidth = screenWidth * 0.8
    const notificationHeight = 60
    const x = (screenWidth - notificationWidth) / 2
    const y = 50
    
    ctx.beginPath()
    // 使用普通矩形代替圆角矩形
    ctx.rect(x, y, notificationWidth, notificationHeight)
    ctx.fill()
    ctx.stroke()
    
    // 绘制成就图标
    // 注意：这里假设成就图标已加载，实际使用时需要确保图标已加载
    const currentAchievement = this.notificationQueue[0]
    
    // 绘制成就文本
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('成就解锁！', screenWidth / 2, y + 20)
    
    ctx.font = '14px Arial'
    // 绘制成就名称（居中显示，如果太长则截断）
    const maxWidth = notificationWidth - 20
    this.drawWrappedText(ctx, currentAchievement.name, screenWidth / 2, y + 40, maxWidth, 14, 20, true)
  }
  
  /**
   * 绘制自动换行的文本（限制最大高度）
   * @param {Object} ctx Canvas上下文
   * @param {String} text 文本内容
   * @param {Number} x 起始x坐标
   * @param {Number} y 起始y坐标
   * @param {Number} maxWidth 每行最大宽度
   * @param {Number} lineHeight 行高
   * @param {Number} maxHeight 最大高度（可选）
   * @param {Boolean} center 是否居中显示（可选）
   */
  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxHeight = Infinity, center = false) {
    // 如果文本为空，直接返回
    if (!text) return;
    
    // 将文本按字符分割
    const chars = text.split('');
    let line = '';
    let testLine = '';
    let lineY = y;
    let totalHeight = 0;
    
    // 逐字检查是否需要换行
    for (let i = 0; i < chars.length; i++) {
      testLine = line + chars[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line, x, lineY);
        line = chars[i];
        lineY += lineHeight;
        totalHeight += lineHeight;
        
        // 检查是否超出最大高度
        if (totalHeight + lineHeight > maxHeight) {
          // 如果下一行会超出最大高度，在当前行末尾添加省略号
          if (i < chars.length - 1) {
            // 回退到上一行的末尾位置
            lineY -= lineHeight;
            // 测量省略号的宽度
            const ellipsisWidth = ctx.measureText('...').width;
            // 尝试找到能够放下省略号的位置
            let truncatedLine = line;
            while (ctx.measureText(truncatedLine + '...').width > maxWidth && truncatedLine.length > 0) {
              truncatedLine = truncatedLine.slice(0, -1);
            }
            // 绘制截断的行和省略号
            ctx.fillText(truncatedLine + '...', x, lineY + lineHeight);
          }
          break;
        }
      } else {
        line = testLine;
      }
    }
    
    // 绘制最后一行（如果没有超出最大高度）
    if (totalHeight < maxHeight) {
      if (center) {
        const lastLineWidth = ctx.measureText(line).width;
        ctx.fillText(line, x - lastLineWidth / 2, lineY);
      } else {
        ctx.fillText(line, x, lineY);
      }
    }
  }
}
