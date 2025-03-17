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
    if (databus.frame % 30 === 0) {
      let enemy = databus.pool.getItemByClass('enemy', Enemy)
      enemy.init(6)
      databus.enemys.push(enemy)
    }
  }

  /**
   * 随着帧数变化的道具生成逻辑
   * 帧数取模定义成生成的频率
   */
  powerItemGenerate() {
    // 每隔300帧（约5秒）生成一个道具
    if (databus.frame % 300 === 0) {
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
        
        // 设置道具为不可见
        powerItem.visible = false
        
        // 从数组中移除道具
        databus.powerItems.splice(i, 1)
        i--
      }
    }

    for (let i = 0, il = databus.enemys.length; i < il; i++) {
      let enemy = databus.enemys[i]

      if (this.player.isCollideWith(enemy)) {
        databus.gameOver = true
        
        // 游戏结束时保存最高分
        databus.saveHighScore()

        break
      }
    }
  }

  // 游戏结束后的触摸事件处理逻辑
  touchEventHandler(e) {
    e.preventDefault()

    let x = e.touches[0].clientX
    let y = e.touches[0].clientY

    let area = this.gameinfo.btnArea

    if (x >= area.startX
      && x <= area.endX
      && y >= area.startY
      && y <= area.endY) {
      this.restart()
      
      // 播放按钮音效
      this.music.playShoot()
    }
    
    // 检查是否点击了复活按钮
    if (databus.gameOver && this.gameinfo.reviveBtnArea) {
      if (x >= this.gameinfo.reviveBtnArea.startX
        && x <= this.gameinfo.reviveBtnArea.endX
        && y >= this.gameinfo.reviveBtnArea.startY
        && y <= this.gameinfo.reviveBtnArea.endY) {
        
        // 显示复活广告
        this.showReviveAd()
      }
    }
    
    // 检查是否点击了特殊道具按钮
    if (databus.gameOver && this.gameinfo.specialItemBtnArea) {
      if (x >= this.gameinfo.specialItemBtnArea.startX
        && x <= this.gameinfo.specialItemBtnArea.endX
        && y >= this.gameinfo.specialItemBtnArea.startY
        && y <= this.gameinfo.specialItemBtnArea.endY) {
        
        // 显示特殊道具广告
        this.showSpecialItemAd()
      }
    }
    
    // 检查是否点击了双倍得分按钮
    if (databus.gameOver && this.gameinfo.doubleScoreBtnArea) {
      if (x >= this.gameinfo.doubleScoreBtnArea.startX
        && x <= this.gameinfo.doubleScoreBtnArea.endX
        && y >= this.gameinfo.doubleScoreBtnArea.startY
        && y <= this.gameinfo.doubleScoreBtnArea.endY) {
        
        // 显示双倍得分广告
        this.showDoubleScoreAd()
      }
    }
    
    // 检查是否点击了特殊道具使用按钮
    if (!databus.gameOver && databus.specialItem && this.gameinfo.useSpecialItemBtnArea) {
      if (x >= this.gameinfo.useSpecialItemBtnArea.startX
        && x <= this.gameinfo.useSpecialItemBtnArea.endX
        && y >= this.gameinfo.useSpecialItemBtnArea.startY
        && y <= this.gameinfo.useSpecialItemBtnArea.endY) {
        
        // 使用特殊道具
        this.useSpecialItem()
      }
    }
  }

  /**
   * 显示复活广告
   */
  showReviveAd() {
    if (!Config.ads.enabled || !Config.ads.revive.enabled) {
      return
    }
    
    this.adManager.showReviveAd(
      // 成功回调
      () => {
        // 复活玩家
        databus.gameOver = false
        
        // 清除屏幕上的所有敌机
        databus.enemys = []
        
        // 给予短暂的无敌时间
        this.player.hasShield = true
        this.player.shieldTime = 180 // 3秒无敌
        
        // 移除事件监听
        this.hasEventBind = false
        canvas.removeEventListener('touchstart', this.touchHandler)
      },
      // 失败回调
      (reason) => {
        console.log('复活失败:', reason)
        // 可以显示提示信息
      }
    )
  }
  
  /**
   * 显示双倍得分广告
   */
  showDoubleScoreAd() {
    if (!Config.ads.enabled || !Config.ads.doubleScore.enabled) {
      return
    }
    
    this.adManager.showDoubleScoreAd(
      // 成功回调
      () => {
        // 激活双倍得分
        databus.adRewardActive = true
        
        // 重新开始游戏
        this.restart()
      },
      // 失败回调
      (reason) => {
        console.log('双倍得分激活失败:', reason)
        // 可以显示提示信息
      }
    )
  }
  
  /**
   * 显示特殊道具广告
   */
  showSpecialItemAd() {
    if (!Config.ads.enabled || !Config.ads.specialItem.enabled) {
      return
    }
    
    this.adManager.showSpecialItemAd(
      // 成功回调
      () => {
        // 创建特殊道具
        let superBomb = databus.pool.getItemByClass('superBomb', SuperBomb)
        superBomb.init()
        
        // 设置特殊道具
        databus.setSpecialItem(superBomb)
        
        // 重新开始游戏
        this.restart()
      },
      // 失败回调
      (reason) => {
        console.log('特殊道具获取失败:', reason)
        // 可以显示提示信息
      }
    )
  }
  
  /**
   * 使用特殊道具
   */
  useSpecialItem() {
    if (!databus.specialItem) {
      return
    }
    
    // 使用特殊道具
    const result = databus.useSpecialItem()
    
    if (result) {
      // 播放特效
      this.music.playExplosion()
      
      // 可以添加更多特效
    }
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    this.bg.render(ctx)

    // 绘制道具
    databus.powerItems.forEach((item) => {
      item.drawToCanvas(ctx)
    })

    databus.bullets
      .concat(databus.enemys)
      .forEach((item) => {
        item.drawToCanvas(ctx)
      })

    this.player.drawToCanvas(ctx)

    databus.animations.forEach((ani) => {
      if (ani.isPlaying) {
        ani.aniRender(ctx)
      }
    })

    // 绘制特殊道具（如果有）
    if (databus.specialItem) {
      databus.specialItem.drawToCanvas(ctx)
    }

    // 传入广告奖励状态
    this.gameinfo.renderGameScore(ctx, databus.score, databus.highScore, databus.adRewardActive)

    // 游戏结束停止帧循环
    if (databus.gameOver) {
      // 传入广告配置和管理器
      this.gameinfo.renderGameOver(ctx, databus.score, databus.highScore, Config.ads, this.adManager)

      if (!this.hasEventBind) {
        this.hasEventBind = true
        this.touchHandler = this.touchEventHandler.bind(this)
        canvas.addEventListener('touchstart', this.touchHandler)
      }
    } else if (databus.specialItem) {
      // 如果有特殊道具，绘制使用按钮
      this.gameinfo.renderSpecialItemButton(ctx)
    }
  }

  // 游戏逻辑更新主函数
  update() {
    if (databus.gameOver)
      return;

    this.bg.update()

    // 更新广告管理器状态
    this.adManager.update()

    // 更新道具位置
    databus.powerItems.forEach((item) => {
      item.update()
    })

    // 移除屏幕外的道具
    databus.powerItems = databus.powerItems.filter((item) => item.visible)

    databus.bullets
      .concat(databus.enemys)
      .forEach((item) => {
        item.update()
      })

    // 更新玩家道具状态
    this.player.updatePowerStatus()
    
    // 更新特殊道具状态
    if (databus.specialItem) {
      databus.specialItem.update()
    }

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
}
