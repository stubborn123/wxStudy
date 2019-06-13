// pages/goods/details/details.js
var util = require("../../../utils/util.js");
var resubmit = require("../../../utils/resubmit.js");
var constants = require("../../../utils/constants.js");
var app = getApp();
var Point = function (x, y) {
  return { x: x, y: y };
};
var Rect = function (x, y, width, height) {
  return { x: x, y: y, width: width, height: height };
};
var px2rpx = 1;
Page({
  data: {
    id:'0',
    price:0.01,
    swiperAutoplay:true,
    showModalWin:false,
    priceType:{
      dayType: 0,
      weekType: 1,
      twoWeekType:2
    },
    selectPriceType:1,
    goodStatusWaitingHire: 1,//商品等待出租的状态  
    goodStatusHadSaled: 5,//商品已经卖出了
    tips:[
      '11111113',
      '22222222',
      '3333333333'
    ],
    goods:null,
    goodsShareImgUrl:null,
    showShareWin:false,
    shareWinAnimationData:null,
    showList: [],
    //试用期相关
    hideTryManualWin: true,
    trySendDay:'',
    tryRecieveDay:'',
    tryDay:'',
    tryDurationDay:'',
    tryEndDay:'',

    //视频相关
    hiddenVideo:true,
    videoUrl:'',

    //未付款订单
    unpayOrder: null,
    unpayOrderLeftTime: 0,

    //授权相关
    hidenIdentyButton: false,

    supportTypes: {
      ONLY_RENT: 0,
      ONLY_SALE: 1,
      BOTH_RENT_AND_SALE: 2
    },
    // 用户浏览记录
    avatars:[ ],
    totalNum:0,
    showGetPhone:false,
    //加密获取seesionkey的code
    jscode:"",
    bindPhoneSuccess:false,
    hadBingPhone:false,

    //画图相关
    hasDraw:false,
    hiddenCanvas:true,
    isDrawing:false,
    shareBgUrl:'/images/share-goods-bg.png',
    qrImgUrl:'',
    localQRImgPath:'',
    localGoodsImgPath:'',
    canvasTempFilePath:'',
    reserveshow:true,
    realGoodFlag:null,//true 展开正品保障  false关闭
    detailFlag:true,
    shopCartTotal:null,
    applyUserAuthSuccessCallback:null,
    activity:null,
    afterSaleTips:"商品签收后3日内可退货。如需退货，签收后 24小时内请XXXXXX",
    hiddenContact:true,
    nvabarData: {
      title: '商品详情', //导航栏 中间的标题
      shareFlag:false, //判断是否分享
    },
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var _this = this;
    this._getWidthRate();
    if (options.hasOwnProperty('id')){
       this.setData({
         id: options.id
       })
    }
    if (options.hasOwnProperty('shareFlag')) {
      this.data.nvabarData.shareFlag = true;
      this.setData({
        nvabarData:this.data.nvabarData
      })
    }
    var scene = options.scene;
    scene = decodeURIComponent(scene);
    if(scene){
      var array = scene.split('&');
      var params = {};
      for(var i=0; i<array.length; i++){
        var param = array[i].split('=');
        if (param.length == 2){
          params[param[0]] = param[1];
        }
      }
      if (params.hasOwnProperty('id')){
        this.setData({
          id: params.id,
          params:params
        })
      }
    }
    _this.fullScreenModel = _this.selectComponent("#fulScreenModel");
    _this.getGoodsDetail();
    _this.getGoodsSampleImgs();
    _this.getRecord();
    _this.checkIdenty();
    _this.getUserInfo();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    var _this = this;
  },

 
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var _this = this;
    _this.shoppingCartTotal();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    var _this = this;
    var imageUrl ='';
    if (_this.data.goods.videoImg && _this.data.goods.videoImg != ''){
      imageUrl = _this.data.goods.videoImg;
    } else {
      imageUrl = _this.data.goods.goodsImgList[0].imgUrl
    }
    if(_this.data.goods.supportType == _this.data.supportTypes.ONLY_SALE){
      return {
        title: _this.data.goods.secondHandPriceStr + "元 - " + _this.data.goods.goodsName,
        path: '/pages/goods/details/details?id=' + _this.data.id +"&shareFlag=" +true,
        imageUrl: imageUrl
      }
    }else{
      return {
        title: "仅需 " + _this.data.goods.dayPriceStr + "/天 试用 " + _this.data.goods.goodsName,
        path: '/pages/goods/details/details?id=' + _this.data.id + "&shareFlag=" + true,
        imageUrl: imageUrl
      }
    }
    
  },

  /**
   * 获取设 实际宽度 / 计宽度750 比
   */
  _getWidthRate:function(){
    wx.getSystemInfo({
      success(res) {
        px2rpx = (res.windowWidth / 750).toFixed(2);
      }
    })
  },

  /**
   * 确认租赁订单
   */
  _doGoToCheckOrder:function(){
    var _this = this;
    wx.navigateTo({
      url: '/pages/myOrder/confirmHire?goodsId=' + _this.data.id + "&rentType=" + _this.data.selectPriceType
    })
  },

  /**
   * 确认租赁订单
   */
  goToCheckOrder:function (e) {
    var _this = this;
    app.wxRequest("saveFormId", { formId: e.detail.formId });
    _this.showApplyAuthDialog(function(){
      _this._doGoToCheckOrder();
    });
  },

/**
 * 确认购买订单
 */
  goToPurchase:function(e){
    var _this = this;
    app.wxRequest("saveFormId", { formId: e.detail.formId });
    wx.navigateTo({
      url: '/pages/myOrder/confirmPurchase?goodsId=' + _this.data.id
    })
  },

  /**
   * 选择租用类型
   */
  chooseRentType:function(e){
    var _this = this;
    var index = e.currentTarget.dataset.index;
    _this.setData({
      selectPriceType:index
    })
  },

  /**
   * 阻止点击时间冒泡
   */
  stopDefaultEvent:function(e){
  },
  /**
   * 关闭视频
   */
  hideVideo:function(){
    var _this = this;
    _this.setData({
      hiddenVideo: true
    });
    _this.videoContext.stop();
  },

  /**
   * 显示视频
   */
  showVideo:function(){
    var _this = this;
    if (_this.data.goods.videoImg && _this.data.goods.videoUrl){
      if (!_this.videoContext) {
        _this.setData({
          videoUrl: _this.data.goods.videoUrl,
          hiddenVideo: false
        });
        _this.videoContext = wx.createVideoContext('goodsVideo');
      } else {
        _this.setData({
          hiddenVideo: false
        });
        _this.videoContext.play();
      }
    }
  },

  /**
   * 预览商品图片
   */
  showSwiperImgPreview:function(e){
    var _this =this;
    var index = e.currentTarget.dataset.index;
    var previewImages = [];
    if (index == 0 && _this.data.goods.videoImg && _this.data.goods.videoUrl ) {
      _this.showVideo();
    } else {
      if (_this.data.goods.videoImg && _this.data.goods.videoUrl){
        index = index - 1;
      }
      for (var i = 0; i < _this.data.goods.goodsImgList.length; i++) {
        previewImages.push(_this.data.goods.goodsImgList[i].imgUrl);
      }
      wx.previewImage({
        urls: previewImages,
        current: previewImages[index]
      })
    }
  } ,


  /**
   * 展示分享窗口
   */
  showShareWin:function(){
    var _this = this;
    _this.setData({
      showShareWin:true,
    });
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: 'linear',
    });
    animation.bottom(0).step();
    _this.setData({
      shareWinAnimationData: animation.export()
    });
  },

  /**
   * 关闭分享窗口
   */
  hiddenShareWin:function(){
    var _this = this;
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: 'linear',
    });
    animation.bottom("-242rpx").step();
    _this.setData({
      shareWinAnimationData: animation.export()
    });
    setTimeout(function(){
      _this.setData({
        showShareWin: false
      });
    },200)
  },

  /**
   * 获取带小程序二维码及商品详情的分享图片，并预览
   */
  shareGoods:function(){
    var _this = this;
    if (_this.data.goodsShareImgUrl){
      wx.previewImage({
        urls:[_this.data.goodsShareImgUrl]
      })
    }else{
      app.wxRequest("getGoodsShareImgUrl", { goodsId: _this.data.id }, function (res) {
        var data = res.data;
        if (data.success) {
          var url = data.data.url;
          _this.setData({
            goodsShareImgUrl: url,
          })
          wx.previewImage({
            urls: [url],
            current: url
          })
        } else {
          console.log("get share image error");
        }
      });
    }
  },
  
  /**
   * 获取同款上身
   */
  getGoodsSampleImgs:function(){
    var _this = this;
    app.wxRequest("getGoodsSampleImgs", { goodsId: _this.data.id }, function (res) {
      var data = res.data;
      if (data.success) {
        _this.setData({
          showList:data.data
        })
      }else{
        console.log("getGoodsSampleImgs error");
      }
    })
  },

  /**
   * 获取商品详情
   */
  getGoodsDetail:function(){
    var _this = this;
    app.wxRequest("getGoodsDetail", { goodsId: _this.data.id,record:true,type:1 }, function (res) {
      var data = res.data;
      if (data.success) {
        var detail = data.data.goods;
        var activity = null;
        var discount = 10;
        if (data.data.activity){
          activity = data.data.activity
          activity.minPriceStr = ((detail.secondHandPrice - activity.ruleInfo.maxBargainAmount) / 100).toFixed(2)
        }
        if (!isNaN(detail.dayPrice)) {
          detail.dayPriceStr = detail.dayPrice / 100;
        }

        if (detail.videoImg && detail.videoImg.length > 0 && detail.videoUrl && detail.videoUrl.length > 0){
          detail.goodsImgList.splice(0, 0, {imgUrl:detail.videoImg});
        }
        if (!isNaN(detail.counterPrice) && !isNaN(detail.secondHandPrice)) {
          discount = (detail.secondHandPrice / detail.counterPrice * 10).toFixed(1);
        }
        if (!isNaN(detail.secondHandPrice)){
          detail.secondHandPriceStr = (detail.secondHandPrice/100).toFixed(0);
        }
        if (!isNaN(detail.counterPrice)) {
          detail.counterPriceStr = (detail.counterPrice / 100).toFixed(0);
        }
        _this.setData({
          id: detail.id,
          goods: detail,
          discount: discount,
          activity: activity
        });
        //商品信息处理
        _this.handleGoodsDetail(_this.data.goods);
        // 检查是否是同一个未付款的订单商品
        _this.getUnpayOrder();
        _this.getUnpayPurchaseOrder();
      } else {
        console.log("no goods");
      }
    }); 
  },

  /**
   * 预览同款上身的图片
   */
  previewShowImg:function(e){
    var _this = this;
    var index = e.currentTarget.dataset.index;
    var urls = [];
    for (var i = 0; i < _this.data.showList.length; i++){
      urls[i] = _this.data.showList[i].imgUrl;
    }
    wx.previewImage({
      urls: urls,
      current:urls[index]
    })
  },

  /**
   * 关闭试用期窗口
   */
  closeTryManual:function(){
    var _this = this;
    _this.setData({
      hideTryManualWin:true
    })
  },

  /**
   * 设置试用时间，并显示试用窗口
   */
  showTryManual:function(){
    var _this = this;
    var trySendDay = '';
    var tryRecieveDay = '';
    var tryDay = '';
    var tryDurationDay = '';
    var tryEndDay = '';
    var now = new Date();
    var moth = now.getMonth() + 1;
    var day = now.getDate();
    var hour = now.getHours();

    trySendDay = moth + '月' + day + '日';
    if (hour >= 17){
      var tmpDate = new Date();
      tmpDate.setDate(tmpDate.getDate()+3);
      tryRecieveDay = (tmpDate.getMonth()+1) + '月' + (tmpDate.getDate()) + '日';
      tmpDate.setDate(tmpDate.getDate() + 1);
      tryDay = (tmpDate.getMonth() + 1) + '月' + (tmpDate.getDate()) + '日';
    } else {
      var tmpDate = new Date();
      tmpDate.setDate(tmpDate.getDate() + 2);
      tryRecieveDay = (tmpDate.getMonth() + 1) + '月' + (tmpDate.getDate()) + '日';
      tmpDate.setDate(tmpDate.getDate() + 1);
      tryDay = (tmpDate.getMonth() + 1) + '月' + (tmpDate.getDate()) + '日';
    }

    if (_this.data.selectPriceType == _this.data.priceType.weekType){
      var tmpDate = new Date();
      tryDurationDay = 7 + '天后';
      if (hour >= 17) {
        tmpDate.setDate(tmpDate.getDate() + 11);
        tryEndDay = (tmpDate.getMonth() + 1) + '月' + (tmpDate.getDate()) + '日';
      } else {
        tmpDate.setDate(tmpDate.getDate() + 10);
        tryEndDay = (tmpDate.getMonth() + 1) + '月' + (tmpDate.getDate()) + '日';
      }
    } else if (_this.data.selectPriceType == _this.data.priceType.twoWeekType){
      var tmpDate = new Date();
      tryDurationDay = 15 + '天后';
      if (hour >= 17) {
        tmpDate.setDate(tmpDate.getDate() + 19);
        tryEndDay = (tmpDate.getMonth() + 1) + '月' + (tmpDate.getDate()) + '日';
      } else {
        tmpDate.setDate(tmpDate.getDate() + 18);
        tryEndDay = (tmpDate.getMonth() + 1) + '月' + (tmpDate.getDate()) + '日';
      }
    }

    _this.setData({
      trySendDay: trySendDay,
      tryRecieveDay: tryRecieveDay,
      tryDay: tryDay,
      tryDurationDay: tryDurationDay,
      tryEndDay: tryEndDay,
      hideTryManualWin: false
    })
  },


  bindGetUserInfo: function (e) {
    var _this = this;
    app.applyUserAuthSuccessCallback(e, function () {
      _this.hideApplyAuthDialog();
      if (typeof _this.data.applyUserAuthSuccessCallback === "function"){
        _this.data.applyUserAuthSuccessCallback();
      }
    });
  },

  hideApplyAuthDialog: function () {
    this.fullScreenModel.hideDialog();
  },
  showApplyAuthDialog: function (successCallback) {
    var _this = this;
    app.checkUserAuth(function (res) {
      if (res != true) {
        _this.data.applyUserAuthSuccessCallback = successCallback;
        _this.fullScreenModel.showDialog();
      } else {
        if (typeof successCallback === "function"){
          successCallback();
        }
      }
    });
  },

  /**
   * 查看是否有订单
   */
  getUnpayOrder: function () {
    var _this = this;
    var order = app.getUnpayHireOrderStorage(false);
    if (order && order != null) {
      if (order.goodsId == _this.data.id) {
        order.bindTap = "goToOrderDetail";
        order.leftTime = 15 * 60 * 1000;
        _this.setData({
          unpayOrder: order
        })
        _this.updateLeftTime();
      }
    }
  },

  /**
   * 查看是否有未付款的购买订单
   */
  getUnpayPurchaseOrder: function () {
    var _this = this;
    var orders = app.getUnpayPurchaseOrderStorage();
    if (orders != null) {
      for (var i = 0; i < orders.length; i++){
        if (orders[i].goodsId == _this.data.id) {
          orders[i].bindTap = "goToPurchaseOrderDetail";
          orders[i].leftTime = 5 * 60 * 1000;
          _this.setData({
            unpayOrder: orders[i]
          })
          _this.updateLeftTime();
        }
      }
    }
  },

  /**
   * 订单失效倒计时
   */
  updateLeftTime: function () {
    var _this = this;
    var _interval = setInterval(function () {
      var nowTime = new Date().getTime();
      var leftTime = nowTime - _this.data.unpayOrder.timestamp;
      leftTime = leftTime < _this.data.unpayOrder.leftTime ? _this.data.unpayOrder.leftTime - leftTime : 0;
      var unpayOrderLeftTime = util.MsFormatToMMSS(leftTime);
      _this.setData({
        unpayOrderLeftTime: unpayOrderLeftTime
      });
      if (leftTime == 0) {
        clearInterval(_interval);
        _this.setData({
          unpayOrder: null
        })
      }
    }, 500)
  },

  /**
   * 跳转到订单详情页
   */
  goToOrderDetail: function (e) {
    var _this = this;
    var orderNo = e.currentTarget.dataset.orderNo;
    var _hit = resubmit.resubmit(500, _this, 'BTN_GO_TO_ORDER_DETAIL');
    if (_hit) {
      wx.navigateTo({
        url: '/pages/myOrder/myHireDetails?orderNo=' + orderNo
      })
    }
  },

  /**
   * 跳转到订单详情页
   */
  goToPurchaseOrderDetail: function (e) {
    var _this = this;
    var orderNo = e.currentTarget.dataset.orderNo;
    var _hit = resubmit.resubmit(500, _this, 'BTN_GO_TO_PURCHASE_ORDER_DETAIL');
    if (_hit) {
      wx.navigateTo({
        url: '/pages/myOrder/myPurchaseDetails?orderNo=' + orderNo
      })
    }
  },



  /**
 * 跳转到指导用户去支付宝免押认证
 */
  goToIdenty: function () {
    var _this=this 
    var identy_hit = resubmit.resubmit(500, _this, 'BTN_GO_TO_IDENTY');
    if (identy_hit){
      wx.navigateTo({
        url: '/pages/activity/h5page?id=' + 20
      })
    }
  },

  /**
   * 查看用户是否已经认证
   */
  checkIdenty: function () {
    var _this = this;
    if (app.globalData.userInfo) {
      /**
       * 0是未认证，1认证中，2认证失败，3认证成功
       */
      if (app.globalData.userInfo.certificated == 3) {
        if (app.globalData.userInfo.available == 1) {
          _this.setData({
            hidenIdentyButton: true
          })
        } 

      } 
    } else {
      app.userInfoReadyCallback = res => {
        if (app.globalData.userInfo.certificated == 3) {
          if (app.globalData.userInfo.available == 1) {
            _this.setData({
              hidenIdentyButton: true
            })
          }
        } 
      }
    }
  },

  getRecord : function(){
    var _this = this
    app.wxRequest("userRecord" ,{goodsId:_this.data.id} ,function(res){
      var data = res.data
      if (data.success === true){
        if(data.data.list.length != 0){
          var _avatars = new Array();
          for (var j = 0; j < data.data.list.length; j++) {
            if (data.data.list[j].hasOwnProperty("targetCover")) {
              _avatars.push(data.data.list[j].targetCover + "?x-oss-process=style/avatarStyle")
            }
            if (_avatars.length >= 4) {
              break
            }
          }

          _this.setData({
            totalNum: data.data.total,
            avatars: _avatars
          })
        }
      }
    })
  },
  /**
   * 用户浏览记录
   */
  userRecord: function(){
    var _this = this
    var identy_hit = resubmit.resubmit(500, _this, 'BTN_GO_TO_RECORD');
    if (identy_hit) {
      wx.navigateTo({
        url: '/pages/goods/details/record?goodsId='+_this.data.id,
      })
    }
  } ,
  /**
   * 预约询问是否授权手机号
   */
  reserveGetPhone: function(e){
    var _this = this
    app.wxRequest("saveFormId", { formId: e.detail.formId });
    _this.setData({
      reserveshow: false
    })
   if(_this.data.userInfo.reserveFlag == 0){
     _this.data.userInfo.reserveFlag = 1;
     wx.setStorageSync(constants.Constants.USER_INFO, _this.data.userInfo)
   }
    if (_this.data.userInfo.bindPhone){
      _this.hadBindPhone()
    }else{
      wx.login({
        success: function (res) {
          var code = res.code
          _this.setData({
            showGetPhone: true,
            hadBingPhone: false,
            jscode: code
          })
        },
        fail: function (res) {
          wx.showModal({
            title: '提示',
            content: '微信登录失败，重试请点击确定',
            success: function (res) {
              if (res.confirm) {
                _this._wxLogin(callback);
              }
            }
          });
        }
      })
    }
    
  }, 

  getPhoneNumber: function(e){
    var _this = this
    if (e.detail.errMsg == "getPhoneNumber:ok"){
  
      app.wxRequest("getUserPhone", { code: _this.data.jscode, encryptedData: e.detail.encryptedData, iv: e.detail.iv,                          goodsId:_this.data.goods.id}, 
        function (res) { 
          console.log("====success====") 
          console.log(res.data.data)

          if (res.data.success){
            _this.setData({
              showGetPhone: false
            })
            _this.hadBindPhone()
          }
          
      })
    }
  },

  hadBindPhone:function(){
    var _this = this
    _this.setData({
      bindPhoneSuccess:true,
      showGetPhone:false
    })
  },
  closeBindModal:function(){
    var _this = this
    _this.setData({
      bindPhoneSuccess: false,
      showGetPhone:false
    })
  },
  /**
   * 获取用户姓名头像
   */
  getUserInfo: function () {
    var _this = this;
    if (app.globalData.userInfo) {

      _this.setData({
        userInfo: app.globalData.userInfo
      })
      if (_this.data.userInfo.reserveFlag == 1){
        _this.setData({
          reserveshow:false
        })
      }
    } else {
      _this.callBackForUserInfo()
    }
  },
  /**
   * 关于userInforeadyCallback 多次定义覆盖的问题
   */
  callBackForUserInfo: function () {
    var _this = this
    app.userInfoReadyCallback = res => {
      _this.setData({
        userInfo: app.globalData.userInfo
      })
   
      if (app.globalData.userInfo.reserveFlag == 1) {
        _this.setData({
          reserveshow: false
        })
      }
    }
  },

