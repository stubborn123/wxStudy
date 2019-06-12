// pages/myCoupons/list/list.js
var resubmit = require("../../../utils/resubmit.js");
var util = require("../../../utils/util.js");
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    states: {
      available: {
        code: 0,
        icon: '/images/available-icon.png',
        bgClass: [
          {
            typeCode: 0,
            typeClass: ''
          }, {
            typeCode: 1,
            typeClass: 't-vip-bg'
          }, {
            typeCode: 2,
            typeClass: 't-discount-bg'
          }
        ]
      },
      used: {
        code: 1,
        icon: '/images/coupon-used-icon.png',
        bgClass: 't-invalid-bg'
      },
      expired: {
        code: 2,
        icon: '/images/coupon-expired-icon.png',
        bgClass: 't-invalid-bg'
      },
      list: [
        'available',
        'used',
        'expired'
      ],
      goodsId: null,
      orderType: null
    },
    packageHasNext: true,
    plistNextPage: 1,
    pSize: 10,
    refreshTimestamp: 0,
    choosen: 'normal',
    normalList: [],
    expireList: [],
    cid:null,
    pid:null,
    nvabarData: {
      title: '优惠券', //导航栏 中间的标题
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var _this = this;
    if (options.hasOwnProperty('id')) {
      this.setData({
        goodsId: options.id
      })
    }

    if (options.hasOwnProperty('type')) {
      this.setData({
        orderType: options.type
      })
    }

    if (options.hasOwnProperty('addressId')) {
      this.setData({
        addressId: options.addressId
      })
    }

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var _this = this;
    var now = new Date();
    if (now.getTime() - _this.data.refreshTimestamp > 30 * 60 * 1000) {
      _this.queryCouponList(1, 10, false);
    }
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
    var _this = this;
    _this.queryCouponList(1, 10, false);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    var _this = this;
    if (_this.data.packageHasNext) {
      _this.queryCouponList(_this.data.plistNextPage, _this.data.pSize, true);
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  /**
   * 请求优惠券列表
   */
  queryCouponList: function (page, size, isAppend) {
    var _this = this;
    app.wxRequest("queryCouponList", { page: page, size: size }, function (res) {
      var data = res.data;
      if (data.success == true) {
        _this.handleResult(data, isAppend);
      }
    })
  },

  /**
   * 预处理数据
   */
  handleResult: function (data, isAppend) {
    var _this = this;
    var now = new Date();
    var list = data.data.result;
    for (var i = 0; i < list.length; i++) {
      list[i].endTimeStr = util.MsFormatToYYMMDD(list[i].endTime)
      if (list[i].userCouponStatus == _this.data.states.available.code) {
        list[i].bgClass = _this.data.states.available.bgClass[list[i].cardType].typeClass;
      } else if (list[i].userCouponStatus > 0) {
        list[i].bgClass = _this.data.states[_this.data.states.list[list[i].userCouponStatus]].bgClass;
      } else {
        list[i].bgClass = _this.data.states.used.bgClass;
      }
    }
    if (isAppend == false) {
      _this.setData({
        list: list,
        packageHasNext: data.data.hasNext,
        plistNextPage: data.data.nextPage
      })
    } else {
      _this.setData({
        list: _this.data.list.concat(list),
        packageHasNext: data.data.hasNext,
        plistNextPage: data.data.nextPage
      })
    }

    var _normalList = new Array()
    var _expireList = new Array()
    for (var i = 0; i < _this.data.list.length; i++) {

      // if (list[i].userCouponStatus == 0) {
      //   _normalList.push(list[i])
      // }
      // if (list[i].userCouponStatus == 2) {
      //   _expireList.push(list[i])
      // }

      if (list[i].endTime > now){
        _normalList.push(list[i])
      }else{
        _expireList.push(list[i])
      }

    }
    _this.setData({
      normalList: _normalList,
      expireList: _expireList
    })
  },

  toChoose: function (e) {
    var _this = this
    var _choosen = e.currentTarget.id
    console.log("choosen: " + _choosen)
    _this.setData({
      choosen: _choosen
    })
  },
  /**
   * 点击使用优惠券
   */
  toUseCoupons: function (e) {
    var _this = this;

    var _coupon_id = e.currentTarget.id

    //有商品ID可以跳转对应类型的的订单页
    if (_this.data.goodsId != null) {

      //购买订单
      if (_this.data.orderType == "5") {
        var _hit = resubmit.resubmit(500, _this, 'BTN_TO_CHOOSE_COUPONS');
        if (_hit) {
          wx.redirectTo({
            url: '/pages/myOrder/confirmPurchase?goodsId=' + _this.data.goodsId + "&couponId=" + _coupon_id + "&addressId=" + _this.data.addressId

            // url: _this.data.fromUrl + '?addressId=' + userAddressId + '&goodsId=' + _this.data.goodsId,
          })
        }

      }



    }
  },
  backHome: function () {
    wx.switchTab({
      url: '/pages/hire/hire/hire',
    })
  },
  /**
 * 返回上一页面，可以自定义
 */
  backPrePage: function () {
    app.backPrePage();
  }
})