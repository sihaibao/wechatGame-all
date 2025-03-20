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
    this.notificationDuration = 120 // 帧数，约2秒
    this.notificationTimer = 0
    
    // 成就通知动画相关
    this.notificationAnimation = {
      active: false,
      startTime: 0,
      duration: 500, // 动画持续时间（毫秒）
      currentAchievement: null,
      slideInComplete: false,
      stayDuration: 2000, // 停留时间（毫秒）
      slideOutComplete: false
    }
    
    // 成就界面滚动相关
    this.scrollY = 0
    this.maxScrollY = 0
    this.touchStartY = 0
    this.isTouching = false
    this.velocity = 0
    this.lastTouchY = 0
    this.lastTouchTime = 0
    this.inertialScrollId = null
    
    // 缓存屏幕尺寸
    this.screenWidth = window.innerWidth
    this.screenHeight = window.innerHeight
    
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
    
    // 新增debugRender属性
    this.debugRender = true
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
            // 确保保留原始成就的所有属性，只更新解锁状态和进度
            this.achievements[index] = {
              ...achievement,
              unlocked: parsed[achievement.id].unlocked,
              progress: parsed[achievement.id].progress
            }
          }
        })
      } else {
        console.log('未找到已保存的成就数据，使用默认值')
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
      
      const jsonData = JSON.stringify(achievementsToSave)
      wx.setStorageSync('achievements', jsonData)
      console.log('成就数据已保存到本地存储', jsonData)
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
    
    if (achievementIndex === -1) {
      console.error(`找不到成就: ${id}`)
      return
    }
    
    const achievement = this.achievements[achievementIndex]
    
    // 如果已解锁，不再更新进度
    if (achievement.unlocked) {
      return
    }
    
    // 更新进度
    const oldProgress = achievement.progress
    if (absolute) {
      achievement.progress = progress
    } else {
      achievement.progress += progress
    }
    
    // 确保进度不超过目标值
    if (achievement.progress > achievement.target) {
      achievement.progress = achievement.target
    }
    
    // 检查是否达成
    if (achievement.progress >= achievement.target && !achievement.unlocked) {
      achievement.progress = achievement.target
      achievement.unlocked = true
      
      // 添加到通知队列
      this.notificationQueue.push(achievement)
      
      // 如果当前没有显示通知，开始显示
      if (!this.isShowingNotification) {
        this.showNextNotification()
      }
      
      // 播放成就解锁音效（如果有）
      if (typeof wx.createInnerAudioContext === 'function') {
        try {
          const achievementSound = wx.createInnerAudioContext()
          achievementSound.src = 'audio/achievement.mp3' // 假设有这个音效文件
          achievementSound.play()
        } catch (e) {
          console.error('播放成就解锁音效失败', e)
        }
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
      this.notificationAnimation.active = false
      return
    }
    
    this.isShowingNotification = true
    
    // 获取队列中的第一个成就，但不从队列中移除
    const achievement = this.notificationQueue[0]
    
    // 设置动画状态
    this.notificationAnimation = {
      active: true,
      startTime: Date.now(),
      duration: 500, // 滑入动画持续时间（毫秒）
      currentAchievement: achievement,
      slideInComplete: false,
      stayDuration: 2000, // 停留时间（毫秒）
      slideOutComplete: false
    }
    
    // 使用原生toast通知（如果支持）
    if (typeof wx.showToast === 'function') {
      try {
        wx.showToast({
          title: `成就解锁：${achievement.name}`,
          icon: 'success',
          duration: 2000
        })
      } catch (e) {
        console.error('显示原生toast失败', e)
      }
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
    
    // 检查是否点击了返回按钮
    if (type === 'touchstart' && this.backButtonArea) {
      if (x >= this.backButtonArea.startX && x <= this.backButtonArea.endX &&
          y >= this.backButtonArea.startY && y <= this.backButtonArea.endY) {
        return false; // 返回false，让main.js处理返回按钮点击
      }
    }
    
    // 处理滚动
    if (type === 'touchstart') {
      this.touchStartY = y
      this.isTouching = true
      this.lastTouchTime = Date.now()
      this.lastTouchY = y
      this.velocity = 0
      
      // 停止任何正在进行的惯性滚动
      if (this.inertialScrollId) {
        clearInterval(this.inertialScrollId)
        this.inertialScrollId = null
      }
      
      return true
    } else if (type === 'touchmove' && this.isTouching) {
      const deltaY = y - this.lastTouchY
      
      // 计算滚动速度
      const now = Date.now()
      const elapsed = now - this.lastTouchTime
      if (elapsed > 0) {
        this.velocity = (y - this.lastTouchY) / elapsed
      }
      this.lastTouchTime = now
      this.lastTouchY = y
      
      this.scrollY -= deltaY
      
      // 限制滚动范围
      if (this.scrollY < 0) {
        this.scrollY = 0
      } else if (this.scrollY > this.maxScrollY) {
        this.scrollY = this.maxScrollY
      }
      
      return true
    } else if (type === 'touchend' || type === 'touchcancel') {
      if (this.isTouching) {
        this.isTouching = false
        
        // 添加惯性滚动
        if (Math.abs(this.velocity) > 0.1) {
          this.startInertialScroll()
        }
        
        return true
      }
    }
    
    return false
  }
  
  /**
   * 开始惯性滚动
   */
  startInertialScroll() {
    // 清除之前的惯性滚动
    if (this.inertialScrollId) {
      clearInterval(this.inertialScrollId)
      this.inertialScrollId = null
    }
    
    // 设置初始速度和衰减因子
    let velocity = this.velocity * 15 // 放大速度效果
    const friction = 0.95 // 摩擦系数
    
    this.inertialScrollId = setInterval(() => {
      // 应用速度
      this.scrollY -= velocity
      
      // 限制滚动范围
      if (this.scrollY < 0) {
        this.scrollY = 0
        velocity = 0
      } else if (this.scrollY > this.maxScrollY) {
        this.scrollY = this.maxScrollY
        velocity = 0
      }
      
      // 应用摩擦力
      velocity *= friction
      
      // 当速度足够小时停止滚动
      if (Math.abs(velocity) < 0.1) {
        clearInterval(this.inertialScrollId)
        this.inertialScrollId = null
      }
    }, 16) // 约60fps
  }
  
  /**
   * 显示成就界面
   */
  showScreen() {
    this.isShowingScreen = true
    this.scrollY = 0 // 重置滚动位置
    this.isTouching = false // 确保触摸状态被重置
    this.velocity = 0 // 重置速度
    this.debugRender = true // 允许下一次渲染时输出日志
    
    // 清除任何正在进行的惯性滚动
    if (this.inertialScrollId) {
      clearInterval(this.inertialScrollId)
      this.inertialScrollId = null
    }
  }
  
  /**
   * 隐藏成就界面
   */
  hideScreen() {
    this.isShowingScreen = false
    
    // 清除任何正在进行的惯性滚动
    if (this.inertialScrollId) {
      clearInterval(this.inertialScrollId)
      this.inertialScrollId = null
    }
    
    // 恢复默认文本对齐方式
    const ctx = window.canvas.getContext('2d')
    if (ctx) {
      ctx.textAlign = 'left'
    }
  }
  
  /**
   * 渲染成就界面
   * @param {Object} ctx Canvas上下文
   */
  renderAchievementScreen(ctx) {
    if (!this.isShowingScreen) return
    
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // 绘制半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    ctx.fillRect(0, 0, screenWidth, screenHeight)
    
    // 绘制标题
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('成就列表', screenWidth / 2, 50)
    
    // 绘制解锁进度
    const unlockedCount = this.getUnlockedCount()
    const totalCount = this.getTotalCount()
    ctx.font = '16px Arial'
    ctx.fillText(`已解锁: ${unlockedCount}/${totalCount}`, screenWidth / 2, 80)
    
    // 获取成就列表（包括未解锁的非隐藏成就）
    const achievements = this.getAchievements(true)
    
    // 计算布局参数
    const startY = 100
    const padding = 10
    const itemsPerRow = screenWidth >= 500 ? 2 : 1
    const itemWidth = (screenWidth - (itemsPerRow + 1) * padding) / itemsPerRow
    const startX = padding
    const itemHeight = 110 // 调整成就项高度，使布局更紧凑
    
    // 计算内容总高度和最大滚动范围
    const rowCount = Math.ceil(achievements.length / itemsPerRow)
    const contentHeight = startY + rowCount * (itemHeight + padding) + 70
    this.maxScrollY = Math.max(0, contentHeight - screenHeight)
    
    // 计算可见行的范围
    const visibleStartRow = Math.floor(this.scrollY / (itemHeight + padding))
    const visibleEndRow = Math.ceil((this.scrollY + screenHeight - startY) / (itemHeight + padding))
    
    // 创建裁剪区域
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, startY, screenWidth, screenHeight - startY - 70) // 减去底部按钮的空间
    ctx.clip()
    
    // 应用滚动偏移
    ctx.translate(0, -this.scrollY)
    
    // 绘制成就列表
    for (let index = visibleStartRow * itemsPerRow; 
         index < Math.min(achievements.length, (visibleEndRow + 1) * itemsPerRow); 
         index++) {
      const achievement = achievements[index]
      const row = Math.floor(index / itemsPerRow)
      const col = index % itemsPerRow
      
      const x = startX + col * (itemWidth + padding)
      const y = startY + row * (itemHeight + padding)
      
      // 绘制成就项背景
      if (achievement.unlocked) {
        ctx.fillStyle = 'rgba(0, 100, 0, 0.8)' // 已解锁成就使用深绿色
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)' // 亮绿色边框
      } else {
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)' // 未解锁成就使用深灰色
        ctx.strokeStyle = 'rgba(150, 150, 150, 0.9)' // 亮灰色边框
      }
      
      // 绘制圆角矩形背景
      const radius = 5
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + itemWidth - radius, y)
      ctx.quadraticCurveTo(x + itemWidth, y, x + itemWidth, y + radius)
      ctx.lineTo(x + itemWidth, y + itemHeight - radius)
      ctx.quadraticCurveTo(x + itemWidth, y + itemHeight, x + itemWidth - radius, y + itemHeight)
      ctx.lineTo(x + radius, y + itemHeight)
      ctx.quadraticCurveTo(x, y + itemHeight, x, y + itemHeight - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()
      
      // 绘制边框
      ctx.lineWidth = 2
      ctx.stroke()
      
      // 绘制成就名称
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Arial'
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
      this.drawWrappedText(ctx, description, x + 10, y + 45, maxWidth, 14, descMaxHeight)
      
      // 绘制进度条
      const progressBarWidth = itemWidth - 20
      const progressBarHeight = 10
      const progressX = x + 10
      const progressY = y + itemHeight - 35 // 将进度条往上移动更多
      
      // 进度条背景
      ctx.fillStyle = '#333333'
      ctx.beginPath()
      ctx.rect(progressX, progressY, progressBarWidth, progressBarHeight)
      ctx.fill()
      
      // 进度条边框
      ctx.strokeStyle = '#555555'
      ctx.lineWidth = 1
      ctx.strokeRect(progressX, progressY, progressBarWidth, progressBarHeight)
      
      // 进度
      if (achievement.progress > 0) {
        const progressWidth = (achievement.progress / achievement.target) * progressBarWidth
        
        // 创建渐变色进度条
        let progressGradient = ctx.createLinearGradient(
          progressX, progressY, 
          progressX + progressWidth, progressY
        );
        
        if (achievement.unlocked) {
          // 已解锁成就使用绿色渐变
          progressGradient.addColorStop(0, 'rgba(0, 200, 0, 0.8)');
          progressGradient.addColorStop(1, 'rgba(0, 255, 0, 0.9)');
        } else {
          // 未解锁成就使用黄色渐变
          progressGradient.addColorStop(0, 'rgba(200, 150, 0, 0.8)');
          progressGradient.addColorStop(1, 'rgba(255, 200, 0, 0.9)');
        }
        
        ctx.fillStyle = progressGradient;
        ctx.beginPath()
        ctx.rect(progressX, progressY, progressWidth, progressBarHeight)
        ctx.fill()
        
        // 添加进度条光泽效果
        const shineHeight = progressBarHeight / 2;
        let shineGradient = ctx.createLinearGradient(
          progressX, progressY, 
          progressX, progressY + shineHeight
        );
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = shineGradient;
        ctx.beginPath();
        ctx.rect(progressX, progressY, progressWidth, shineHeight);
        ctx.fill();
      }
      
      // 进度文本
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `${achievement.progress}/${achievement.target}`,
        progressX + progressBarWidth / 2,
        progressY + progressBarHeight + 12
      )
    }
    
    // 恢复状态
    ctx.restore()
    
    // 添加滚动指示器（如果有可滚动内容）
    if (this.maxScrollY > 0) {
      const indicatorWidth = 5
      const indicatorHeight = 30
      const indicatorX = screenWidth - indicatorWidth - 5
      const indicatorY = 80 + (screenHeight - 120 - indicatorHeight) * (this.scrollY / this.maxScrollY)
      
      // 滚动条背景
      ctx.fillStyle = 'rgba(100, 100, 100, 0.3)'
      ctx.fillRect(indicatorX, 80, indicatorWidth, screenHeight - 120)
      
      // 滚动条指示器
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight)
    }
    
    // 绘制返回按钮
    const buttonWidth = 80
    const buttonHeight = 40
    const buttonX = screenWidth / 2 - buttonWidth / 2
    const buttonY = screenHeight - 60
    
    // 设置按钮颜色
    ctx.fillStyle = '#4CAF50'; // 绿色按钮
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    
    // 绘制圆角矩形按钮
    const radius = 5;
    ctx.beginPath();
    ctx.moveTo(buttonX + radius, buttonY);
    ctx.lineTo(buttonX + buttonWidth - radius, buttonY);
    ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY, buttonX + buttonWidth, buttonY + radius);
    ctx.lineTo(buttonX + buttonWidth, buttonY + buttonHeight - radius);
    ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY + buttonHeight, buttonX + buttonWidth - radius, buttonY + buttonHeight);
    ctx.lineTo(buttonX + radius, buttonY + buttonHeight);
    ctx.quadraticCurveTo(buttonX, buttonY + buttonHeight, buttonX, buttonY + buttonHeight - radius);
    ctx.lineTo(buttonX, buttonY + radius);
    ctx.quadraticCurveTo(buttonX, buttonY, buttonX + radius, buttonY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
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
    if (!this.isShowingNotification || !this.notificationAnimation.active) {
      return
    }
    
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const animation = this.notificationAnimation
    const currentTime = Date.now()
    const elapsedTime = currentTime - animation.startTime
    
    // 通知框尺寸和位置
    const notificationWidth = Math.min(screenWidth * 0.8, 300)
    const notificationHeight = 80
    const notificationX = (screenWidth - notificationWidth) / 2
    let notificationY = 0
    
    // 计算动画阶段
    if (!animation.slideInComplete) {
      // 滑入阶段
      if (elapsedTime < animation.duration) {
        // 计算滑入动画的Y位置（从屏幕上方滑入）
        const progress = elapsedTime / animation.duration
        notificationY = -notificationHeight + (notificationHeight + 20) * progress
      } else {
        // 滑入完成
        notificationY = 20
        animation.slideInComplete = true
        animation.startTime = currentTime // 重置计时器，用于停留阶段
      }
    } else if (!animation.slideOutComplete) {
      // 停留阶段
      notificationY = 20
      
      if (elapsedTime > animation.stayDuration) {
        // 停留时间结束，开始滑出
        animation.slideOutComplete = true
        animation.startTime = currentTime // 重置计时器，用于滑出阶段
      }
    } else {
      // 滑出阶段
      if (elapsedTime < animation.duration) {
        // 计算滑出动画的Y位置（向屏幕上方滑出）
        const progress = elapsedTime / animation.duration
        notificationY = 20 - (notificationHeight + 20) * progress
      } else {
        // 滑出完成，移除当前通知并显示下一个
        this.notificationQueue.shift() // 移除已显示的通知
        
        // 重置动画状态
        this.notificationAnimation.active = false
        
        // 延迟一段时间后显示下一个通知
        setTimeout(() => {
          this.showNextNotification()
        }, 500)
        
        return // 不再渲染当前通知
      }
    }
    
    // 获取当前要显示的成就
    const achievement = animation.currentAchievement
    
    // 绘制通知背景（带渐变和光晕效果）
    ctx.save()
    
    // 创建圆角矩形路径
    const radius = 10
    ctx.beginPath()
    ctx.moveTo(notificationX + radius, notificationY)
    ctx.lineTo(notificationX + notificationWidth - radius, notificationY)
    ctx.quadraticCurveTo(notificationX + notificationWidth, notificationY, notificationX + notificationWidth, notificationY + radius)
    ctx.lineTo(notificationX + notificationWidth, notificationY + notificationHeight - radius)
    ctx.quadraticCurveTo(notificationX + notificationWidth, notificationY + notificationHeight, notificationX + notificationWidth - radius, notificationY + notificationHeight)
    ctx.lineTo(notificationX + radius, notificationY + notificationHeight)
    ctx.quadraticCurveTo(notificationX, notificationY + notificationHeight, notificationX, notificationY + notificationHeight - radius)
    ctx.lineTo(notificationX, notificationY + radius)
    ctx.quadraticCurveTo(notificationX, notificationY, notificationX + radius, notificationY)
    ctx.closePath()
    
    // 创建背景渐变
    const gradient = ctx.createLinearGradient(
      notificationX, notificationY,
      notificationX, notificationY + notificationHeight
    )
    gradient.addColorStop(0, 'rgba(50, 50, 50, 0.95)')
    gradient.addColorStop(1, 'rgba(30, 30, 30, 0.95)')
    
    // 填充背景
    ctx.fillStyle = gradient
    ctx.fill()
    
    // 添加金色边框
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 添加光晕效果
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.stroke()
    
    // 绘制成就图标（如果有）
    const iconSize = 50
    const iconX = notificationX + 15
    const iconY = notificationY + (notificationHeight - iconSize) / 2
    
    // 绘制默认图标（奖杯形状）
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    // 简化的奖杯形状
    ctx.arc(iconX + iconSize/2, iconY + iconSize/3, iconSize/3, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(iconX + iconSize/3, iconY + iconSize/2, iconSize/3, iconSize/2)
    
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(iconX + iconSize/6, iconY + iconSize - 5, iconSize*2/3, 5)
    
    // 重置阴影
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    
    // 绘制成就文本
    const textX = iconX + iconSize + 10
    const textWidth = notificationWidth - textX + notificationX - 10
    
    // 绘制"成就解锁"标题
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('成就解锁!', textX, notificationY + 25)
    
    // 绘制成就名称
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '12px Arial'
    this.drawWrappedText(
      ctx,
      achievement.name,
      textX,
      notificationY + 45,
      textWidth,
      16,
      30
    )
    
    // 恢复绘图状态
    ctx.restore()
    
    // 添加闪烁效果
    if (animation.slideInComplete && !animation.slideOutComplete) {
      const flashInterval = 500 // 闪烁间隔（毫秒）
      if ((currentTime % flashInterval) < flashInterval / 2) {
        // 绘制闪烁光晕
        ctx.save()
        ctx.globalAlpha = 0.3
        ctx.beginPath()
        ctx.rect(notificationX, notificationY, notificationWidth, notificationHeight)
        ctx.fillStyle = '#FFD700'
        ctx.fill()
        ctx.restore()
      }
    }
  }
  
  /**
   * 渲染方法，供游戏主循环调用
   * @param {Object} ctx Canvas上下文
   */
  render(ctx) {
    // 如果成就界面正在显示，则渲染成就界面
    if (this.isShowingScreen) {
      this.renderAchievementScreen(ctx)
    }
    
    // 无论成就界面是否显示，都需要渲染成就通知（如果有）
    this.renderAchievementNotification(ctx)
  }
  
  /**
   * 绘制自动换行的文本（限制最大高度）
   * @param {Object} ctx Canvas上下文
   * @param {String} text 文本内容
   * @param {Number} x 起始x坐标
   * @param {Number} y 起始y坐标
   * @param {Number} maxWidth 每行最大宽度
   * @param {Number} lineHeight 行高
   * @param {Number} maxHeight 最大高度限制
   * @param {Boolean} center 是否居中显示（可选）
   */
  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxHeight = Infinity, center = false) {
    if (!text) return;
    
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineY = y;
    let totalHeight = 0;
    
    // 逐字检查是否需要换行
    for (let i = 0; i < words.length; i++) {
      testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && i > 0) {
        // 检查是否超出最大高度
        if ((lineY + lineHeight) > maxHeight) {
          // 如果下一行会超出最大高度，在当前行末尾添加省略号
          if (i < words.length - 1) {
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
        
        ctx.fillText(line, x, lineY);
        line = words[i] + ' ';
        lineY += lineHeight;
        totalHeight += lineHeight;
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
