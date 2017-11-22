/**
 * 基础配置信息
 * @type {{deviceWidth: number, deviceHeight: number, totalPage: number, slideSpeed: number, threshold: number, musicPlay: boolean}}
 */
var config = {
  deviceWidth: 1080,      // 开发宽度
  deviceHeight: 1920,     // 开发高度
  totalPage: 2,           // 总页数
  FTPtimer: 10,           // 帧动画时间
  duration: 600,          // 过度持续时间
  threshold: 50,          // 手势变化阀值
  musicPlay: false,       // 音乐播放开关
  duratieType: "    "     // 页面过渡类型
};
// 加载的文件列表
var loadFileList = [
  {id: 'flower', src: "imgs/flower.png"},
  {id: "bg_music", src: "media/bg.mp3"},
  {id: 'bg_img', src: "imgs/bg.png"},
  {id: 'bg_day', src: "imgs/bg_day.png"}
];
/**
 * 页面信息
 * @type {{}}
 */
var pageObj = {
  loadPage: function (queue) {
    var container = new createjs.Container().set({x: 0, y: 0});
    var bg = new createjs.Bitmap(queue.getResult("bg_img"));
    container.addChild(bg);
    var data = {
      images: ["imgs/flower.png"],
      frames: {
        width: 152,
        height: 146,
        count: 16
      },
      animations: {
        run: [0, 16]
      }
    };
    var spriteSheet = new createjs.SpriteSheet(data);
    var animation = new createjs.Sprite(spriteSheet, "run");
    var option = {
      x: 411,
      y: 667,
      scaleX: 9 / 4,
      scaleY: 9 / 4
    };
    animation.set(option);
    container.addChild(animation);
    return container;
  },
  /**
   * page-1
   */
  page1: function (queue) {
    var container = new createjs.Container().set({x: 0, y: 0});
    var bg = new createjs.Bitmap(queue.getResult("bg_img"));
    container.addChild(bg);
    var shape = new createjs.Shape();
    // 绘制一个圆
    shape.graphics.beginFill("red").drawCircle(100, 100, 100);
    shape.setBounds(100, 100, 100);
    var bounds = shape.getBounds();
    var X= config.deviceWidth - bounds.width >> 1;
    var Y = config.deviceHeight - bounds.height >> 1;
    shape.x = X;
    shape.y = Y;
    // 加入到容器中
    container.addChild(shape);
    // 过度
    createjs.Tween.get(shape, {loop: true})
        .to({x: (X-100), y: (Y - 100), scaleX: 2, scaleY: 2, alpha: 0.5}, config.duration)
        .to({x: X, y: Y, scaleX: 1, scaleY: 1, alpha: 1}, config.duration);
    return container;
  },
  /**
   * page-2
   */
  page2: function (queue) {
    var container = new createjs.Container().set({x: 0, y: 0});
    // 绘制形状
    var shape = new createjs.Shape();
    shape.graphics.beginFill("#ff0000").drawRect(0, 0, 100, 100);
    shape.setBounds(0, 0, 100, 100);
    var bounds = shape.getBounds();
    var w = config.deviceWidth;
    var h = config.deviceHeight;
    container.addChild(shape);
    createjs.Ticker.on("tick", surround);
    function surround (e) {
      var leftTop = shape.x >= 0 && shape.y == 0 && shape.x < w - bounds.width;
      var rightTop = shape.x == w - bounds.width && shape.y >= 0 && shape.y < h - bounds.height;
      var rightBottom = shape.y == h - bounds.height && shape.x > 0 && shape.x <= w - bounds.width;
      var leftBottom = shape.x == 0 && shape.y > 0 && shape.y <= h - bounds.height;
      if (leftTop) {
        shape.x += 10;
      } else if (rightTop) {
        shape.y += 10;
      } else if (rightBottom) {
        shape.x -= 10;
      } else if (leftBottom) {
        shape.y -= 10;
      }
    }
    return container;
  }
};

