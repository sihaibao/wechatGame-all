/**
 * 游戏配置文件
 * 集中管理游戏的各种配置项
 */

export default {
  // 广告相关配置
  ads: {
    enabled: true,  // 广告功能总开关
    // 复活广告配置
    revive: {
      enabled: true,  // 复活广告开关
      maxRevivesPerGame: 1  // 每局游戏最多复活次数
    },
    // 双倍得分广告配置
    doubleScore: {
      enabled: true,  // 双倍得分广告开关
      duration: 30 * 60  // 双倍得分持续时间（帧数，30帧/秒，所以30*60=30秒）
    },
    // 特殊道具广告配置
    specialItem: {
      enabled: true,  // 特殊道具广告开关
      cooldown: 3 * 60 * 60  // 特殊道具冷却时间（帧数，3分钟）
    }
  },
  
  // 广告组件ID配置
  adUnitIds: {
    videoAd: 'adunit-xxxxxxxxxxxxxxxx',  // 视频广告ID，需要替换为实际的广告ID
    bannerAd: 'adunit-yyyyyyyyyyyyyyyy'  // banner广告ID，需要替换为实际的广告ID
  }
}
