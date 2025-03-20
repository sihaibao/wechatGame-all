/**
 * 游戏配置文件
 * 集中管理游戏的各种配置项
 */

export default {
  // 广告相关配置
  ads: {
    enabled: false,  // 广告功能总开关
    // 复活广告配置
    revive: {
      enabled: false,  // 复活广告开关
      maxRevivesPerGame: 1  // 每局游戏最多复活次数
    },
    // 双倍得分广告配置
    doubleScore: {
      enabled: false,  // 双倍得分广告开关
      duration: 30 * 60  // 双倍得分持续时间（帧数，30帧/秒，所以30*60=30秒）
    },
    // 特殊道具广告配置
    specialItem: {
      enabled: false,  // 特殊道具广告开关
      cooldown: 3 * 60 * 60  // 特殊道具冷却时间（帧数，3分钟）
    }
  },
  
  // 广告组件ID配置
  adUnitIds: {
    videoAd: 'adunit-xxxxxxxxxxxxxxxx',  // 视频广告ID，需要替换为实际的广告ID
    bannerAd: 'adunit-yyyyyyyyyyyyyyyy'  // banner广告ID，需要替换为实际的广告ID
  },
  
  // 成就系统配置
  achievements: {
    enabled: true,  // 成就系统开关
    showNotifications: true,  // 是否显示成就解锁通知
    notificationDuration: 2000  // 通知显示时间（毫秒）
  },
  
  // 关卡配置
  levels: {
    enabled: true,  // 关卡系统开关
    showLevelUpNotification: true,  // 是否显示关卡提升通知
    data: [
      {
        id: 1,
        name: "初级",
        enemySpeed: 6,
        enemySpawnRate: 30,  // 每30帧生成一个敌人
        powerItemSpawnRate: 300,  // 每300帧生成一个道具
        scoreToNextLevel: 100  // 达到100分进入下一关
      },
      {
        id: 2,
        name: "中级",
        enemySpeed: 8,
        enemySpawnRate: 25,  // 更快的敌人生成
        powerItemSpawnRate: 250,  // 更快的道具生成
        scoreToNextLevel: 300
      },
      {
        id: 3,
        name: "高级",
        enemySpeed: 10,
        enemySpawnRate: 20,
        powerItemSpawnRate: 200,
        scoreToNextLevel: 600
      },
      {
        id: 4,
        name: "专家",
        enemySpeed: 12,
        enemySpawnRate: 15,
        powerItemSpawnRate: 180,
        scoreToNextLevel: 1000
      },
      {
        id: 5,
        name: "大师",
        enemySpeed: 15,
        enemySpawnRate: 10,
        powerItemSpawnRate: 150,
        scoreToNextLevel: null  // 最终关卡
      }
    ]
  }
}
