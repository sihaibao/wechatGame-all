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
import SuperBomb from './power/superBomb'
// 导入广告管理器
import AdManager from './runtime/adManager'
// 导入配置
import Config from './config'

let ctx = canvas.getContext('2d')
let databus = new DataBus()

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    // 维护当前requestAnimationFrame的id
    this.aniId = 0

    // 初始化广告管理器
    this.adManager = new AdManager()
    
    // 成就界面显示状态
    this.showingAchievements = false

    this.restart()
  }

  restart() {
    databus.reset()
    
    // 重置广告管理器状态
    this.adManager.reset()

    canvas.removeEventListener(
      'touchstart',
      this.touchHandler
    )
    canvas.removeEventListener(
      'touchmove',
      this.touchHandler
    )
    canvas.removeEventListener(
      'touchend',
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
    // 获取当前关卡配置
    const currentLevel = databus.getCurrentLevel()
    
    if (databus.frame % currentLevel.enemySpawnRate === 0) {
      let enemy = databus.pool.getItemByClass('enemy', Enemy)
      enemy.init(currentLevel.enemySpeed)
      databus.enemys.push(enemy)
    }
  }

  /**
   * 随着帧数变化的道具生成逻辑
   * 帧数取模定义成生成的频率
   */
  powerItemGenerate() {
    // 获取当前关卡配置
    const currentLevel = databus.getCurrentLevel()
    
    // 根据当前关卡配置决定道具生成频率
    if (databus.frame % currentLevel.powerItemSpawnRate === 0) {
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
          
          // 使用新的加分方法，考虑广告奖励的得分倍率
          const pointsGained = databus.addScore(1)
          
          // 记录击败敌人
          databus.recordEnemyDefeated()
          
          // 如果有双倍得分，显示特效
          if (pointsGained > 1) {
            // 这里可以添加双倍得分的特效
          }

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
        
        // 记录收集道具
        databus.recordItemCollected(powerItem.type)
        
        // 设置道具为不可见
        powerItem.visible = false
        
        // 从数组中移除道具
        databus.powerItems.splice(i, 1)
        i--
      }
    }

    // 检测玩家与敌人碰撞
    for (let i = 0, il = databus.enemys.length; i < il; i++) {
      let enemy = databus.enemys[i]

      if (this.player.isCollideWith(enemy)) {
        databus.gameOver = true
        
        // 游戏结束时记录游戏结束
        databus.recordGameEnd()

        break
      }
    }
  }

  /**
   * 触摸事件处理函数
   */
  touchEventHandler(e) {
    console.log('触摸事件:', e.type);
    e.preventDefault()

    let x = 0, y = 0
    
    // 根据事件类型获取触摸坐标
    if (e.type === 'touchstart' || e.type === 'touchmove') {
      if (e.touches && e.touches.length > 0) {
        x = e.touches[0].clientX
        y = e.touches[0].clientY
      }
    } else if (e.type === 'touchend' || e.type === 'touchcancel') {
      console.log('touchend/touchcancel事件，changedTouches:', e.changedTouches && e.changedTouches.length);
      if (e.changedTouches && e.changedTouches.length > 0) {
        x = e.changedTouches[0].clientX
        y = e.changedTouches[0].clientY
      }
    }
    
    console.log('触摸坐标:', x, y);

    // 如果正在显示成就界面，优先处理成就界面的触摸事件
    if (this.showingAchievements && databus.achievementSystem) {
      console.log('成就界面显示中，处理触摸事件');
      // 将触摸事件传递给成就系统
      const handled = databus.achievementSystem.handleTouch(x, y, e.type)
      console.log('成就系统处理结果:', handled);
      
      // 检查是否点击了返回按钮
      if (e.type === 'touchstart' && databus.achievementSystem.backButtonArea) {
        const backButton = databus.achievementSystem.backButtonArea;
        
        // 检查触摸位置是否在返回按钮区域内
        const isInBackButton = 
          x >= backButton.startX && x <= backButton.endX && 
          y >= backButton.startY && y <= backButton.endY;
        
        console.log('检查返回按钮区域:', 
          'x:', x, 'y:', y, 
          'buttonX:', backButton.startX, 'buttonY:', backButton.startY,
          'buttonEndX:', backButton.endX, 'buttonEndY:', backButton.endY,
          '是否在按钮内:', isInBackButton);
        
        if (isInBackButton) {
          console.log('点击在返回按钮区域内，执行返回操作');
          
          // 隐藏成就界面
          this.showingAchievements = false;
          
          // 调用成就系统的hideScreen方法
          databus.achievementSystem.hideScreen();
          
          // 播放按钮音效
          this.music.playShoot();
          return;
        }
      }
      
      // 如果成就系统处理了触摸事件，则不再继续处理
      if (handled) {
        return
      }
      
      // 如果在成就界面但没有点击任何按钮，则不再继续处理
      return
    }

    // 游戏结束状态下的按钮处理
    if (databus.gameOver) {
      let area = this.gameinfo.btnArea
      
      // 重新开始按钮
      if (x >= area.startX
        && x <= area.endX
        && y >= area.startY
        && y <= area.endY) {
        this.restart()
        
        // 播放按钮音效
        this.music.playShoot()
        return
      }
      
      // 检查是否点击了成就按钮
      if (this.gameinfo.achievementBtnArea) {
        if (x >= this.gameinfo.achievementBtnArea.startX
          && x <= this.gameinfo.achievementBtnArea.endX
          && y >= this.gameinfo.achievementBtnArea.startY
          && y <= this.gameinfo.achievementBtnArea.endY) {
          
          // 显示成就界面
          this.showingAchievements = true
          
          // 使用成就系统的showScreen方法
          if (databus.achievementSystem) {
            databus.achievementSystem.showScreen()
          }
          
          // 播放按钮音效
          this.music.playShoot()
          return
        }
      }
      
      // 检查是否点击了复活按钮
      if (Config.ads.enabled && this.gameinfo.reviveBtnArea) {
        if (x >= this.gameinfo.reviveBtnArea.startX
          && x <= this.gameinfo.reviveBtnArea.endX
          && y >= this.gameinfo.reviveBtnArea.startY
          && y <= this.gameinfo.reviveBtnArea.endY) {
          
          // 显示复活广告
          this.showReviveAd()
          return
        }
      }
      
      // 检查是否点击了特殊道具按钮
      if (Config.ads.enabled && this.gameinfo.specialItemBtnArea) {
        if (x >= this.gameinfo.specialItemBtnArea.startX
          && x <= this.gameinfo.specialItemBtnArea.endX
          && y >= this.gameinfo.specialItemBtnArea.startY
          && y <= this.gameinfo.specialItemBtnArea.endY) {
          
          // 显示特殊道具广告
          this.showSpecialItemAd()
          return
        }
      }
    } else {
      // 游戏进行中的触摸处理
      
      // 检查是否点击了使用特殊道具按钮
      if (databus.specialItem && this.gameinfo.useSpecialItemBtnArea) {
        if (x >= this.gameinfo.useSpecialItemBtnArea.startX
          && x <= this.gameinfo.useSpecialItemBtnArea.endX
          && y >= this.gameinfo.useSpecialItemBtnArea.startY
          && y <= this.gameinfo.useSpecialItemBtnArea.endY) {
          
          // 使用特殊道具
          const result = databus.useSpecialItem()
          
          // 检查是否触发了千钧一发成就
          if (result && result.narrowEscape) {
            databus.recordNarrowEscape()
          }
          
          return
        }
      }
    }
  }

  /**
   * 显示复活广告
   */
  showReviveAd() {
    this.adManager.showReviveAd(
      // 复活成功回调
      () => {
        databus.gameOver = false
      },
      // 复活失败回调
      (err) => {
        console.log('复活失败', err)
      }
    )
  }
  
  /**
   * 显示特殊道具广告
   */
  showSpecialItemAd() {
    this.adManager.showSpecialItemAd(
      // 成功回调
      () => {
        // 创建超级炸弹道具
        const superBomb = new SuperBomb()
        databus.setSpecialItem(superBomb)
        
        // 重新开始游戏
        databus.gameOver = false
      },
      // 失败回调
      (err) => {
        console.log('获取特殊道具失败', err)
      }
    )
  }

  // 游戏逻辑更新主函数
  update() {
    if (databus.gameOver)
      return;

    this.bg.update()

    // 更新玩家的道具状态（护盾等）
    this.player.updatePowerStatus()

    databus.bullets
      .concat(databus.enemys)
      .concat(databus.powerItems)
      .forEach((item) => {
        item.update()
      })

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

  // 游戏画面渲染函数
  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    this.bg.render(ctx)

    databus.bullets
      .concat(databus.enemys)
      .concat(databus.powerItems)
      .forEach((item) => {
        item.drawToCanvas(ctx)
      })

    this.player.drawToCanvas(ctx)
    
    // 渲染动画
    databus.animations.forEach((ani) => {
      if (ani.isPlaying) {
        ani.aniRender(ctx)
      }
    })
    
    // 如果有特殊道具，渲染使用按钮
    if (databus.specialItem) {
      this.gameinfo.renderSpecialItemButton(ctx)
    }

    // 游戏结束停止帧循环
    if (databus.gameOver) {
      this.gameinfo.renderGameOver(
        ctx, 
        databus.score,
        databus.highScore,
        Config.ads.enabled ? Config.ads : null,
        this.adManager
      )

      if (!this.hasEventBind) {
        this.hasEventBind = true
        this.touchHandler = this.touchEventHandler.bind(this)
        canvas.addEventListener('touchstart', this.touchHandler)
        canvas.addEventListener('touchmove', this.touchHandler)
        canvas.addEventListener('touchend', this.touchHandler)
      }
    } else {
      // 正常游戏中
      // 绘制分数和最高分
      this.gameinfo.renderGameScore(
        ctx, 
        databus.score,
        databus.highScore,
        Config.ads.enabled && databus.adRewardActive
      )
    }
    
    // 如果正在显示成就界面
    if (this.showingAchievements && databus.achievementSystem) {
      databus.achievementSystem.renderAchievementScreen(ctx)
    }
    
    // 如果有成就通知需要显示
    if (Config.achievements.enabled && 
        Config.achievements.showNotifications && 
        databus.achievementSystem) {
      databus.achievementSystem.renderAchievementNotification(ctx)
    }
  }
}