/**
 * 展示画布
 */
  showCanvas:function(){
    var _this = this;
    wx.showLoading({
      title: '正在生成中...',
    })
    _this.setData({
      hiddenCanvas:false
    });
  },

/**
 * 隐藏画布
 */
  hideCanvas: function () {
    var _this = this;
    wx.hideLoading();
    _this.setData({
      hiddenCanvas: true
    });
  },


  /**
   * 画分享图
   */
  drawPic: function () {
    var _this = this;
    _this.hiddenShareWin();
    _this.showCanvas();
    if(_this.data.hasDraw === true){
      wx.hideLoading();
      return;
    }
    
    //获取二维码
    _this.getShareGoodsQRImgUrl();

    //商品图片
    var goodsImg = _this.data.goods.bgImg;
    _this._doGetImageInfo(goodsImg, 'localGoodsImgPath', _this._doDrawPic);

  },

  /**
   * 画分享图
   */
  _doDrawPic: function () {
    var _this = this;
    if (_this.data.localQRImgPath == '' || _this.data.localGoodsImgPath == '' ){
      return;
    }
    if (_this.data.isDrawing === false){
      _this.data.isDrawing = true;
    } else {
      return;
    }

    const ctx = wx.createCanvasContext('canvas');
    ctx.clearRect(0, 0, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 750, 980);
    ctx.draw();

    ctx.setTextBaseline("top");
    ctx.scale(px2rpx*0.8, px2rpx*0.8);
    ctx.drawImage(_this.data.shareBgUrl, 0, 0, 750, 980);

    //页码
    ctx.setFontSize(26);
    ctx.fillStyle = "rgba(128,128,128,1)";
    ctx.fillText("1/5", 631, 573);

    //标签
    if (_this.data.goods.goodsTag){
      var label = _this.data.goods.goodsTag;
      ctx.strokeStyle = "rgb(197,60,39)";
      ctx.rect(70, 645, label.length * 20 + 20, 36);
      ctx.stroke();
      ctx.setFontSize(20);
      ctx.fillStyle = "rgba(197,60,39,1)";
      ctx.fillText(label, 80, 653);
    }

    //品牌 包名
    var bagName = _this.data.goods.goodsName;
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.setFontSize(26);
    ctx.fillText( bagName, 70, 697);

    //二手价
    var secondHandPrice = "￥" + Math.floor(_this.data.goods.secondHandPrice / 100);
    ctx.fillStyle = "rgba(51,51,51,1)";
    ctx.setFontSize(64);
    ctx.fillText(secondHandPrice, 54, 760);

    //专柜价
    var counterPrice = ""+Math.floor(_this.data.goods.counterPrice / 100);
    ctx.fillStyle = "rgba(128,128,128,1)";
    ctx.setFontSize(24);
    ctx.fillText("专柜价: ￥" + counterPrice, 290, 796);

    //删除线
    ctx.strokeStyle = "rgba(128,128,128,1)";
    ctx.setLineWidth(1);
    ctx.moveTo(290, 812);
    ctx.lineTo(410 + counterPrice.length * 13, 812);
    ctx.stroke();

    //试用价
    if (_this.data.goods.supportType != _this.data.supportTypes.ONLY_SALE){
      var tryPrice = "试用价：¥" + Math.floor(_this.data.goods.dayPrice / 100) + "/天";
      ctx.fillStyle = "rgba(241,78,78,1)";
      ctx.setFontSize(28);
      ctx.fillText(tryPrice, 70, 844);
    }
    

    //识别二维码
    var tip = "长按识别小程序码";
    ctx.fillStyle = "rgba(155,155,155,1)";
    ctx.setFontSize(16);
    ctx.fillText(tip, 542, 860);

    //商品图
    ctx.drawImage(this.data.localGoodsImgPath, 149, 92, 458, 458);

    //二维码
    ctx.drawImage(this.data.localQRImgPath, 541, 718, 130, 130);

    ctx.draw(true);
    _this.data.hasDraw = true;
    _this.data.isDrawing = false;
  },

  /**
   * 画完分享图片 回调
   */
  _drawShareGoodsCallback:function(){
    var _this = this;
    wx.hideLoading();
    wx.showModal({
      title: '提示',
      content: '点击“确定”，保存图片到手机',
      success:function(res){
        if(res.confirm === true){
          _this.applyWriteSetting();
        }
      }
    })
  },

  /**
   * 获取网络图片
   */
  _doGetImageInfo: function(url,varKey,callback){
    var _this = this ;
    if (_this.data[varKey] == ''){
      url = url.replace("http://", "https://");
      wx.getImageInfo({
        src: url,
        success: function (res) {
          _this.data[varKey] = res.path;
          if(typeof callback === "function"){
            callback();
          }
        },
        fail:function(res){
          console.log("failed url=" + url);
        }
      });
    }
  },

  /**
   * 获取分享图片二维码
   */
  getShareGoodsQRImgUrl:function(){
    var _this = this;
    if (_this.data.qrImgUrl == ''){
      app.wxRequest("getShareGoodsQRImgUrl", { goodsId: _this.data.goods.id }, function (res) {
        if (res.data.success === true) {
          _this.data.qrImgUrl = res.data.data.imgurl;
          _this._doGetImageInfo(_this.data.qrImgUrl, 'localQRImgPath', _this._doDrawPic);
        }
      });
    }
  },

  /**
   * 将画布图片写到文件
   */
  canvasToTempFilePath:function(){
    var _this = this;
    if (_this.data.canvasTempFilePath == ''){
      wx.canvasToTempFilePath({
        quality:1,
        canvasId: 'canvas',
        success:function(res) {
          _this.data.canvasTempFilePath = res.tempFilePath;
          _this.saveImageToPhotosAlbum(res.tempFilePath);
        }
      })
    }
  },

  /**
   * 将临时文件，写入相册里
   */
  saveImageToPhotosAlbum: function (filePath){
    var _this = this;
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success:function(res) { 
        
        wx.showToast({
          title: '保存成功',
        })
       },
      fail:function(res){
        wx.showModal({
          title: '提示',
          content: '保存失败',
        })
      },
    })
  },

  /**
   * 打开设置授权
   */
  openSetting:function(){
    var _this = this;
    wx.openSetting({
      success(res) {
        console.log(res.authSetting)
        if (res.authSetting["scope.writePhotosAlbum"] === true){
          _this.canvasToTempFilePath();
        }
      }
    })
  },
  

  /**
   * 申请授权
   */
  applyWriteSetting: function () {
    var _this = this;
    if (_this.data.canIUseWritePhotosAlbum === true) {
      _this.canvasToTempFilePath();
      return;
    }
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success() {
              // 用户已经同意小程序使用功能，
              _this.data.canIUseWritePhotosAlbum= true;
              _this.canvasToTempFilePath();
            },
            fail() {
              wx.showModal({
                title: '保存图片到手机',
                content: '请点击“确定”，保存图片到手机',
                success: function (res) {
                  if (res.confirm) {
                    _this.openSetting();
                  } else if (res.cancel) {
                    console.log('用户点击取消')
                  }
                }
              })
            }
          })
        } else {
          _this.canvasToTempFilePath();
        }
      }
    })
  },
  arrowRealGood:function(){
    var _this = this;
    if (_this.data.realGoodFlag){
      _this.setData({
        realGoodFlag: false
      })
    }else{
      _this.setData({
        realGoodFlag: true,
      })
    }
    },
    arrowDatail:function(){
      var _this = this;
      if (_this.data.detailFlag) {
        _this.setData({
          detailFlag: false
        })
      } else {
        _this.setData({
          detailFlag: true,
        })
      }
    },
    /**
     * 加入购物车
     */
  addShoppingcart:function(e){
    var _this = this;
    app.wxRequest("saveFormId", { formId: e.detail.formId });
    _this.showApplyAuthDialog(function () {
      _this._doAddShoppingcart();
    });
  },

  /**
   * 加入购物车
   */
  _doAddShoppingcart:function(){
    var _this = this;
    var _hit = resubmit.resubmit(1200, _this, "BTN_ADD_SHOPPING_CART_ITEM");
    if (_hit !== true) {
      return;
    }
    app.wxRequest("addShoppingCart", { goodsId: _this.data.id }, function (res) {
      if (res.data.success === true) {
        wx.showToast({
          title: '已加入购物车',
          icon: 'success',
          duration: 2000
        })
        if (res.data.data.add === true && res.data.data.update === false) {
          app.increaseShoppingCartTotalCount(1);
          _this.shoppingCartTotal();
        }
      }
    }, null, null, true);
  },

    /**
     * 获取购物车总数
     */
    shoppingCartTotal:function(){
      var _this = this
      if (app.globalData.shoppingCartBadge > 0){
        _this.setData({
          shopCartTotal: app.globalData.shoppingCartBadge
        })
      } else {
        app.shoppingCartTotalCountReadyCallback =function(){
          _this.setData({
            shopCartTotal: app.globalData.shoppingCartBadge
          })
        }
      }
    },
  toShopCart:function(){
    var _this = this;
    var _hit = resubmit.resubmit(800, _this, "BTN_JUMP");
    if (_hit !== true){
      return;
    }
    wx.switchTab({
      url: '/pages/shoppingCart/shoppingCart'
    })
  },
  backHome:function(){
    var _this = this
    var _hit = resubmit.resubmit(800, _this, "BTN_JUMP");
    if (_hit !== true) {
      return;
    }
    wx.switchTab({
      url: '/pages/hire/hire/hire',
    })
  },
