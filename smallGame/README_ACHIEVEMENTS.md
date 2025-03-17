# 游戏成就系统使用说明

## 概述

本游戏集成了一个完整的成就系统，可以跟踪玩家的游戏进度和成就。成就系统包括以下功能：

- 多种类型的成就（分数、击败敌人、收集道具等）
- 成就解锁通知
- 成就界面展示
- 隐藏成就
- 成就进度跟踪

## 配置

成就系统的配置位于 `js/config.js` 文件中的 `achievements` 部分：

```javascript
// 成就系统配置
achievements: {
  enabled: true,  // 成就系统开关
  showNotifications: true,  // 是否显示成就解锁通知
  notificationDuration: 2000  // 通知显示时间（毫秒）
}
```

## 成就类型

当前实现的成就包括：

1. **初次启航** - 完成第一局游戏
2. **小试牛刀** - 在一局游戏中得分达到100分
3. **身手不凡** - 在一局游戏中得分达到500分
4. **战斗大师** - 在一局游戏中得分达到1000分
5. **初级猎人** - 在一局游戏中击败10个敌人
6. **老练猎手** - 在一局游戏中击败50个敌人
7. **终极猎人** - 在一局游戏中击败100个敌人
8. **收集者** - 累计收集10个道具
9. **囤积者** - 累计收集50个道具
10. **千钧一发** - 在敌人即将撞击时使用炸弹逃脱（隐藏成就）

## 如何添加新成就

要添加新成就，请编辑 `js/runtime/achievement.js` 文件中的 `achievements` 数组，添加新的成就对象：

```javascript
{
  id: 'uniqueId',  // 唯一标识符
  name: '成就名称',
  description: '成就描述',
  icon: 'images/achievements/icon.png',  // 成就图标路径
  unlocked: false,  // 初始状态为未解锁
  secret: false,  // 是否为隐藏成就
  progress: 0,  // 初始进度
  target: 100,  // 目标进度
  reward: null  // 可选的奖励
}
```

## 如何触发成就

成就系统已与游戏的主要事件集成。当玩家达成特定条件时，相应的成就将自动解锁。

如需手动触发成就，可以使用以下方法：

```javascript
// 更新成就进度
databus.achievementSystem.updateAchievement('achievementId', progressValue);

// 记录特定事件
databus.recordEnemyDefeated();  // 记录击败敌人
databus.recordItemCollected(itemType);  // 记录收集道具
databus.recordNarrowEscape();  // 记录千钧一发事件
```

## 成就图标

成就图标应放置在 `images/achievements/` 目录下，并在成就定义中引用。

## 数据存储

成就系统使用微信小游戏的本地存储功能保存成就状态和统计数据：

- 成就状态保存在 `achievements` 键下
- 统计数据保存在 `achievementStats` 键下
- 最高分保存在 `highScore` 键下

## 界面交互

- 游戏结束后，点击"成就"按钮可以查看成就列表
- 在成就界面中，点击"返回"按钮可以返回游戏结束界面
- 成就解锁时会显示通知
