//app.js
var config = require("./config.js");
var MD5Util = require("./utils/md5.js");
var constants = require("./utils/constants.js");
App({
  globalData: {
    serverConfig:null,
    config: config,
    sysInfo: null,
    card: null,
    sessionKey: '',
    hasUserInfo: false,
    invited: false,
    userNotLoginCode: 5000,
    loginStatus:-1,//登录状态-1未登录，0登录中，1已登录
    loginTime:0,//登录时间，辅助确定当前登录是否失效的问题
    retryLoginTimes:2,
    hasUserAuth:false,
    localUserInfo:null,
    hideUnpayHireOrderTips:false,//关闭提示
    hideUnpayPurchaseOrderTips: false,//关闭提示
    requestQueue:[],
    shoppingCartBadge:0,
    shoppingCartChangeFlag:false,
    //自定义导航栏，获取顶部状态栏高度
    statusBarHeight: wx.getSystemInfoSync()['statusBarHeight']
  },
  onLaunch: function () { 
    this._setSysInfo();
    this.login();
  },
  /**
   * 登陆接口
   * 1.查看是否授权，若未授权则跳转到授权页面，若已授权则 跳到2
   * 2.尝试缓存登陆，若登陆失败，跳到3
   * 2.使用微信登陆，获取code和微信用户数据，根据这些数据，去后台获取包多多用户登陆注册信息
   */
  loginAfter: function (userInfo, sessionKey){
    var _this = this;
    wx.setStorageSync(constants.Constants.USER_INFO, userInfo);
    _this.globalData.loginStatus = 1;
    if (sessionKey){
      _this.globalData.sessionKey = sessionKey;
    }
    _this._setGlobalUserInfo(userInfo);
    _this.globalData.invited = userInfo.invited;
    _this.globalData.retryLoginTimes = 2;
    _this.globalData.loginTime = (new Date()).getMilliseconds();
    _this._popAllRequest();
    if (userInfo.relogin == true){
      _this._loginByCode();
    }
    _this.getShoppingCartTotalCount();
  },
  login: function (){
    var _this = this;
    var loginSuccessCallback = function (userInfo, sessionKey){    
      
    }
    var loginFailedCallback = function(successCallback){
      _this.globalData.loginStatus = -1;
      _this._loginByCode(successCallback);
    }
    if (_this.globalData.loginStatus != 0 && _this.globalData.retryLoginTimes > 0 ) {
      _this.globalData.loginStatus = 0;
      _this.globalData.retryLoginTimes = _this.globalData.retryLoginTimes - 1;
      _this._loginByCache(loginSuccessCallback, loginFailedCallback); 
    }
  },

//缓存登陆
  _loginByCache: function (successCallback,failedCallback){
    var _this = this;
    var userInfo = wx.getStorageSync("userInfo");
    if (userInfo) {
      var currentMs = new Date().getTime();
      var md5Str = MD5Util.MD5(userInfo.id +''+ currentMs + userInfo.loginToken).toUpperCase();
      var edata = { userId: userInfo.id, timeStamp: currentMs, sign: md5Str }; 

      _this.wxRequest("cacheLogin", edata, function (data) {
        var datas = data.data;
        if (datas.success) {
          var userInfo = datas.data;
          _this.loginAfter(userInfo, data.header["Set-Cookie"]);
          if (typeof successCallback === "function" ){
            successCallback(userInfo, data.header["Set-Cookie"]);
          }          
        } else {
          if (typeof failedCallback === "function") {
            failedCallback(successCallback);
          } 
        }
      },function(e){
        _this.globalData.loginStatus = -1;
      });
    } else {
      if (typeof failedCallback === "function") {
        failedCallback(successCallback);
      }
    }
  }, 

  //微信code登陆
  _loginByCode: function (successCallback) {
    var _this = this;
    this._wxLogin(function (wxres) {
      var code = wxres.code;
      //TODO
      wx.removeStorageSync(constants.Constants.WX_CODE);
      wx.setStorage({
        key: constants.Constants.WX_CODE,
        data: code
      })
      _this.getUserInfo(code, '', successCallback);
    });       
  },

  //微信登陆
  _wxLogin: function (callback) {
    var _this = this;
    wx.login({
      success: function (res) {
        if (typeof callback === "function") {
          callback(res);
        }
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
  },

  /*
  * 从服务器上获取用户信息，即登录
  */
  getUserInfo: function (code, userInfo, successCallback){
    var _this = this;
    _this.wxRequest("getUserInfo", { code: code, wxUserInfo: userInfo}, function (data) {
      var datas = data.data;
      if (datas.success) {
        var userInfo = datas.data; 
        _this.loginAfter(userInfo, data.header["Set-Cookie"]);
        if (typeof successCallback === "function") {
          successCallback(userInfo, data.header["Set-Cookie"]);
        }
      } else {
        wx.showModal({
          title: '提示',
          content: '登录失败，重试请点击确定',
          success: function (res) {
            if (res.confirm) {
              _this._loginByCode(successCallback);
            }
          }
        });
      }
    }, function (e) {
      _this.globalData.loginStatus = -1;
    });
  },
  refreshUserInfo: function (successCallback){
    var _this = this;
    _this.wxRequest("refreshUserInfo", { }, function (data) {
      var datas = data.data;
      if (datas.success) {
        var userInfo = datas.data.userInfo;
        _this._setGlobalUserInfo(userInfo);
        if (typeof successCallback === "function") {
          successCallback();
        }
      } else {
        wx.showModal({
          title: '提示',
          content: '登录失败，重试请点击确定',
          success: function (res) {
            if (res.confirm) {
              _this._loginByCode(successCallback);
            }
          }
        });
      }
    });
  },

  /**
   * 更新用户信息
   */
  updateUserInfo: function (code, userInfo, iv, encryptedData, successCallback) {
    var _this = this;
    _this.wxRequest("updateUserInfo", { code: code, wxUserInfo: userInfo, iv: iv, encryptedData: encryptedData }, function (data) {
      var datas = data.data;
      if (datas.success) {
        var userInfo = datas.data;
        _this._setGlobalUserInfo(userInfo);
        if (typeof successCallback === "function") {
          successCallback(userInfo, data.header["Set-Cookie"]);
        }
      } else {
        wx.showModal({
          title: '提示',
          content: '更新失败，重试请点击确定',
          success: function (res) {
            if (res.confirm) {
              _this.updateUserInfo(code, userInfo, iv, encryptedData, successCallback);
            }
          }
        });
      }
    });
  },

/**
 * 申请用户权限成功回调
 */
  applyUserAuthSuccessCallback: function (e, callback){
    var _this = this;    
    if (e.detail.errMsg == "getUserInfo:ok") {
      _this.globalData.hasUserAuth = true;
      _this._wxLogin(function (wxres) {
        var code = wxres.code;
        wx.getUserInfo({
          lang: 'zh_CN',
          success: function (res) {
            console.log(res)
            _this.globalData.localUserInfo = res.userInfo;
            _this.updateUserInfo(code, res.rawData, res.iv, res.encryptedData, callback)
          }
        })
        
      });
    } else {
      wx.showModal({
        title: '提示',
        content: '需要允许授权才可以正常使用包多多服务',
      })
    }
  },

  //由于未登录失败导致的请求失败，存入到请求队列里，等待登录成功之后再请求
  _pushRequest(apikey, extraData, successCallback, failCallback, completeCallback){
    var request = {
      apikey:apikey, 
      extraData: extraData, 
      successCallback: successCallback,
      failCallback: failCallback, 
      completeCallback: completeCallback
    }
    this.globalData.requestQueue.push(request);
  },
  //出栈所有的由于未登录失败导致失败的请求，并重试
  _popAllRequest(){
    var _this = this;
    while (_this.globalData.requestQueue.length > 0){
      var request = _this.globalData.requestQueue.pop();
      if ( config.env != "prd"){
        console.log("pop request:" + request.apikey);
      }
      _this.wxRequest(request.apikey, request.extraData, request.successCallback, request.failCallback, request.completeCallback);
    }
  },

  //设置取系统信息
  _setSysInfo: function () {
    var _this = this;
    wx.getSystemInfo({
      success: function (res) {
        _this.globalData.sysInfo = res;
      }
    })
  },
  _setGlobalUserInfo: function (userInfo) {
    this.globalData.userInfo = userInfo
    this.globalData.hasUserInfo = true;
    if (typeof this.userInfoReadyCallback === "function"){
      this.userInfoReadyCallback(userInfo);
    }
  },
  userInfoReadyCallback: function(userInfo){

  },

  //清除缓存
  clearStorage: function (key, callback) {
    wx.removeStorageSync(key);
    if (typeof callback === "function"){
      callback();
    } 
  },

  //异步请求
  wxRequest: function (apikey, extraData,successCallback, failCallback, completeCallback,hiddenTotast) {
    var _this = this;
    var apiUrl = config.apiUrl[apikey];
    var oldLoginTime = _this.globalData.loginTime;
    extraData.version = config.version;
    if (typeof extraData != 'object') {
      console.log('extraData should be an Object!!');
      return;
    }
    if (!hiddenTotast){
      wx.showToast({
        title: '请稍后...',
        icon: 'loading',
        duration: 3000,
        mask: true
      });
    }
    if(config.env != "prd"){
      console.log("request： " + apiUrl);
    }
    var err = _this.getApiErr(apikey);
    wx.request({
      url: apiUrl,
      header: { "Content-Type": config.contentType, "Cookie": _this.globalData.sessionKey},
      data: Object.assign(extraData),
      method: config.method,
      success: function (res) {
        var datas = res.data;
        if (!datas) {
          if (config.env != "prd") {
            console.log(apiUrl + "：数据异常！" + err.msg);
          }
          return;
        }

        if(typeof datas === "string"){
          datas = JSON.parse(datas);
        }
        if (!datas.data) {
          datas.data = {};
          if(config.env != "prd"){
            console.warn(apiUrl + "：数据异常，data为空或不存在.code:" + datas.code );          
          }
        }
        //处理用户登陆状态失效的问题
        if (datas.code == _this.globalData.userNotLoginCode ){
          if (_this.globalData.loginStatus == 1 && oldLoginTime != _this.globalData.loginTime){
            if (config.env != "prd") {
              console.log("retry request:" + apikey);
            }
             return _this.wxRequest(apikey, extraData, successCallback, failCallback, completeCallback);
          } 
          if (config.env != "prd") {
            console.log("push request:" + apikey);
          }
          _this._pushRequest(apikey, extraData, successCallback, failCallback, completeCallback);
          if (_this.globalData.loginStatus != 0){
            _this.login();
          }
          return;
        }

        if (typeof successCallback === "function") {
          successCallback(res);
        }
      },
      fail: function (res) {
        if (typeof failCallback === "function") {
          failCallback(res);
        }
      },
      complete: function (res) {
        if(config.env != "prd"){
          console.log(res)
        }
        if (!hiddenTotast) {
          wx.hideToast();
        }
        wx.stopPullDownRefresh();
        if (typeof completeCallback === "function"){
          completeCallback(res);
        }
      }
    })
  },
  //微信支付
  wxPay: function (param, successCallback, failCallback,cancleCallback) {
    var that = this;
    var timeStamp = parseInt((new Date).getTime() / 1000).toString();
    var sign = {
      'timeStamp': param.timeStamp,
      'nonceStr': param.nonceStr,
      'package': param.package,
      'signType': param.signType,
      'paySign': param.paySign,
      'success': function (res) {
        console.log("====pay success====");
        console.log(res);
        if (res.errMsg === 'requestPayment:ok') {
          if (typeof successCallback === "function"){
            successCallback();
          }
        }
      },
      'fail': function (res) {
        console.log("====pay fail====");
        console.log(res);
        if (res.errMsg === 'requestPayment:fail cancel') {
          console.log('用户取消支付' + res.errMsg);      
          if (typeof cancleCallback === "function"){
            cancleCallback(res)
          }    
        } else {
          console.log('调用支付失败' + res.errMsg, failCallback);          
          wx.showModal({
            title: '支付失败',
            content: '网络请求错误',
            success:function(e){
              if (typeof failCallback === "function") {
                failCallback(res);
              }
            }
          })
        }
      },
      'complete': function (res) {
        console.log("====pay complete====");
        console.log(res);
        if (res.errMsg === 'requestPayment:cancel') {
          console.log('用户取消支付' + res.errMsg, failCallback);
        }
      }
    }
    wx.requestPayment(sign);
  }, 
  getApiUrl: function (apikey){
    return config.apiUrl[apikey];
  },

  getApiErr: function (apiKey) {
    var apiErr = config.apiErr;
    var thatErr = apiErr['other'];
    for (var errKey in apiErr) {
      if (apiKey == errKey) {
        thatErr = apiErr[errKey];
      }
    }
    return thatErr;
  },

  getServiceConfig:function(successCallback,failCallback){
    var _this = this;
    _this.wxRequest("getSysConfig", {}, function (res) {
      var data = res.data;
      console.log(data);
      if (data.success == true) {
        _this.globalData.serverConfig = data.data; 
        if (data.data.invited == true){
          _this.globalData.invited = invited;
        }              
        if (typeof successCallback === "function") {
          successCallback()
        }
      } else {
        if (typeof failCallback === "function") {
          failCallback()
        }
      }
    }); 
  },


  /**
   * 检查用户授权头像
   */
  checkUserAuth:function(callback){
    var _this = this;
    // 查看是否授权
    if (_this.globalData.hasUserAuth == true){
      if (typeof callback === "function") {
        callback(true)
      }
    } else {
      wx.getSetting({
        success: function (res) {
          if (res.authSetting['scope.userInfo']) {
            _this.globalData.hasUserAuth = true;
            if (typeof callback === "function"){
              callback(true)
            }
          } else {
            if (typeof callback === "function") {
              callback(false)
            }
          }
        }
      })
    }
  },

  /**
 * 将当前为付款的订单存储
 */
  setUnpayHireOrderStorage: function (orderNo, goodsId, goodsName,goodsImg,notice) {
    var timestamp = new Date().getTime();
    var data = {
      orderNo: orderNo,
      goodsId: goodsId,
      goodsName: goodsName,
      goodsImg:goodsImg,
      timestamp: timestamp,
      notice: notice
    }
    wx.setStorage({
      key: constants.Constants.STORAGE_UN_PAY_ORDER,
      data: data,
    })
  },

  /**
 * 将当前为付款的订单存储
 * clear:true 表示清除掉。
 */
  getUnpayHireOrderStorage: function (clear) {
    var order = wx.getStorageSync(constants.Constants.STORAGE_UN_PAY_ORDER);
    if (true === clear) {
      if (order){
        wx.removeStorage({
          key: constants.Constants.STORAGE_UN_PAY_ORDER,
          success: function (res) { },
        })
      }
      return null;
    }
    if (order){
      var nowTime = new Date().getTime();
      if (nowTime - order.timestamp > 15 * 60 * 1000){
        wx.removeStorage({
          key: constants.Constants.STORAGE_UN_PAY_ORDER,
          success: function (res) { },
        })
      }else{
        return order;
      }
    }
    return null;
  },
  
  /**
 * 将当前为付款的购买订单存储
 */
  setUnpayPurchaseOrderStorage: function (orderNo, goodsId, goodsName, goodsImg, notice) {
    var timestamp = new Date().getTime();
    var data = {
      orderNo: orderNo,
      goodsId: goodsId,
      goodsName: goodsName,
      goodsImg: goodsImg,
      timestamp: timestamp,
      notice: notice
    }
    var orders = wx.getStorageSync(constants.Constants.STORAGE_UN_PAY_PURCHASE_ORDER);
    if (orders){
      orders.push(data)
      wx.setStorage({
        key: constants.Constants.STORAGE_UN_PAY_PURCHASE_ORDER,
        data: orders,
      })
    } else {
      wx.setStorage({
        key: constants.Constants.STORAGE_UN_PAY_PURCHASE_ORDER,
        data: [data],
      })
    }
    
  },

  /**
 * 将当前为付款的购买订单存储
 * clear:true 表示清除掉。
 */
  getUnpayPurchaseOrderStorage: function () {
    var orders = wx.getStorageSync(constants.Constants.STORAGE_UN_PAY_PURCHASE_ORDER);
    if (orders) {
      var nowTime = new Date().getTime();
      var srcOrdersLength = orders.length;
      for (var i = srcOrdersLength - 1; i>=0; i--){
        if (nowTime - orders[i].timestamp > 5 * 60 * 1000) {
          orders.splice(i,1);
        } 
      }
      if (orders.length != srcOrdersLength){
        wx.setStorage({
          key: constants.Constants.STORAGE_UN_PAY_PURCHASE_ORDER,
          data: orders,
        })
      }
      return orders;
    }
    return null;
  },

  /**
   * 根据订单号清除未付款的购买订单
   */
  removeUnpayPurchaseOrderStorage:function(orderNo){
    var orders = wx.getStorageSync(constants.Constants.STORAGE_UN_PAY_PURCHASE_ORDER);
    if (orders) {
      var nowTime = new Date().getTime();
      var srcOrdersLength = orders.length;
      for (var i = srcOrdersLength - 1; i >= 0; i--) {
        if (nowTime - orders[i].timestamp > 5 * 60 * 1000) {
          orders.splice(i, 1);
          continue;
        }
        if (orderNo == orders[i].orderNo){
          orders.splice(i, 1);
        }
      }
      if (orders.length != srcOrdersLength) {
        wx.setStorage({
          key: constants.Constants.STORAGE_UN_PAY_PURCHASE_ORDER,
          data: orders,
        })
      }
    }
  },

  /**
   * 获取购物车数量
   */
  getShoppingCartTotalCount:function(){
    var _this = this;
    _this.wxRequest("getShoppingCartTotalCount",{},function(res){
      var data = res.data;
      if(data.success === true){
        _this.globalData.shoppingCartBadge = data.data.total;
        _this.showShoppingCartBadge();
        _this.shoppingCartTotalCountReadyCallback();
      }
    },null,null,true);
  },
  /**
   * 购物车数量获取成功回调
   */
  shoppingCartTotalCountReadyCallback:function(){},

  /**
   * 增加购物车的数量
   */
  increaseShoppingCartTotalCount:function(incr){
    var _this = this;
    _this.globalData.shoppingCartBadge = _this.globalData.shoppingCartBadge + incr;
    _this.globalData.shoppingCartChangeFlag = true;
    _this.showShoppingCartBadge();
  },

  /**
   * 减少购物车的数量
   */
  decreaseShoppingCartTotalCount:function(decr){
    var _this = this;
    _this.globalData.shoppingCartBadge = _this.globalData.shoppingCartBadge - decr;
    _this.globalData.shoppingCartChangeFlag = true;
    _this.showShoppingCartBadge();
  },

  /**
   * 显示购物车上标
   */
  showShoppingCartBadge:function(){
    var _this = this;
    if (_this.globalData.shoppingCartBadge > 0) {
      wx.setTabBarBadge({
        index: 2,
        text: _this.globalData.shoppingCartBadge.toString(),
      })
    } else {
      wx.removeTabBarBadge({
        index: 2,
      })
    }
  },
  /**
   * 返回上一页面
   */
  backPrePage: function () {
    wx.navigateBack({
      delta: 1
    })
  }
})