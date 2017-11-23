var createMain = {
  canva: null,                          // 画布
  stage: null,                          // 舞台
  queue: new createjs.LoadQueue(),      // 负载管理器
  touchX: 0,                            // 触摸点 X
  touchY: 0,                            // 触摸点 Y
  canSlide: true,                       // 是否可滑动的开关
  currentIndex: 1,                      // 当前页索引
  loadPage: null,                       // 资源加载页面
  currentPage: null,                    // 当前页面
  anotherPage: null,                    // 另一个页面
  soundPlay: null,                      // 音乐播放元素
  baseConfig: config,                   // 基本配置信息
  pageContainer: pageObj,               // 页面信息
  loadPngList: loadPngList,             // 加载资源列表
  loadMediaList: loadMediaList,         // 加载资源列表
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
    _this.queue.loadManifest(this.loadPngList);
    // 音频插件注册和资源加载
    _this.queue.installPlugin(createjs.Sound);
    _this.loadMediaList.forEach(function (item, index) {
      _this.queue.loadFile(item);
    });
    // 监听资源加载
    _this.queue.on("fileload", _this.handleFileLoad, _this);
    _this.queue.on("complete", _this.handleComplete, _this);
    // 监听手势变化
    _this.stage.addEventListener("mousedown", function (e) { _this.touchDown(e, _this) });
    _this.stage.addEventListener("pressup",  function (e) { _this.touchMove(e, _this) });
    // Ticker 轮询器
    createjs.Ticker.setFPS(_this.baseConfig.FTPtimer);
    createjs.Ticker.addEventListener("tick", _this.stage);
    // 初始化load页
    _this.loadPage = _this.pageContainer.loadPage(_this.queue);
    _this.stage.addChild(_this.loadPage);
    // 更新画布信息
    _this.stage.update();
  },
  /**
   * 音乐播放的控制
   * @param Music
   */
  SoundCtrl: function (Music) {
    // 音乐播放的图标
    var Icon = pageElement.musicIcon(this.queue);
    var _this = this;
    Music.on("paused", handPaused);
    Music.setPaused(true);
    function handPaused (e) {
      Music.paused = !Music.paused;
    }
    Icon.addEventListener("click", function (e) {
      handPaused();
    });
    handPaused();
    this.currentPage.addChild(Icon);
  },
  /**
   * 加载文件时候的回调
   * @param e
   */
  handleFileLoad: function (e) {
    var cTarget = e.currentTarget;
    console.log(cTarget._numItems);
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
    this.soundPlay = createjs.Sound;
    var Music = this.soundPlay.play("bg_music", {interrupt: createjs.Sound.INTERRUPT_NONE, loop: -1, volume: 1});
    // 清除load页
    this.stage.removeChild(this.loadPage);
    this.currentPage = this.initPage(this.currentIndex)(this.queue);
    this.SoundCtrl(Music);
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
        _this.flipPage("prev", _this.baseConfig.duratieType);
      }
    } else {
      if (!isLast) {
        _this.flipPage("next", _this.baseConfig.duratieType);
      }
    }
  },
  /**
   * 翻页
   * @param 类型（0-上一页/1-下一页）
   * @param 方式（下滑/渐隐或其他方式）
   * @constructor
   */
  flipPage: function (type, method) {
    // 判断 prev -or- next
    var isPrev = type === "prev";
    var another = isPrev ? (this.currentIndex - 1) : (this.currentIndex + 1);
    this.currentIndex = another;
    // 初始化当前页和另外一页
    this.anotherPage = this.initPage(another)(this.queue);
    // 添加两个页面 同时要保证当前页在顶层
    this.stage.removeChild(this.currentPage);
    this.stage.addChild(this.currentPage);
    this.stage.addChild(this.anotherPage);
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
  },
  /**
   * 页面过度类型-上下滑动
   * @param type
   */
  pageSwitchingSilder: function (type) {
    var isNext = type == "next";
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
    createjs.Tween
        .get(_this.currentPage)
        .to({alpha: 0}, _this.baseConfig.duration)
        .call(function () {
          _this.stage.removeChild(this.currentPage);
        });
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