/**
 * 支付宝引导
 */
freeBetGuide:function(){
  var _this = this
  var _hit = resubmit.resubmit(800, _this, "BTN_FREE_BET");
  if (_hit !== true) {
    return;
  }
  wx.navigateTo({
    url: '/pages/identify/zhifubao/freeBet',
  })
},

  /**
   * 参与砍价
   */
  takeBargain:function(e){
    var _this = this;
    var _hit = resubmit.resubmit(1500, _this, "BTN_FREE_BET");
    if (_hit !== true) {
      return;
    }
    app.wxRequest("saveFormId", { formId: e.detail.formId });
    app.wxRequest("takeBargainActivity", { maId:_this.data.activity.id},function(res){
      var data = res.data;
      if (data.success === true){
        wx.navigateTo({
          url: '/pages/bargain/detail/detail?id=' + data.data.infoId +"&showToastFlag=true",
        })
        return
      }
      wx.showModal({
        title: '提示',
        content: data.msg,
      })
    });
  },

  /**
   *商品详情处理（比如根据鉴定类型，判断鉴定机构等） 
   */
  handleGoodsDetail:function(detail){
    var _detail = detail;
    var _this = this;
    //处理鉴定来源; 处理商品来源
    var _checkType = detail.checkType;
     
    var _checkTypeStr = null
    if (_checkType === 0){
      _checkTypeStr = "c";
      detail.checkTypeStr = _checkTypeStr;
      detail.sourceTypeStr = "B"
    }else{
      _checkTypeStr = "A";
      detail.checkTypeStr = _checkTypeStr;
      detail.sourceTypeStr = "BRAND OFF"
    }
    //处理附件信息
    if (detail.attachment){
      var _attachments = detail.attachment;
      _this.handleAttachment(_attachments);
    }else{
      _this.setData({
        attachments: '无'
      })
    }
    _this.setData({
      goods:detail
    })

  },

  /**
   * 附件信息转换为数组的形式
   */
  handleAttachment: function (attachment){
    var _this = this;
    var attachments = attachment.split(",");
    var otherArr = [];
    var attachmentsDetail = [" 包装盒:无", "防尘袋：无","卡：无","说明书：无"];
    for (var i = 0; i < attachments.length ; i++ ){
      if (attachments[i] == "包装盒"){
        attachmentsDetail[0] = "包装盒：有";
      }
      else if (attachments[i] == "防尘袋") {
        attachmentsDetail[1] = "防尘袋：有";
      }
      else if (attachments[i] == "卡") {
        attachmentsDetail[2] = "卡：有";
      } else if (attachments[i] == "说明书"){
        attachmentsDetail[3] = "说明书：有";
      }
      else if (attachments[i] != ""){
        otherArr.push(attachments[i]);
        attachmentsDetail[4] = attachments[i];
      }
    }  
    attachments.concat(otherArr);
    _this.setData({
      attachments: attachmentsDetail
    })
  },

/**
 * 客服弹窗
 */
hideContactWin:function(){
  var _this = this
  if (_this.data.hiddenContact){
    _this.setData({
      hiddenContact:false
    })
  }else{
    _this.setData({
      hiddenContact: true
    })
  }
},
/**
 * 查看赔付标准
 */
gotoDamagerStandard:function(){
  wx.navigateTo({
    url: '/pages/hire/restUse/compensationStandard',
  })
},
/**
 * 跳转到brandoff
 */
gotoBrandOff:function(){
  wx.navigateTo({
    url: '/pages/hire/restUse/brandOff',
  })
},

/**
 * 返回上一页面，可以自定义
 */
backPrePage:function(){
  app.backPrePage();
}
})