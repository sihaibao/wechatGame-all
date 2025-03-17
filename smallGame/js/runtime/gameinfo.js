const screenWidth  = window.innerWidth
const screenHeight = window.innerHeight

let atlas = new Image()
atlas.src = 'images/Common.png'

export default class GameInfo {
  renderGameScore(ctx, score, highScore) {
    ctx.fillStyle = "#ffffff"
    ctx.font = "16px Arial"
    
    // 在右上角显示当前分数和最高分，更加紧凑
    ctx.textAlign = "right"
    ctx.fillText(
      '分数: ' + score,
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

  renderGameOver(ctx, score, highScore) {
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
}
