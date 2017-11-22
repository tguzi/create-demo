var createMain = {
  canva: null,                          // 画布
  stage: null,                          // 舞台
  queue: new createjs.LoadQueue(),      // 负载管理器
  touchX: 0,                            // 触摸点 X
  touchY: 0,                            // 触摸点 Y
  currentIndex: 1,                      // 当前页索引
  currentPage: null,                    // 当前页面
  anotherPage: null,                    // 另一个页面
  canSlide: true,                       // 是否可滑动的开关
  baseConfig: config,                   // 基本配置信息
  pageContainer: pageObj,               // 页面信息
  loadPage: null,                       // load页
  loadFileList: loadFileList,           // 加载资源列表
  /**
   * 初始化
   * @param selector
   */
  init: function (selector) {
    // 获取画布
    this.canvas = document.querySelector(selector);
    // 初始化画布大小
    this.canvas.width = this.baseConfig.deviceWidth;
    this.canvas.height = this.baseConfig.deviceHeight;
    // 初始化画布尺寸
    this.resize(this.baseConfig.deviceWidth, this.baseConfig.deviceHeight);
    // 初始化舞台
    this.stage = new createjs.Stage(this.canvas);
    // 初始化触摸模块
    createjs.Touch.enable(this.stage);
    // 自动清除画布
    this.stage.autoClear = true;
    // 加载资源
    this.load();
  },
  /**
   * 资源加载函数
   */
  load: function () {
    var _this = this;
    this.queue.loadManifest(this.loadFileList);
    this.queue.installPlugin(createjs.Sound);
    this.queue.loadFile({id:"bg_music", src:"media/bg.mp3"});
    // 监听资源加载
    this.queue.on("fileload", this.handleFileLoad, this);
    this.queue.on("complete", this.handleComplete, this);
    // 监听手势变化
    this.stage.addEventListener("mousedown", function (e) { _this.touchDown(e, _this) });
    this.stage.addEventListener("pressup",  function (e) { _this.touchMove(e, _this) });
    // Ticker 轮询器
    createjs.Ticker.setFPS(this.baseConfig.FTPtimer);
    createjs.Ticker.addEventListener("tick", this.stage);
    // 初始化load页
    this.loadPage = this.pageContainer.loadPage(this.queue);
    this.stage.addChild(this.loadPage);
    this.initSoundIcon();
    // 更新画布信息
    this.stage.update();
  },
  /**
   * 初始化音频
   */
  initSoundIcon: function () {
  },
  /**
   * 加载文件时候的回调
   * @param e
   */
  handleFileLoad: function (e) {
    var cTarget = e.currentTarget;
    var loadding = (cTarget._numItemsLoaded / cTarget._numItems) * 100;
    var text = new createjs.Text("", "80px Arial", "#555");
    text.text = "load... " + Math.floor(loadding) + " % ";
    var bounds = text.getBounds();
    text.x = (config.deviceWidth - bounds.width) / 2;
    text.y = 1000;
    this.loadPage.addChild(text);
    this.stage.update();
  },
  /**
   * 资源加载完成时的回调
   * @param e
   */
  handleComplete: function (e) {
    createjs.Sound.play("bg_music", {interrupt: createjs.Sound.INTERRUPT_NONE, loop: -1, volume: 1});
    // 清除load页
    this.stage.removeChild(this.loadPage);
    this.currentPage = this.initPage(this.currentIndex)(this.queue);
    this.stage.addChild(this.currentPage);
  },
  /**
   * 记录屏幕触摸点
   * @param e
   * @param _this
   */
  touchDown: function (e, _this) {
    _this.touchX = e.stageX;
    _this.touchY = e.stageY;
  },
  /**
   * 触摸滑动
   * @param e
   * @param _this
   */
  touchMove: function (e, _this) {
    // 判断是否在容忍值内或是否正在过度
    var isTreshold = Math.abs(e.stageY - _this.touchY) < _this.baseConfig.threshold;
    var isDurate = !_this.canSlide;
    // 阻止滑动
    if (isTreshold || isDurate) {
      return false;
    }
    // 关闭开关，执行动画
    _this.canSlide = false;
    setTimeout(function () {
      _this.canSlide = true;
    }, _this.baseConfig.duration);
    // 判断上一页还是下一页
    var type = e.stageY - _this.touchY > 0;
    // 判断是否首页或是否末页
    var isFirst = _this.currentIndex === 1;
    var isLast = _this.currentIndex === _this.baseConfig.totalPage;
    if (type) {
      if (!isFirst) {
        _this.flipPage(_this.currentIndex, "prev", _this.baseConfig.duratieType);
      }
    } else {
      if (!isLast) {
        _this.flipPage(_this.currentIndex, "next", _this.baseConfig.duratieType);
      }
    }
  },
  /**
   * 翻页
   * @param 当前页面
   * @param 类型（0-上一页/1-下一页）
   * @param 方式（下滑/渐隐或其他方式）
   * @constructor
   */
  flipPage: function (current, type, method) {
    // 判断 prev -or- next
    var isPrev = type === "prev";
    var another = isPrev ? (current - 1) : (current + 1);
    this.currentIndex = another;
    // 初始化当前页和另外一页
    this.anotherPage = this.initPage(another)(this.queue);
    // 执行页面切换方法
    this.switchPage(type, method);
  },
  /**
   * 页面切换的类型
   * @param type
   * @param method
   */
  switchPage: function (type, method) {
    switch (method) {
      case "slider":
        this.pageSwitchingSilder(type);
        break;
      case "fade":
        this.pageSwitchingFade(type);
        break;
      default:
        this.pageSwitchingDefault(type);
    }
  },
  /**
   * 页面过渡-默认的切换类型
   * @param type
   */
  pageSwitchingDefault: function (type) {
    var isNext = type == "next";
    var deviceHeight = this.baseConfig.deviceHeight;
    var startY = isNext ? deviceHeight : (0 - deviceHeight);
    var endY = isNext ? (0 - deviceHeight) : deviceHeight;
    this.stage.removeChild(this.currentPage);
    this.stage.addChild(this.anotherPage);
  },
  /**
   * 页面过度类型-上下滑动
   * @param type
   */
  pageSwitchingSilder: function (type) {
    this.stage.addChild(this.anotherPage);
    this.stage.addChild(this.currentPage);
    var isNext = type == "next";
    console.log(12);
    var deviceHeight = this.baseConfig.deviceHeight;
    var startY = isNext ? deviceHeight : (0 - deviceHeight);
    var endY = isNext ? (0 - deviceHeight) : deviceHeight;
    var _this = this;
    this.anotherPage.y = startY;
    createjs.Tween
        .get(_this.currentPage)
        .to({y: endY}, _this.baseConfig.duration);
    createjs.Tween
        .get(_this.anotherPage)
        .to({y: 0}, _this.baseConfig.duration);
  },
  /**
   * 页面过度类型-渐隐渐现
   * @param type
   */
  pageSwitchingFade: function (type) {
    var isNext = type == "next";
    var deviceHeight = this.baseConfig.deviceHeight;
    var startY = isNext ? deviceHeight : (0 - deviceHeight);
    var endY = isNext ? (0 - deviceHeight) : deviceHeight;
    var _this = this;
    this.stage.removeChild(this.currentPage);
    this.anotherPage.alpha = 0;
    this.stage.addChild(this.currentPage);
    this.stage.addChild(this.anotherPage);
    createjs.Tween
        .get(_this.currentPage)
        .to({alpha: 0}, _this.baseConfig.duration)
        .call(function () {
          _this.stage.removeChild(this.currentPage);
        });
    createjs.Tween
        .get(_this.anotherPage)
        .to({alpha: 1}, _this.baseConfig.duration);
  },
  /**
   * 初始化页面
   * @param currentIndex
   */
  initPage: function (currentIndex) {
    var count = 0;
    for (var key in this.pageContainer) {
      if (count === currentIndex) {
        return this.pageContainer[key];
      } else {
        count++;
      }
    }
  },
  /**
   * 适应不同尺寸的设备
   * @param deviceWidht
   * @param deviceHeight
   */
  resize: function (deviceWidht, deviceHeight) {
    var stageWidth =  document.documentElement.clientWidth;
    var stageHeight = document.documentElement.clientHeight;
    var canvasStyle = this.canvas.style;
    if ((stageWidth / stageHeight) > (deviceWidht / deviceHeight)) {
      canvasStyle.width = deviceWidht * stageHeight / deviceHeight + "px";
      canvasStyle.height = stageHeight + "px";
      canvasStyle.left = (stageWidth - deviceWidht * stageHeight / deviceHeight) / 2 + "px";
      canvasStyle.top = 0 + "px";
    } else {
      canvasStyle.width = stageWidth + "px";
      canvasStyle.height = deviceHeight * stageWidth / deviceWidht + "px";
      canvasStyle.left = 0 + "px";
      canvasStyle.top = (stageHeight - deviceHeight * stageWidth / deviceWidht) / 2 + "px";
    }
  }
};